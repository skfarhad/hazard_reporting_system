import io
import shutil
import tempfile

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image

from apps.volunteer_hub.models import Volunteer

MEDIA = tempfile.mkdtemp()


def image_file(name="face.png", fmt="PNG", size=(4, 4)):
    buffer = io.BytesIO()
    Image.new("RGB", size, "red").save(buffer, fmt)
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=f"image/{fmt.lower()}")


@override_settings(MEDIA_ROOT=MEDIA)
class VolunteerPhotoTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(MEDIA, ignore_errors=True)
        super().tearDownClass()

    def check_photo(self, photo=None):
        """Runs the model's validation for the photo field only."""
        volunteer = Volunteer(full_name="Karim", contact_number="01712345678", address="x", notes="", photo=photo)
        others = [f.name for f in Volunteer._meta.get_fields() if f.name != "photo"]
        volunteer.clean_fields(exclude=others)

    def test_a_volunteer_photo_is_optional(self):
        self.check_photo()

    def test_a_volunteer_photo_can_be_a_jpeg_png_or_webp_image(self):
        for name, fmt in [("a.png", "PNG"), ("a.jpg", "JPEG"), ("a.webp", "WEBP")]:
            with self.subTest(fmt=fmt):
                self.check_photo(image_file(name, fmt))

    def test_a_volunteer_photo_must_be_an_image_of_at_most_2_mb(self):
        big = image_file()
        big.size = 2 * 1024 * 1024 + 1
        for bad in [image_file("a.gif", "GIF"), SimpleUploadedFile("a.png", b"not an image"), big]:
            with self.subTest(file=bad.name):
                with self.assertRaises(ValidationError) as caught:
                    self.check_photo(bad)
                self.assertIn("photo", caught.exception.message_dict)


class VolunteerAdminPhotoTests(TestCase):
    def test_the_admin_list_shows_a_photo_thumbnail_or_a_dash(self):
        from django.contrib import admin

        model_admin = admin.site._registry[Volunteer]
        with_photo = Volunteer(full_name="Karim", photo="volunteers/karim.png")

        self.assertIn('src="/media/volunteers/karim.png"', model_admin.photo_thumbnail(with_photo))
        self.assertEqual(model_admin.photo_thumbnail(Volunteer(full_name="Rahim")), "—")
        self.assertIn("photo_thumbnail", model_admin.list_display)
