import os
import logging
import datetime
import bleach

from markdown import markdown

from django.core.cache import cache
from django.conf import settings
from django.contrib import admin
from django.db import models
from django.db.models import Count
from django.db.models.signals import pre_save, post_save, post_delete
from django.template.defaultfilters import slugify

from drumbeat import storage
from drumbeat.utils import get_partition_id, safe_filename
from drumbeat.models import ModelBase
from relationships.models import Relationship

from projects.utils import strip_remote_images
from projects.tasks import ThumbnailGenerator

import caching.base

TAGS = ('h1', 'h2', 'a', 'b', 'em', 'i', 'strong',
        'ol', 'ul', 'li', 'hr', 'blockquote', 'p',
        'span', 'pre', 'code', 'img')

ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title'],
    'img': ['src', 'alt'],
}

log = logging.getLogger(__name__)


def determine_image_upload_path(instance, filename):
    return "images/projects/%(partition)d/%(filename)s" % {
        'partition': get_partition_id(instance.pk),
        'filename': safe_filename(filename),
    }


def determine_media_upload_path(instance, filename):
    if instance.is_video():
        fmt = "videos/projects/%(partition)d/%(filename)s"
    else:
        fmt = "images/projects/%(partition)d/%(filename)s"
    return fmt % {
        'partition': get_partition_id(instance.project.pk),
        'filename': safe_filename(filename),
    }


class ProjectManager(caching.base.CachingManager):

    def get_popular(self, limit=0):
        popular = cache.get('projects_popular')
        if not popular:
            rels = Relationship.objects.values('target_project').annotate(
                Count('id')).exclude(target_project__isnull=True).filter(
                target_project__featured=False).order_by('-id__count')[:limit]
            popular = [r['target_project'] for r in rels]
            cache.set('projects_popular', popular, 3000)
        return Project.objects.filter(id__in=popular)


class Project(ModelBase):
    """Placeholder model for projects."""
    object_type = 'http://drumbeat.org/activity/schema/1.0/project'
    generalized_object_type = 'http://activitystrea.ms/schema/1.0/group'

    name = models.CharField(max_length=100, unique=True)
    short_description = models.CharField(max_length=125)
    long_description = models.TextField()

    detailed_description = models.TextField()
    detailed_description_html = models.TextField(null=True, blank=True)

    image = models.ImageField(upload_to=determine_image_upload_path, null=True,
                              storage=storage.ImageStorage(), blank=True)

    slug = models.SlugField(unique=True)
    created_by = models.ForeignKey('users.UserProfile',
                                   related_name='projects')
    featured = models.BooleanField()
    allow_challenges = models.BooleanField()
    allow_sub_projects = models.BooleanField()
    sub_projects_metaname = models.CharField(max_length=100, default="Sub-project")
    parent_project_id = models.IntegerField(blank=True, null=True)
    created_on = models.DateTimeField(
        auto_now_add=True, default=datetime.date.today())

    objects = ProjectManager()

    def followers(self):
        """Return a list of users following this project."""
        relationships = Relationship.objects.select_related(
            'source', 'created_by').filter(target_project=self)
        return [rel.source for rel in relationships]

    def __unicode__(self):
        return self.name

    @models.permalink
    def get_absolute_url(self):
        return ('projects_show', (), {
            'slug': self.slug,
        })

    def save(self):
        """Make sure each project has a unique slug."""
        count = 1
        if not self.slug:
            slug = slugify(self.name)
            self.slug = slug
            while True:
                existing = Project.objects.filter(slug=self.slug)
                if len(existing) == 0:
                    break
                self.slug = slug + str(count)
                count += 1
        super(Project, self).save()
admin.site.register(Project)


class ProjectMedia(ModelBase):
    video_mimetypes = (
        'video/ogg',
        'video/webm',
        'video/mp4',
        'application/ogg',
        'audio/ogg',
    )
    image_mimetypes = (
        'image/png',
        'image/jpg',
        'image/jpeg',
        'image/gif',
    )
    accepted_mimetypes = video_mimetypes + image_mimetypes
    project_file = models.FileField(upload_to=determine_media_upload_path)
    project = models.ForeignKey(Project)
    mime_type = models.CharField(max_length=80, null=True)
    thumbnail = models.ImageField(upload_to=determine_image_upload_path,
                                  null=True, blank=True,
                                  storage=storage.ImageStorage())

    def thumbnail_or_default(self):
        """Return project media's thumbnail or a default."""
        return self.thumbnail or 'images/file-default.png'

    def is_video(self):
        return self.mime_type in self.video_mimetypes


###########
# Signals #
###########


def project_markdown_handler(sender, **kwargs):
    project = kwargs.get('instance', None)
    if not isinstance(project, Project):
        return
    log.debug("Creating html project description")
    if project.detailed_description:
        project.detailed_description_html = bleach.clean(
            markdown(project.detailed_description),
            tags=TAGS, attributes=ALLOWED_ATTRIBUTES)
        project.detailed_description_html = strip_remote_images(
            project.detailed_description_html, project.pk)

pre_save.connect(project_markdown_handler, sender=Project)


def project_creation_handler(sender, **kwargs):
    project = kwargs.get('instance', None)
    created = kwargs.get('created', False)

    if not created or not isinstance(project, Project):
        log.debug("Nothing to do, returning")
        return

    log.debug("Creating relationship between project creator and project")
    Relationship(source=project.created_by,
                 target_project=project).save()

    try:
        from activity.models import Activity
        act = Activity(actor=project.created_by,
                       verb='http://activitystrea.ms/schema/1.0/post',
                       project=project)
        act.save()
    except ImportError:
        return
post_save.connect(project_creation_handler, sender=Project)


def projectmedia_thumbnail_generator(sender, **kwargs):
    media = kwargs.get('instance', None)
    created = kwargs.get('created', False)

    if not created or not isinstance(media, ProjectMedia):
        return

    ThumbnailGenerator.apply_async(args=(media,))
post_save.connect(projectmedia_thumbnail_generator, sender=ProjectMedia)


def projectmedia_scrubber(sender, **kwargs):
    media = kwargs.get('instance', None)
    if not isinstance(media, ProjectMedia):
        return
    media_root = getattr(settings, 'MEDIA_ROOT', None)
    if not media_root:
        return
    path = lambda f: os.path.join(media_root, f)
    files = []
    if media.project_file:
        files.append(path(media.project_file.name))
    if media.thumbnail:
        files.append(path(media.thumbnail.name))
    for f in files:
        if os.path.exists(f):
            os.unlink(f)
post_delete.connect(projectmedia_scrubber, sender=ProjectMedia)
