import csv
import sys

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.management.base import BaseCommand

from challenges.models import Submission


class Command(BaseCommand):
    help = 'Export Challenge Submissions'

    def build_absolute_url(self, relative):
        site = Site.objects.get(id=settings.SITE_ID)
        return 'http://' + site.domain + relative

    def handle(self, *args, **options):
        writer = csv.writer(sys.stdout, delimiter='|',
                            quoting=csv.QUOTE_MINIMAL)
        submissions = Submission.objects.filter(is_published=True)
        encode = lambda s: s and s.encode('utf-8') or s
        writer.writerow(('Id', 'Title', 'Summary', 'Description', 'Keywords',
                         'Bio', 'Challenge', 'Created on', 'Created by',
                         'Profile Bio', 'Submission URL'))
        for s in submissions:
            writer.writerow((s.id, encode(s.title), encode(s.summary),
                      encode(s.description), encode(s.keywords), encode(s.bio),
                      encode(s.get_challenge().title),
                      encode(s.created_on.isoformat()),
                      encode(s.created_by.username),
                      encode(s.created_by.bio),
                      encode(self.build_absolute_url(s.get_absolute_url()))))
