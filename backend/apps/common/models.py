from django.db import models
from django.utils import timezone


class TSFieldsIndexed(models.Model):
    ts_created = models.DateTimeField(default=timezone.now, db_index=True)
    ts_updated = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class TSFields(models.Model):
    ts_created = models.DateTimeField(default=timezone.now)
    ts_updated = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

