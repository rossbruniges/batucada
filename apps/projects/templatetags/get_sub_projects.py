from django import template
from projects.models import Project

register = template.Library()

@register.inclusion_tag('projects/sub_projects.html', takes_context=True)
def get_sub_projects(context, project_id, allowed, id):
    subs = Project.objects.filter(parent_project_id=project_id)

    return {
        'sub_projects' : subs,
        'allowed_subs' : allowed,
        'id': id,
        'logged_in' : context['user']
    }
