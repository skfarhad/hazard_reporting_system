from django.test import TestCase
from unittest.mock import patch
from apps.incident_manager.constants import IncidentStatus
from apps.incident_manager.models import Provider, Incident


class IncidentModelTest(TestCase):

    def setUp(self):
        """Set up initial data for the tests."""
        self.provider = Provider.objects.create(
            name="Test Provider",
            description="Test Provider Description",
        )

    @patch("apps.incident_manager.signals.process_incident_and_send_sms.delay")
    def test_signal_triggers_background_task_on_status_validated(
        self, mock_process_incident
    ):
        """Test that the signal triggers the background task when an Incident status changes to 'validated'."""
        incident = Incident.objects.create(
            contact_number="9876543210",
            provider=self.provider,
            description="Another Test Incident",
            additional_info={"key": "value"},
            validation_status=IncidentStatus.PENDING.value,  # Initial status is not 'validated'
            address="456 Test Avenue",
        )

        # Ensure the task was not triggered on creation
        mock_process_incident.assert_not_called()

        # Update the status to 'validated'
        incident.validation_status = IncidentStatus.VALIDATED.value
        incident.save()

        # Now the task should be triggered
        mock_process_incident.assert_called_once_with(incident.id)

    @patch("apps.incident_manager.signals.process_incident_and_send_sms.delay")
    def test_signal_does_not_trigger_task_if_status_unchanged(
        self, mock_process_incident
    ):
        """Test that the signal does not trigger the background task if the status does not change to 'validated'."""
        incident = Incident.objects.create(
            contact_number="5551234567",
            provider=self.provider,
            description="Test Incident",
            additional_info={"key": "value"},
            validation_status=IncidentStatus.PENDING.value,
            address="789 Test Boulevard",
        )

        # Update the incident without changing the status to 'validated'
        incident.description = "Updated description"
        incident.save()

        # The task should not be triggered
        mock_process_incident.assert_not_called()

    def test_incident_without_provider(self):
        """Test creating an Incident without a provider."""
        incident = Incident.objects.create(
            contact_number="5551234567",
            provider=None,
            description="Incident with No Provider",
            additional_info={"key": "value"},
            validation_status=IncidentStatus.REJECTED.value,
            address="789 Test Boulevard",
        )

        self.assertIsInstance(incident, Incident)
        self.assertIsNone(incident.provider)
        self.assertEqual(incident.description, "Incident with No Provider")
        self.assertEqual(incident.validation_status, IncidentStatus.REJECTED.value)
