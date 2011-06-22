from django import template
from django.conf import settings

register = template.Library()

@register.inclusion_tag('assetmanager/files.html', takes_context = True)
def serve(context, type, area):
    request = context['request']
    if request.GET.get('debug'):
        is_dev = request.GET.get('debug')
    else:
        is_dev = settings.DEBUG
    if is_dev:
        files = settings.ASSETS[type][area]['dev']
    else:
        files = settings.ASSETS[type][area]['live']

    return {
        'files':files, 
        'type':type,
        'root':settings.MEDIA_URL
    }
