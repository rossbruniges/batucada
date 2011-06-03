from django import forms
from links.models import Link

class LinksForm(forms.ModelForm):
    broadcast = forms.BooleanField(required=False, initial=True)

    class Meta:
        model = Link
        fields = ('name', 'url',)
