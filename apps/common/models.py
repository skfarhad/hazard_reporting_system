from django.contrib.postgres.fields import ArrayField
from django.core.validators import RegexValidator
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



hex_colour = RegexValidator(r"^#[0-9A-Fa-f]{6}$", "Use a hex colour like #DC2626.")


class TypeBase(models.Model):
    """An admin-editable category (need type, hazard type) with SMS keywords and display fields."""

    code = models.SlugField(max_length=40, unique=True)
    label_en = models.CharField(max_length=80)
    label_bn = models.CharField(max_length=80)
    sms_keywords = ArrayField(
        models.CharField(max_length=40), default=list, blank=True,
        help_text="Words that select this type in an SMS, in any case (e.g. rescue, uddhar).",
    )
    icon = models.CharField(max_length=40, help_text="Bootstrap Icons name, e.g. life-preserver.")
    colour = models.CharField(max_length=7, validators=[hex_colour])
    sort_order = models.PositiveSmallIntegerField(default=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True
        ordering = ["sort_order", "label_en"]

    def save(self, *args, **kwargs):
        self.sms_keywords = [k.strip().lower() for k in self.sms_keywords if k and k.strip()]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.label_en
