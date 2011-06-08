# Build file based largely around that used in playdoh:
# https://github.com/jsocol/jingo-minify/blob/master/jingo_minify/management/commands/compress_assets.py

# Things to do:
# Loop through each file type (css||js)
# Loop through each inner label (site||styling||code)
# Concat contents of dev list into some wack file
# Compress and create file name HELD withi live list

import os
from subprocess import call, PIPE

from django.conf import settings
from django.core.management.base import BaseCommand

path = lambda *a: os.path.join(settings.MEDIA_ROOT, *a)

class Command(BaseCommand):
    help = ("Compress and concatinate css and js assets held in settings.ASSETS to live file names held in each settings.ASSETS hash")

    def handle(self, **options):
        # point to yui compressor
        jar_path = (os.path.dirname(__file__), '..', '..', 'bin', 'yuicompressor-2.4.6.jar')
        path_to_jar = os.path.realpath(os.path.join(*jar_path))

        for ftype, bundle in settings.ASSETS.iteritems():
            for name, files in bundle.iteritems():
                files_all = []
                for fn in files['dev']:
                    files_all.append(fn)
                concatted_file = path(ftype, 'tmp', '%s-all.%s' % (name, ftype))
                compressed_file = path(bundle[name]['live'][0].lstrip('/'))
                real_files = [path(f.lstrip('/')) for f in files_all]

                print '### ASSETS COMMAND for %s/%s ###' % (ftype, name)
                print concatted_file
                print compressed_file
                print real_files
                print '### ###'

                # I am fully aware I now have to concat and create the files...
