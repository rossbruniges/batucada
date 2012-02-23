from feeds.models import FeedEntry

def feed_entries(request):
    feed_entries = FeedEntry.objects.filter(
        page='splash').order_by('-created_on')[0:3]

    return {
        'feed_entries': feed_entries
    }
