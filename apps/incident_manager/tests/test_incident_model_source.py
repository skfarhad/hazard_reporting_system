from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.incident_manager.models import Incident, Provider


class IncidentSourceTests(APITestCase):
    def test_existing_and_provider_incidents_have_the_provider_source_and_no_reporter(self):
        plain = Incident.objects.create(contact_number="01700000000", description="x", address="y")
        provider = Provider.objects.create(name="Gateway")
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Api-Key " + provider.api_key)

        response = client.post(reverse("incident-create"), {
            "contact_number": "01700000001", "latitude": 23.8, "longitude": 90.4,
            "description": "Need boat", "address": "Mirpur",
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        from_provider = Incident.objects.exclude(pk=plain.pk).get()
        for incident in (plain, from_provider):
            incident.refresh_from_db()
            self.assertEqual(incident.source, "provider")
            self.assertIsNone(incident.reported_by)
