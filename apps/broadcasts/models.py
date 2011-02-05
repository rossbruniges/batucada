from django.db import models
from django.contrib import admin

from drumbeat.models import ModelBase


class Broadcast(ModelBase):
    text = models.TextField(blank=True, default='')
    created_on = models.DateTimeField(auto_now_add=True)

admin.site.register(Broadcast)
