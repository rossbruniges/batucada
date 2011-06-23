from django import template
from django.conf import settings

register = template.Library()

@register.inclusion_tag('assetmanager/files.html', takes_context = True)
def serve(context, type, area):
    request = context['request'].GET.get('debug')
    if request == "True":
        is_dev = True
    else:
        is_dev = settings.DEBUG

    print is_dev

    if is_dev:
        files = settings.ASSETS[type][area]['dev']
    else:
        files = settings.ASSETS[type][area]['live']

    return {
        'files':files, 
        'type':type,
        'root':settings.MEDIA_URL
    }
