from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.incident_manager.constants import IncidentStatus, TaskStatus
from apps.incident_manager.models import Incident


class IncidentOperatorUpdateTests(APITestCase):
    def setUp(self):
        self.operator = get_user_model().objects.create(username="operator", is_staff=True)
        self.incident = Incident.objects.create(
            contact_number="01700000001",
            location=Point(90.4125, 23.8103, srid=4326),
            description="Water entering the house",
            address="Mirpur, Dhaka",
        )
        self.url = reverse("incident-detail", args=[self.incident.id])

    @patch("apps.incident_manager.signals.process_incident_and_send_sms.delay")
    def test_an_operator_validates_an_incident_and_the_sms_task_is_queued(self, mock_delay):
        self.client.force_authenticate(self.operator)

        response = self.client.patch(self.url, {"validation_status": "validated"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["validation_status"], IncidentStatus.VALIDATED.value)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.validation_status, IncidentStatus.VALIDATED.value)
        mock_delay.assert_called_once_with(self.incident.id)

    @patch("apps.incident_manager.signals.process_incident_and_send_sms.delay")
    def test_an_operator_rejects_an_incident_and_no_sms_task_is_queued(self, mock_delay):
        self.client.force_authenticate(self.operator)

        response = self.client.patch(self.url, {"validation_status": "rejected"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.validation_status, IncidentStatus.REJECTED.value)
        mock_delay.assert_not_called()

    def test_an_operator_closes_the_task_of_an_incident(self):
        self.client.force_authenticate(self.operator)

        response = self.client.patch(self.url, {"task_status": "closed"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.task_status, TaskStatus.CLOSED.value)

    def test_an_unknown_status_is_refused_with_400_and_nothing_changes(self):
        self.client.force_authenticate(self.operator)

        response = self.client.patch(self.url, {"validation_status": "done"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.validation_status, IncidentStatus.PENDING.value)

    def test_non_operators_cannot_update_incidents(self):
        self.client.force_authenticate(get_user_model().objects.create(username="public"))

        response = self.client.patch(self.url, {"validation_status": "validated"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.validation_status, IncidentStatus.PENDING.value)

    def test_a_missing_incident_returns_404(self):
        self.client.force_authenticate(self.operator)

        response = self.client.patch(
            reverse("incident-detail", args=[999999]), {"validation_status": "rejected"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
