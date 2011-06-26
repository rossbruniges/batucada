from django import template
from django.conf import settings

from build import BUILD_ID_CSS, BUILD_ID_JS

register = template.Library()

@register.inclusion_tag('assetmanager/files.html', takes_context=True)
def serve(context, type, area):
    try:
        request = context['request'].GET.get('files')
    except KeyError:
        is_dev = settings.DEBUG
    else:
        if request == "original":
            is_dev = True
        else:
            is_dev = settings.DEBUG

    if is_dev:
        files = settings.ASSETS[type][area]['dev']
    else:
        files = settings.ASSETS[type][area]['live']

    return {
        'files':files, 
        'type':type,
        'root':settings.MEDIA_URL,
        'build':{
             'JS':BUILD_ID_JS,
             'CSS':BUILD_ID_CSS
        }
    }
