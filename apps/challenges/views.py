from datetime import datetime
import logging

from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.core.urlresolvers import reverse
from django.contrib.contenttypes.models import ContentType
from django.db import connection
from django.db.utils import IntegrityError
from django.http import (HttpResponse, HttpResponseRedirect,
                         HttpResponseForbidden, Http404)
from django.shortcuts import get_object_or_404, render_to_response
from django.utils import simplejson
from django.utils.translation import ugettext as _
from django.template import RequestContext
from django.template.defaultfilters import truncatewords
from django.template.loader import render_to_string
from django.views.decorators.http import require_http_methods

from commonware.decorators import xframe_sameorigin

from challenges.models import Challenge, Submission, Judge, VoterDetails
from challenges.forms import (ChallengeForm, ChallengeImageForm,
                              ChallengeContactForm,
                              SubmissionSummaryForm, SubmissionForm,
                              SubmissionDescriptionForm,
                              JudgeForm, VoterDetailsForm)
from challenges.decorators import (challenge_owner_required,
                                   submission_owner_required)
from projects.models import Project

from drumbeat import messages
from users.decorators import login_required
from voting.models import Vote

log = logging.getLogger(__name__)


@login_required
def create_challenge(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    if not project.allow_challenges:
        return HttpResponseForbidden()

    user = request.user.get_profile()

    if request.method == 'POST':
        form = ChallengeForm(request.POST)
        if form.is_valid():
            challenge = form.save(commit=False)
            challenge.created_by = user
            challenge.project = project
            challenge.save()

            messages.success(request,
                             _('Your new challenge has been created.'))
            return HttpResponseRedirect(reverse('challenges_show', kwargs={
                'slug': challenge.slug,
                }))
        else:
            messages.error(request, _('Unable to create your challenge.'))
    else:
        form = ChallengeForm()

    context = {
        'form': form,
        'project': project,
    }
    return render_to_response('challenges/challenge_edit_summary.html',
                              context,
                              context_instance=RequestContext(request))


@login_required
@challenge_owner_required
def edit_challenge(request, slug):
    challenge = get_object_or_404(Challenge, slug=slug)
    user = request.user.get_profile()

    if user != challenge.created_by:
        return HttpResponseForbidden()

    if request.method == 'POST':
        form = ChallengeForm(request.POST, instance=challenge)
        if form.is_valid():
            form.save()
            messages.success(request, _('Challenge updated!'))
            return HttpResponseRedirect(reverse('challenges_show', kwargs={
                'slug': challenge.slug,
                }))
        else:
            messages.error(request, _('Unable to update your challenge.'))
    else:
        form = ChallengeForm(instance=challenge)

    context = {
        'form': form,
        'project': challenge.project,
        'challenge': challenge,
    }

    return render_to_response('challenges/challenge_edit_summary.html',
                              context,
                              context_instance=RequestContext(request))


@login_required
@xframe_sameorigin
@require_http_methods(['POST'])
@challenge_owner_required
def edit_challenge_image_async(request, slug):
    challenge = get_object_or_404(Challenge, slug=slug)
    form = ChallengeImageForm(request.POST, request.FILES, instance=challenge)
    if form.is_valid():
        instance = form.save()
        return HttpResponse(simplejson.dumps({
            'filename': instance.image.name,
        }))
    return HttpResponse(simplejson.dumps({
        'error': _('There was an error uploading your image.'),
    }))


@login_required
@challenge_owner_required
def edit_challenge_image(request, slug):
    challenge = get_object_or_404(Challenge, slug=slug)

    if request.method == "POST":
        form = ChallengeImageForm(
            request.POST, request.FILES, instance=challenge)
        if form.is_valid():
            messages.success(request, _('Challenge image updated'))
            form.save()
            return HttpResponseRedirect(
                reverse('challenges_edit_image', kwargs={
                    'slug': challenge.slug,
                }))
        else:
            messages.error(request,
                           _('There was an error uploading your image'))
    else:
        form = ChallengeImageForm(instance=challenge)

    context = {
        'form': form,
        'challenge': challenge,
    }

    return render_to_response('challenges/challenge_edit_image.html', context,
                              context_instance=RequestContext(request))

def show_challenge_master(request, slug):
    challenge = get_object_or_404(Challenge, slug=slug)

    all_submissions = challenge.submission_set
    num_submissions = all_submissions.count()

    try:
        profile = request.user.get_profile()
    except:
        profile = None

    remaining = challenge.end_date - datetime.now()

    if challenge.end_date < datetime.now():
        if challenge.allow_voting:
            do_paginate = 4
            tmpl = 'challenges/challenge_voting.html'
            form = False
            filter_submissions = all_submissions.filter(is_published=True) 
        else:
            do_paginate = False
            tmpl = 'challenges/challenge_winners.html'
            form = False
            filter_submissions = all_submissions.filter(is_winner=True)
    else:
        do_paginate = 10
        tmpl = 'challenges/challenge.html'
        form = SubmissionSummaryForm()
        filter_submissions = all_submissions.filter(is_published=True)

    qn = connection.ops.quote_name
    ctype = ContentType.objects.get_for_model(Submission)

    submissions_set = filter_submissions.extra(
        select={'score':"""
        SELECT SUM(vote)
        FROM %s
        WHERE content_type_id = %s
        AND object_id = %s.id
        """ % (qn(Vote._meta.db_table), ctype.id, qn(Submission._meta.db_table))
        },
        order_by=['?']
    )

    if do_paginate:
        paginator = Paginator(submissions_set, do_paginate)
        try:
            page = int(request.GET.get('page', '1'))
        except ValueError:
           page = 1
        try:
            submissions = paginator.page(page)
        except (EmptyPage, InvalidPage):
            submissions = paginator.page(paginator.num_pages)
    else:
        submissions = submissions_set
    
    context = {
        'challenge':challenge,
        'submissions':submissions,
        'num_submissions':num_submissions,
        'full_data':False,
        'profile':profile,
        'remaining':remaining,
        'form':form
    }

    return render_to_response(tmpl, context,
        context_instance=RequestContext(request))

def show_challenge_winners(request, slug):
    challenge = get_object_or_404(Challenge, slug=slug)

    order = '?'
    
    submission_set = challenge.submission_set.filter(is_winner=True).extra(
        order_by=[order]
    )

    try:
        profile = request.user.get_profile()
    except:
        profile = None

    context = {
        'challenge': challenge,
        'submissions': submission_set,
        'profile': profile,
        'full_data': 'false'
    }

    return render_to_response('challenges/challenge_winners.html', context,
                              context_instance=RequestContext(request))

def show_challenge(request, slug):
    challenge = get_object_or_404(Challenge, slug=slug)

    qn = connection.ops.quote_name
    ctype = ContentType.objects.get_for_model(Submission)

    nsubmissions = challenge.submission_set.count()

    if challenge.allow_voting:
        order = '?'
    else:
        order = '-created_on'
    
    submission_set = challenge.submission_set.filter(is_published=True).extra(
        select={'score': """
        SELECT SUM(vote)
        FROM %s
        WHERE content_type_id = %s
        AND object_id = %s.id
        """ % (qn(Vote._meta.db_table), ctype.id,
               qn(Submission._meta.db_table))
        },
        order_by=[order]
    )

    if challenge.allow_voting:
        paginator = Paginator(submission_set, 4)
        tmpl = 'challenges/challenge_voting.html'
    else:
        paginator = Paginator(submission_set, 10)
        tmpl = 'challenges/challenge.html'

    try:
        page = int(request.GET.get('page', '1'))
    except ValueError:
        page = 1

    try:
        submissions = paginator.page(page)
    except (EmptyPage, InvalidPage):
        submissions = paginator.page(paginator.num_pages)

    form = SubmissionSummaryForm()
    remaining = challenge.end_date - datetime.now()

    try:
        profile = request.user.get_profile()
    except:
        profile = None

    context = {
        'challenge': challenge,
        'submissions': submissions,
        'nsubmissions': nsubmissions,
        'form': form,
        'profile': profile,
        'remaining': remaining,
        'full_data': 'false'
    }

    return render_to_response(tmpl, context,
                              context_instance=RequestContext(request))


def show_all_submissions(request, slug):
    challenge = get_object_or_404(Challenge, slug=slug)

    qn = connection.ops.quote_name
    ctype = ContentType.objects.get_for_model(Submission)

    submission_set = challenge.submission_set.filter(
        is_published=True).extra(select={'score': """
        SELECT SUM(vote)
        FROM %s
        WHERE content_type_id = %s
        AND object_id = %s.id
        """ % (qn(Vote._meta.db_table), ctype.id,
               qn(Submission._meta.db_table))
        },
        order_by=['-created_on']
    )
    paginator = Paginator(submission_set, 10)

    try:
        page = int(request.GET.get('page', '1'))
    except ValueError:
        page = 1

    try:
        submissions = paginator.page(page)
    except (EmptyPage, InvalidPage):
        submissions = paginator.page(paginator.num_pages)

    form = SubmissionSummaryForm()
    remaining = challenge.end_date - datetime.now()

    try:
        profile = request.user.get_profile()
    except:
        profile = None

    context = {
        'challenge': challenge,
        'submissions': submissions,
        'form': form,
        'profile': profile,
        'remaining': remaining
    }

    return render_to_response('challenges/all_submissions.html', context,
                              context_instance=RequestContext(request))


def show_challenge_full(request, slug):
    challenge = get_object_or_404(Challenge, slug=slug)

    context = {
        'challenge': challenge,
    }

    return render_to_response('challenges/challenge_full.html', context,
                              context_instance=RequestContext(request))


@login_required
@challenge_owner_required
def contact_entrants(request, slug):
    challenge = get_object_or_404(Challenge, slug=slug)
    if request.method == 'POST':
        form = ChallengeContactForm(request.POST)
        if form.is_valid():
            form.save(sender=request.user)
            messages.info(request, _('Message sent successfully.'))
            return HttpResponseRedirect(reverse('challenges_show', kwargs={
                'slug': challenge.slug,
            }))
    else:
        form = ChallengeContactForm()
        form.fields['challenge'].initial = challenge.pk

    return render_to_response('challenges/contact_entrants.html', {
        'form': form,
        'challenge': challenge,
    }, context_instance=RequestContext(request))


def voting_get_more(request, slug):
    challenge = get_object_or_404(Challenge, slug=slug)
    if not challenge.allow_voting:
        return HttpResponseForbidden()

    count = request.GET.get('count', 1)
    exclude = request.GET.get('exclude', [])
    if exclude:
        exclude = exclude.split(',')

    submissions = challenge.submission_set.exclude(
        pk__in=exclude).order_by('?')[:count]

    try:
        profile = request.user.get_profile()
    except:
        profile = None

    response = []
    for submission in submissions:
        response.append(
            render_to_string('challenges/_voting_resource.html',
                             {'submission': submission,
                              'challenge': challenge,
                              'full_data': 'false',
                              'profile': profile},
                            context_instance=RequestContext(request)))

    return HttpResponse(simplejson.dumps({
        'submissions': response,
    }))


@login_required
def create_submission(request, slug):
    challenge = get_object_or_404(Challenge, slug=slug)
    if not challenge.is_active():
        return HttpResponseForbidden()

    user = request.user.get_profile()

    if request.method == 'POST':
        truncate_title = lambda s: truncatewords(s, 10)[:90]
        post_data = request.POST.copy()
        post_data['title'] = truncate_title(post_data['summary'])
        form = SubmissionForm(post_data)
        if form.is_valid():
            submission = form.save(commit=False)
            submission.title = truncate_title(submission.summary)
            submission.created_by = user
            submission.is_published = False
            submission.save()

            submission.challenge.add(challenge)

            messages.success(request, _('Your submission has been created'))
            return HttpResponseRedirect(reverse('submission_edit', kwargs={
                'slug': challenge.slug,
                'submission_id': submission.pk,
                }))
        else:
            messages.error(request, _('Unable to create your submission'))
    else:
        form = SubmissionForm()

    context = {
        'form': form,
        'challenge': challenge,
    }

    return render_to_response('challenges/submission_edit.html', context,
                              context_instance=RequestContext(request))


@login_required
@submission_owner_required
def edit_submission(request, slug, submission_id):
    challenge = get_object_or_404(Challenge, slug=slug)
    if not challenge.entrants_can_edit:
        return HttpResponseForbidden()

    try:
        submission = challenge.submission_set.get(pk=submission_id)
    except:
        raise Http404

    if request.method == 'POST':
        form = SubmissionForm(request.POST, instance=submission)
        if form.is_valid():
            submission = form.save()
            messages.success(request, _('Your submission has been edited.'))

            if 'publish' in request.POST:
                submission.publish()

            return HttpResponseRedirect(reverse('submission_edit_description',
                kwargs={
                    'slug': challenge.slug,
                    'submission_id': submission.pk,
            }))
        else:
            messages.error(request, _('Unable to update your submission'))
    else:
        form = SubmissionForm(instance=submission)

    ctx = {
        'challenge': challenge,
        'submission': submission,
        'form': form,
    }

    return render_to_response('challenges/submission_edit_summary.html',
                              ctx, context_instance=RequestContext(request))


@login_required
@submission_owner_required
def edit_submission_description(request, slug, submission_id):
    challenge = get_object_or_404(Challenge, slug=slug)
    if not challenge.entrants_can_edit:
        return HttpResponseForbidden()

    try:
        submission = challenge.submission_set.get(pk=submission_id)
    except:
        raise Http404

    if request.method == 'POST':
        form = SubmissionDescriptionForm(request.POST, instance=submission)
        if form.is_valid():
            submission = form.save()
            messages.success(request, _('Your submission has been edited.'))

            if 'publish' in request.POST:
                submission.publish()

            return HttpResponseRedirect(reverse('submission_edit_share',
                kwargs={
                    'slug': challenge.slug,
                    'submission_id': submission.pk
            }))
        else:
            messages.error(request, _('Unable to update your submission'))
    else:
        form = SubmissionDescriptionForm(instance=submission)

    ctx = {
        'challenge': challenge,
        'submission': submission,
        'form': form
    }

    return render_to_response('challenges/submission_edit_description.html',
                              ctx, context_instance=RequestContext(request))


@login_required
@submission_owner_required
def edit_submission_share(request, slug, submission_id):
    challenge = get_object_or_404(Challenge, slug=slug)
    try:
        submission = challenge.submission_set.get(pk=submission_id)
    except:
        raise Http404

    url = request.build_absolute_uri(reverse('submission_show', kwargs={
        'slug': challenge.slug, 'submission_id': submission.pk
    }))

    ctx = {
        'challenge': challenge,
        'submission': submission,
        'url': url,
    }

    return render_to_response('challenges/submission_edit_share.html',
                              ctx, context_instance=RequestContext(request))


@login_required
@submission_owner_required
def delete_submission(request, slug, submission_id):
    challenge = get_object_or_404(Challenge, slug=slug)
    try:
        submission = challenge.submission_set.get(pk=submission_id)
    except:
        raise Http404

    if request.method == 'POST':
        post_data = request.POST.copy()
        if post_data['confirm']:
            submission.delete()
            messages.success(request, _('Your submission has been deleted'))

            return HttpResponseRedirect(reverse('challenges_show',
                kwargs={'slug': challenge.slug}))
        else:
            messages.error(request, _('Unable to delete submission'))

    context = {
        'challenge': challenge,
        'submission': submission
    }

    return render_to_response('challenges/delete_confirm.html', context,
                              context_instance=RequestContext(request))


def show_submission(request, slug, submission_id):
    challenge = get_object_or_404(Challenge, slug=slug)
    try:
        submission = challenge.submission_set.get(pk=submission_id)
    except:
        raise Http404

    if not submission.is_published:
        if not request.user.is_authenticated():
            raise Http404
        user = request.user.get_profile()
        if user != submission.created_by:
            raise Http404

    context = {
        'challenge': challenge,
        'submission': submission,
    }

    return render_to_response('challenges/submission_show.html', context,
                              context_instance=RequestContext(request))


@login_required
@challenge_owner_required
def challenge_judges(request, slug):
    challenge = get_object_or_404(Challenge, slug=slug)

    if request.method == 'POST':
        form = JudgeForm(request.POST)
        if form.is_valid():
            judge = form.save(commit=False)
            judge.challenge = challenge

            try:
                judge.save()
                messages.success(request, _('Judge has been added'))
            except IntegrityError:
                messages.error(request, _('User is already a judge'))

            return HttpResponseRedirect(reverse('challenges_judges', kwargs={
                'slug': challenge.slug,
            }))
        else:
            messages.error(request, _('Unable to add judge.'))
    else:
        form = JudgeForm()

    judges = Judge.objects.filter(challenge=challenge)

    context = {
        'challenge': challenge,
        'form': form,
        'judges': judges,
    }

    return render_to_response('challenges/challenge_judges.html', context,
                              context_instance=RequestContext(request))


@login_required
@challenge_owner_required
def challenge_judges_delete(request, slug, judge):
    if request.method == 'POST':
        challenge = get_object_or_404(Challenge, slug=slug)
        judge = get_object_or_404(Judge, pk=judge)
        if judge.challenge != challenge:
            return HttpResponseForbidden()
        judge.delete()
        messages.success(request, _('Judge removed.'))
    return HttpResponseRedirect(reverse('challenges_judges', kwargs={
        'slug': challenge.slug,
    }))


@login_required
def submissions_voter_details(request, submission_id):
    submission = get_object_or_404(Submission, pk=submission_id)

    try:
        voter = VoterDetails.objects.get(user=request.user.get_profile())
    except:
        voter = None

    if request.method == 'POST':
        form = VoterDetailsForm(request.POST, instance=voter)
        if form.is_valid():
            details = form.save(commit=False)
            details.user = request.user.get_profile()
            details.save()
            form.save_m2m()

            messages.success(request, _('Your details were saved.'))

            return HttpResponseRedirect(reverse('challenges_show', kwargs={
                'slug': submission.challenge.get().slug,
            }))
        else:
            messages.error(request, _('Unable to save details'))
    else:
        form = VoterDetailsForm(instance=voter)
    context = {
        'form': form,
        'submission': submission,
    }

    return render_to_response('challenges/voter_details.html', context,
                              context_instance=RequestContext(request))
