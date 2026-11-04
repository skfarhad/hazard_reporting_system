from django.contrib.auth import get_user_model
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.tests.factories import district
from apps.incident_manager.constants import IncidentStatus, TaskStatus
from apps.incident_manager.tests.test_dashboard_filters import incident

PENDING, VALIDATED = IncidentStatus.PENDING.value, IncidentStatus.VALIDATED.value
CLOSED = TaskStatus.CLOSED.value


class IncidentSummaryTests(APITestCase):
    def setUp(self):
        self.url = reverse("incident-summary")
        self.client.force_authenticate(get_user_model().objects.create(username="operator", is_staff=True))
        self.feni, self.sylhet = district("Feni"), district("Sylhet")
        incident("feni pending", district=self.feni)
        incident("feni pending 2", district=self.feni)
        incident("feni resolved", district=self.feni, validation_status=VALIDATED, task_status=CLOSED)
        incident("feni validated open", district=self.feni, validation_status=VALIDATED)
        incident("sylhet pending", district=self.sylhet)
        incident("feni old pending", district=self.feni, hours_ago=24 * 10)

    def summary(self, **params):
        response = self.client.get(self.url, params)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        return response.data

    def test_summary_counts_pending_resolved_and_total_for_the_period_and_area(self):
        self.assertEqual(self.summary(period="7d", district=self.feni.id), {"pending": 2, "resolved": 1, "total": 4})
        self.assertEqual(self.summary(), {"pending": 4, "resolved": 1, "total": 6})

    def test_summary_ignores_the_status_filters_so_each_card_keeps_its_count(self):
        self.assertEqual(self.summary(status=PENDING, task_status=CLOSED), self.summary())

    def test_summary_matches_the_list_count_for_the_same_filters(self):
        filters = {"period": "7d", "district": self.feni.id, "q": "pending"}
        listed = self.client.get(reverse("incident-list"), {**filters, "status": PENDING}).data["count"]

        self.assertEqual(self.summary(**filters)["pending"], listed)

    def test_summary_is_one_query(self):
        with CaptureQueriesContext(connection) as queries:
            self.summary(period="today", district=self.feni.id)

        self.assertEqual(len(queries), 1, [q["sql"] for q in queries])

    def test_a_bad_period_is_rejected_with_400(self):
        self.assertEqual(self.client.get(self.url, {"period": "forever"}).status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_operators_cannot_read_the_summary(self):
        self.client.force_authenticate(get_user_model().objects.create(username="citizen"))

        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)
