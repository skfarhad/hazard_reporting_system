from django.contrib.auth import get_user_model
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.contrib.gis.geos import Point
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.incident_manager.constants import IncidentStatus
from apps.events.tests.factories import event
from apps.incident_manager.models import Incident, NeedType


class IncidentListViewTestCase(APITestCase):
    def setUp(self):
        self.url = reverse("incident-list")
        self.operator = get_user_model().objects.create(username="operator", is_staff=True)
        self.older = Incident.objects.create(
            contact_number="01700000001",
            location=Point(90.4125, 23.8103, srid=4326),
            description="Water entering the house",
            address="Mirpur, Dhaka",
        )
        self.newer = Incident.objects.create(
            contact_number="01700000002",
            location=Point(91.8687, 24.8949, srid=4326),
            description="Family stranded on roof",
            address="Sylhet Sadar",
            validation_status=IncidentStatus.VALIDATED.value,
        )

    def test_rejects_anonymous_requests(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rejects_signed_in_users_who_are_not_operators(self):
        # Anyone can sign up, so a plain account must not see reporters' phone numbers.
        self.client.force_authenticate(get_user_model().objects.create(username="public"))

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_lists_incidents_newest_first_with_coordinates(self):
        self.client.force_authenticate(self.operator)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([i["id"] for i in response.data["results"]], [self.newer.id, self.older.id])
        first = response.data["results"][0]
        self.assertEqual(first["validation_status"], IncidentStatus.VALIDATED.value)
        self.assertAlmostEqual(first["latitude"], 24.8949)
        self.assertAlmostEqual(first["longitude"], 91.8687)
        self.assertEqual(first["description"], "Family stranded on roof")

    def test_incident_without_location_has_null_coordinates(self):
        Incident.objects.create(
            contact_number="01700000003", description="No GPS", address="Unknown"
        )
        self.client.force_authenticate(self.operator)

        response = self.client.get(self.url)

        self.assertIsNone(response.data["results"][0]["latitude"])
        self.assertIsNone(response.data["results"][0]["longitude"])

    def test_operators_see_each_incidents_needs_and_triage_fields(self):
        self.newer.needs.set(NeedType.objects.filter(code__in=["rescue", "medical"]))
        self.newer.life_threatening = True
        self.newer.people_count = 5
        self.newer.save()
        self.client.force_authenticate(self.operator)

        first = self.client.get(self.url).data["results"][0]

        self.assertEqual(sorted(first["needs"]), ["medical", "rescue"])
        self.assertTrue(first["life_threatening"])
        self.assertEqual(first["people_count"], 5)

    def test_listing_incidents_uses_the_same_number_of_queries_for_one_or_twenty(self):
        rescue = NeedType.objects.get(code="rescue")
        self.client.force_authenticate(self.operator)
        Incident.objects.all().delete()

        def count_queries(n):
            Incident.objects.all().delete()
            for i in range(n):
                Incident.objects.create(contact_number=str(i), description="x", address="y").needs.add(rescue)
            with CaptureQueriesContext(connection) as ctx:
                self.client.get(self.url)
            return len(ctx.captured_queries)

        self.assertEqual(count_queries(1), count_queries(20))

    def test_operators_see_the_incidents_event_id_and_name(self):
        flood = event("Sylhet Flood")
        self.newer.event = flood
        self.newer.save()
        self.client.force_authenticate(self.operator)

        data = self.client.get(self.url).data["results"]

        self.assertEqual((data[0]["event"]["id"], data[0]["event"]["name"]), (flood.id, "Sylhet Flood"))
        self.assertIsNone(data[1]["event"])

    def test_listing_incidents_with_events_uses_the_same_number_of_queries_for_one_or_twenty(self):
        self.client.force_authenticate(self.operator)

        def count_queries(n):
            Incident.objects.all().delete()
            for i in range(n):
                Incident.objects.create(
                    contact_number=str(i), description="x", address="y", event=event(f"Event {i}"),
                )
            with CaptureQueriesContext(connection) as ctx:
                self.client.get(self.url)
            return len(ctx.captured_queries)

        self.assertEqual(count_queries(1), count_queries(20))
