from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.tests.factories import district, event


class EventListTests(APITestCase):
    def setUp(self):
        self.url = reverse("event-list")
        self.operator = get_user_model().objects.create(username="op", is_staff=True)

    def test_the_events_list_with_active_true_returns_only_active_events_with_their_hazard(self):
        feni = district("Feni")
        flood = event("Feni Flood", districts=[feni])
        event("Old cyclone", started_days_ago=400, ended_days_ago=380, hazard_code="cyclone")
        self.client.force_authenticate(self.operator)

        response = self.client.get(self.url, {"active": "true"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([e["name"] for e in response.data], ["Feni Flood"])
        item = response.data[0]
        self.assertEqual(item["id"], flood.id)
        self.assertIsNone(item["ended_at"])
        self.assertEqual(item["district_ids"], [feni.id])
        self.assertEqual(item["hazard"], {"code": "flood", "label_en": "Flood", "label_bn": "বন্যা",
                                          "icon": "water", "colour": "#0284C7"})

    def test_without_the_filter_ended_events_are_listed_too(self):
        event("Feni Flood")
        event("Old cyclone", started_days_ago=400, ended_days_ago=380, hazard_code="cyclone")
        self.client.force_authenticate(self.operator)

        response = self.client.get(self.url)

        self.assertEqual(sorted(e["name"] for e in response.data), ["Feni Flood", "Old cyclone"])

    def test_non_operators_get_403_on_the_events_list(self):
        self.client.force_authenticate(get_user_model().objects.create(username="public"))

        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)
