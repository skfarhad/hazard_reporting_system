from django.contrib.auth import get_user_model
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.tests.factories import district
from apps.incident_manager.models import Thana


class PlacesApiTests(APITestCase):
    def setUp(self):
        self.url = reverse("place-list")

    def test_signed_in_users_get_districts_with_their_thanas_by_name(self):
        sylhet, feni = district("Sylhet"), district("Feni")
        Thana.objects.create(name="Sonagazi", district=feni)
        Thana.objects.create(name="Parshuram", district=feni)
        self.client.force_authenticate(get_user_model().objects.create(username="citizen"))

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([d["name"] for d in response.data], ["Feni", "Sylhet"])
        self.assertEqual([t["name"] for t in response.data[0]["thanas"]], ["Parshuram", "Sonagazi"])
        self.assertEqual(set(response.data[0]["thanas"][0]), {"id", "name"})
        self.assertEqual(response.data[1], {"id": sylhet.id, "name": "Sylhet", "thanas": []})

    def test_anonymous_users_cannot_list_places(self):
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_listing_places_takes_a_constant_number_of_queries(self):
        self.client.force_authenticate(get_user_model().objects.create(username="citizen"))

        def queries():
            with CaptureQueriesContext(connection) as ctx:
                self.client.get(self.url)
            return len(ctx.captured_queries)

        district("A")
        one = queries()
        for n in range(10):
            Thana.objects.create(name=f"T{n}", district=district(f"D{n}"))
        self.assertEqual(one, queries())
