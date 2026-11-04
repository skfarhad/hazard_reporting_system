from django.contrib.gis.geos import Point
from django.test import TestCase

from apps.incident_manager.services.incidents import create_incident


class CreateIncidentServiceTests(TestCase):
    def test_the_creation_service_ignores_a_status_from_its_caller(self):
        incident = create_incident(
            description="help", address="here", contact_number="01712345678",
            location=Point(90.4, 23.8, srid=4326), validation_status="validated",
        )

        incident.refresh_from_db()
        self.assertEqual(incident.validation_status, "pending")
