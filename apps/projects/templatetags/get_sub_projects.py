from django import template
from django.shortcuts import get_object_or_404
from projects.models import Project

register = template.Library()

@register.inclusion_tag('projects/sub_projects.html', takes_context=True)
def get_sub_projects(context, project_id, allowed, id):
    project = get_object_or_404(Project, pk=project_id)
    subs = Project.objects.filter(parent_project_id=project_id)

    return {
        'project_metaname':project.sub_projects_metaname,
        'sub_projects' : subs,
        'allowed_subs' : allowed,
        'id': id,
        'logged_in' : context['user']
    }
