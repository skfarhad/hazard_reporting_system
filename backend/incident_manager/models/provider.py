from django.contrib.gis.db import models
from rest_framework_api_key.models import APIKey


class Provider(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    api_key = models.CharField(max_length=50, unique=True, blank=True)
    website_link = models.URLField(max_length=255, blank=True, null=True)
    logo_url = models.URLField(max_length=255, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.api_key:
            # Generate a unique API key using uuid4 and take the first 32 characters
            self.api_key = APIKey.objects.create_key(name=self.name)[1]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
