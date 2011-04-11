from django.conf.urls.defaults import patterns, url


urlpatterns = patterns('',
  url(r'^settings/', 'preferences.views.settings',
      name='preferences_settings'),
  url(r'^connections/', 'preferences.views.connections',
      name='preferences_connections'),
  url(r'^delete/', 'preferences.views.delete',
      name='preferences_delete'),
)
