from django import forms
from links.models import Link

class LinksForm(forms.ModelForm):
    broadcast = forms.BooleanField(required=False)

    class Meta:
        model = Link
        fields = ('name', 'url', 'broadcast',)

    def save(self, commit=True):
        link = super(LinksForm, self).save(commit=False)
        link.broadcast = self.cleaned_data['broadcast']
        if commit:
            link.save()
        return link
