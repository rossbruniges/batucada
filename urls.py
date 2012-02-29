from django.conf import settings
from django.conf.urls.defaults import *
from django.http import HttpResponseRedirect

from django.contrib import admin
#admin.autodiscover()

urlpatterns = patterns('',
    (r'^admin/',         include(admin.site.urls)),
    (r'',                include('drumbeat.urls')),
    (r'',                include('dashboard.urls')),
    (r'^challenges/',    include('challenges.urls')),
    (url(r'^P2PU/', lambda x: HttpResponseRedirect('http://www.p2pu.org'))),
    (url(r'^events/', lambda x: HttpResponseRedirect('https://www.mozillafestival.org/'))),
    (url(r'^projects/(?P<slug>[\w-]+)/$', 'projects.views.move_on')),
)

media_url = settings.MEDIA_URL.lstrip('/').rstrip('/')
urlpatterns += patterns('',
    (r'^%s/(?P<path>.*)$' % media_url, 'django.views.static.serve',
     {
         'document_root': settings.MEDIA_ROOT,
     }),
)

urlpatterns += patterns('',
    (r'',                'drumbeat.views.drumbeat_retired'), 
    (r'',                include('wellknown.urls')),
    (r'',                include('activity.urls')),
    (r'^statuses/',      include('statuses.urls')),
    (r'^projects/',      include('projects.urls')),
    (r'^events/',        include('events.urls')),
    (r'^relationships/', include('relationships.urls')),
    (r'^messages/',      include('drumbeatmail.urls')),
    (r'^account/',       include('preferences.urls')),
    (r'^pubsub/',        include('django_push.subscriber.urls')),
    (r'',                include('users.urls')),    
)

handler500 = 'drumbeat.views.server_error'
