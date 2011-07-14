from BeautifulSoup import BeautifulSoup

from django import template

register = template.Library()

@register.inclusion_tag('challenges/images.html')
def challenge_images(haystack):

    images = []
    soup = BeautifulSoup(haystack)
    all_images = soup.findAll('img')

    for i in all_images:
        data = {
            'src':i,
            'url':i['src']
        }
        
        images.append(data)

    return {
        'images':images
    }
