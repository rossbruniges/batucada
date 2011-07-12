from BeautifulSoup import BeautifulSoup

from django import template

register = template.Library()

@register.inclusion_tag('challenges/images.html')
def challenge_images(haystack):

    soup = BeautifulSoup(haystack)
    images = soup.findAll('img')

    return {
        'images':images
    }
