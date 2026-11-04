from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.incident_manager.constants import IncidentStatus
from apps.incident_manager.models import Incident


class IncidentListViewTestCase(APITestCase):
    def setUp(self):
        self.url = reverse("incident-list")
        self.user = get_user_model().objects.create(username="operator")
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

    def test_lists_incidents_newest_first_with_coordinates(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([i["id"] for i in response.data], [self.newer.id, self.older.id])
        first = response.data[0]
        self.assertEqual(first["validation_status"], IncidentStatus.VALIDATED.value)
        self.assertAlmostEqual(first["latitude"], 24.8949)
        self.assertAlmostEqual(first["longitude"], 91.8687)
        self.assertEqual(first["description"], "Family stranded on roof")

    def test_incident_without_location_has_null_coordinates(self):
        Incident.objects.create(
            contact_number="01700000003", description="No GPS", address="Unknown"
        )
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertIsNone(response.data[0]["latitude"])
        self.assertIsNone(response.data[0]["longitude"])
