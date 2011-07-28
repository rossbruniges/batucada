from django import template
from challenges.models import Submission

register = template.Library()

@register.inclusion_tag('users/challenge_submissions.html', takes_context=True)
def user_submissions(context):

    submissions = Submission.objects.filter(is_published=True, created_by=context['profile'])

    return {
        'submissions' : submissions
    }
