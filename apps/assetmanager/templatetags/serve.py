from django import template
from django.conf import settings

register = template.Library()

@register.inclusion_tag('assetmanager/files.html')
def serve(type, area):
    is_dev = settings.DEBUG
    if is_dev:
        files = settings.ASSETS[type][area]['dev']
    else:
        files = settings.ASSETS[type][area]['live']

    return {'files':files, 'type':type}
