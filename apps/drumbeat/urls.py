from django.conf.urls.defaults import patterns, url
from django.http import HttpResponseRedirect


# mojo URLs - keep until mozillaopennews.org is going
urlpatterns = patterns('django.views.generic.simple',
    url(r'^journalism/participate/$', 'direct_to_template', {
        'template': 'drumbeat/journalism/participate.html',
   }, name='drumbeat_journalism_participate'),
   url(r'^journalism/process/$', 'direct_to_template', {
        'template': 'drumbeat/journalism/process.html',
   }, name='drumbeat_journalism_process'),
   url(r'^journalism/about/$', 'direct_to_template', {
        'template': 'drumbeat/journalism/about.html',
   }, name='drumbeat_journalism_about'),
   url(r'^journalism/learninglab/$', 'direct_to_template', {
        'template': 'drumbeat/journalism/learninglab.html',
   }, name='mojo_learning_lab')
)
urlpatterns += patterns('',
    url(r'^journalism/$',
       lambda x: HttpResponseRedirect('http://www.mozillaopennews.org/')),
    url(r'^journalism/2011/$',
       'drumbeat.views.journalism',
       name='drumbeat_journalism'),
    url(r'^journalism/challenges/$',
        'drumbeat.views.design_challenges',
        name='mojo_design_challenges'),
)

# URLs we want to retire
urlpatterns += patterns('',
   url(r'^terms-of-service/$', 'drumbeat.views.drumbeat_retired'
    , name='drumbeat_tos'),
   url(r'^about/$', 'drumbeat.views.drumbeat_retired'
    , name='drumbeat_about'),
   url(r'^editing-help/$', 'drumbeat.views.drumbeat_retired'
    , name='drumbeat_editing'),
   url(r'^abuse/(?P<type>[\w ]+)/(?P<obj>\w+)/$',
       'drumbeat.views.drumbeat_retired',
       name='drumbeat_abuse'),
)
