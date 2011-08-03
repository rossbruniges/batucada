from django import template
from django.conf import settings
from django.shortcuts import get_object_or_404
from projects.models import Project

register = template.Library()

@register.inclusion_tag('projects/sub_projects.html', takes_context=True)
def get_sub_projects(context, project_id, allowed, id):
    project = get_object_or_404(Project, pk=project_id)
    subs = Project.objects.filter(parent_project_id=project_id)

    return {
        'project_metaname':project.sub_projects_metaname,
        'project_slug' : project.slug,
        'sub_projects' : subs[:settings.NUM_CHILD_OBJECTS],
        'nsub_projects' : subs.count(),
        'allowed_subs' : allowed,
        'id': id,
        'logged_in' : context['user'],
        'login_url': context['login_with_redirect_url'],
        'register_url' : context['register_with_redirect_url'],
        'max_projects' : settings.NUM_CHILD_OBJECTS
    }
