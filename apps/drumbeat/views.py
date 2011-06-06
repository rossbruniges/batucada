from django.conf import settings
from django import http
from django.template import RequestContext, Context, loader
from django.shortcuts import render_to_response

from challenges.models import Challenge, Submission
from feeds.models import FeedEntry
from users.models import UserProfile
from users.tasks import SendUserEmail
from drumbeat.forms import AbuseForm


def server_error(request):
    """Make MEDIA_URL available to the 500 template."""
    t = loader.get_template('500.html')
    return http.HttpResponseServerError(t.render(Context({
        'MEDIA_URL': settings.MEDIA_URL,
    })))


def report_abuse(request, obj, type):
    """Report abusive or irrelavent content."""
    if request.method == 'POST':
        # we only use the form for the csrf middleware. skip validation.
        form = AbuseForm(request.POST)
        body = """
        User %s has reported the following content as objectionable:

        Model: %s, ID: %s
        """ % (request.user.get_profile().name, type, obj)
        subject = "Abuse Report"
        try:
            profile = UserProfile.objects.get(email=settings.ADMINS[0][1])
            SendUserEmail.apply_async(args=(profile, subject, body))
        except:
            pass
        return render_to_response('drumbeat/report_received.html', {},
                                  context_instance=RequestContext(request))
    else:
        form = AbuseForm()
    return render_to_response('drumbeat/report_abuse.html', {
        'form': form,
        'obj': obj,
        'type': type,
    }, context_instance=RequestContext(request))


def journalism(request):
    feed_entries = FeedEntry.objects.filter(
        page='mojo').order_by('-created_on')[0:4]
    feed_url = getattr(settings, 'FEED_URLS', None)
    if feed_url and 'mojo' in feed_url:
        feed_url = feed_url['mojo']
    slugs = ('open-webs-killer-app', 'beyond-comment-threads',
             'unlocking-video')
    counts = {}
    for slug in slugs:
        challenge = Challenge.objects.get(slug=slug)
        key = slug.replace('-', '')
        counts[key] = Submission.objects.filter(challenge=challenge).count()
    return render_to_response('drumbeat/journalism/index.html', {
        'feed_entries': feed_entries,
        'feed_url': feed_url,
        'counts': counts,
    }, context_instance=RequestContext(request))
