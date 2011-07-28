from django import template
from projects.models import Project

register = template.Library()

@register.inclusion_tag('projects/sub_projects.html')
def get_subProjects(project_id, allowed, id):
    subs = Project.objects.filter(parent_projectID=project_id)

    return {
        'sub_projects' : subs,
        'allowed_subs' : allowed,
        'id': id
    }
