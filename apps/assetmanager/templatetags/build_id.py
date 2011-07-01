from django import template
from build import BUILD_ID_JS_INCLUDES

register = template.Library()

@register.simple_tag
def build_id():
   return BUILD_ID_JS_INCLUDES
