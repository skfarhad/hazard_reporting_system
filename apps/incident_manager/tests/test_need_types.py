from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.incident_manager.models import NeedType


def make_need(code, **kwargs):
    defaults = {"label_en": code.title(), "label_bn": code, "icon": "circle", "colour": "#123456"}
    defaults.update(kwargs)
    return NeedType.objects.create(code=code, **defaults)


class NeedTypeTests(TestCase):
    def test_only_one_need_type_can_be_the_fallback(self):
        if not NeedType.objects.filter(is_fallback=True).exists():
            make_need("t-other", is_fallback=True)

        with self.assertRaises(IntegrityError), transaction.atomic():
            make_need("t-second-fallback", is_fallback=True)

    def test_keywords_are_stored_lowercased_and_stripped(self):
        need = make_need("t-rescue", sms_keywords=[" RESCUE ", "Uddhar", "উদ্ধার "])

        need.refresh_from_db()
        self.assertEqual(need.sms_keywords, ["rescue", "uddhar", "উদ্ধার"])

    def test_the_keyword_map_includes_only_active_need_types(self):
        make_need("t-food", sms_keywords=["t-khabar"])
        make_need("t-retired", sms_keywords=["t-old"], is_active=False)

        keyword_map = NeedType.keyword_map()

        self.assertEqual(keyword_map["t-khabar"], "t-food")
        self.assertNotIn("t-old", keyword_map)

    def test_an_invalid_colour_is_rejected_by_validation(self):
        need = NeedType(code="t-bad", label_en="Bad", label_bn="Bad", icon="circle", colour="red")

        with self.assertRaises(ValidationError) as caught:
            need.full_clean()

        self.assertIn("colour", caught.exception.message_dict)


class NeedTypeLookupTests(APITestCase):
    def setUp(self):
        self.url = reverse("need-type-list")

    def test_operators_get_active_need_types_with_both_labels_icon_and_colour(self):
        NeedType.objects.filter(code="damage").update(is_active=False)
        self.client.force_authenticate(get_user_model().objects.create(username="op", is_staff=True))

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        codes = [n["code"] for n in response.data]
        self.assertIn("rescue", codes)
        self.assertNotIn("damage", codes)
        rescue = next(n for n in response.data if n["code"] == "rescue")
        self.assertEqual(rescue, {
            "code": "rescue", "label_en": "Rescue", "label_bn": "উদ্ধার",
            "icon": "life-preserver", "colour": "#DC2626", "is_fallback": False,
        })

    def test_non_operators_get_403_on_need_types(self):
        self.client.force_authenticate(get_user_model().objects.create(username="public"))

        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)
