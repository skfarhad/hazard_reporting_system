from django.test import TestCase
from unittest.mock import patch
from incident_manager.models import Provider, Incident
from incident_manager.tasks import process_incident_and_send_sms


class IncidentModelTest(TestCase):

    def setUp(self):
        """Set up initial data for the tests."""
        self.provider = Provider.objects.create(
            name="Test Provider",
            description="Test Provider Description",
        )

    @patch("incident_manager.signals.process_incident_and_send_sms.delay")
    def test_signal_triggers_background_task(self, mock_process_incident):
        """Test that the signal triggers the background task when an Incident is created."""
        incident = Incident.objects.create(
            contact_number="9876543210",
            provider=self.provider,
            description="Another Test Incident",
            additional_info={"key": "value"},
            status="in progress",
            address="456 Test Avenue",
        )

        # Check if the background task was called once
        mock_process_incident.assert_called_once_with(incident.id)

    def test_incident_without_provider(self):
        """Test creating an Incident without a provider."""
        incident = Incident.objects.create(
            contact_number="5551234567",
            provider=None,
            description="Incident with No Provider",
            additional_info={"key": "value"},
            status="closed",
            address="789 Test Boulevard",
        )

        self.assertIsInstance(incident, Incident)
        self.assertIsNone(incident.provider)
        self.assertEqual(incident.description, "Incident with No Provider")
        self.assertEqual(incident.status, "closed")
