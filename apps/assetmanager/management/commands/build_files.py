# Build file based largely around that used in playdoh:
# https://github.com/jsocol/jingo-minify/blob/master/jingo_minify/management/commands/compress_assets.py

import os
from subprocess import call, PIPE

from django.conf import settings
from django.core.management.base import BaseCommand

path = lambda *a: os.path.join(settings.MEDIA_ROOT, *a)

class Command(BaseCommand):
    help = ("Compress and concatinate css and js assets held in settings.ASSETS to live file names held in each settings.ASSETS dictionary")

    def handle(self, **options):
        # point to yui compressor
        jar_path = (os.path.dirname(__file__), '..', '..', 'bin', 'yuicompressor-2.4.6.jar')
        path_to_jar = os.path.realpath(os.path.join(*jar_path))

        for ftype, bundle in settings.ASSETS.iteritems():
            for name, files in bundle.iteritems():
                files_all = []
                for fn in files['dev']:
                    if fn.endswith('.min.%s' % ftype):
                        files_all.append(fn)
                    else:
                        comp_fn = '%s/tmp/%s' % (ftype, '%s.min' % fn.split('/')[-1])
                        call('java -jar %s %s -o %s' % (path_to_jar, path(fn), path(comp_fn)), shell=True, stdout=PIPE)
                        files_all.append(comp_fn)
                
                end_file = path(bundle[name]['live'][0].lstrip('/'))
                real_files = [path(f.lstrip('/')) for f in files_all]

                call('cat %s > %s' % (' '.join(real_files), end_file), shell=True)

                print '### build_file for %s/%s ###' % (ftype, name)
                print real_files
                print 'merged down into %s' % end_file
