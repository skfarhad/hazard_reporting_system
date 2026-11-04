from django.contrib.gis.db import models
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from PIL import Image
from apps.incident_manager.models.address import District, Thana
from apps.incident_manager.models.types import NeedType

MAX_PHOTO_BYTES = 2 * 1024 * 1024
PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"]
PHOTO_FORMATS = {"JPEG", "PNG", "WEBP"}


def validate_photo_size(photo):
    if photo.size > MAX_PHOTO_BYTES:
        raise ValidationError("The photo must be 2 MB or smaller.")


def validate_photo_content(photo):
    """The file must really be a JPEG, PNG or WebP image, whatever its name says."""
    try:
        photo.seek(0)
        with Image.open(photo) as image:
            image_format = image.format
            image.verify()
    except Exception:
        raise ValidationError("Upload a JPEG, PNG or WebP image.")
    finally:
        photo.seek(0)
    if image_format not in PHOTO_FORMATS:
        raise ValidationError("Upload a JPEG, PNG or WebP image.")


class Volunteer(models.Model):
    full_name = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=15)
    location = models.PointField(
        geography=True, null=True, blank=True
    )  # Using GeoDjango for geo fields
    address = models.CharField(max_length=255)
    thana = models.ForeignKey(
        Thana,
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="volunteers",
    )
    district = models.ForeignKey(  # Adding the foreign key for district
        District,
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="volunteers",
    )
    is_active = models.BooleanField(default=True)
    photo = models.ImageField(
        upload_to="volunteers/", null=True, blank=True,
        validators=[FileExtensionValidator(PHOTO_EXTENSIONS), validate_photo_size, validate_photo_content],
        help_text="JPEG, PNG or WebP, up to 2 MB.",
    )
    notes = models.TextField()
    assistance_type = models.CharField(
        max_length=50, blank=True, default="",
        help_text="Deprecated: use skills. Kept for one release after migrating to skills.",
    )
    skills = models.ManyToManyField(
        NeedType, related_name="volunteers", blank=True, help_text="The needs this volunteer can help with.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name
