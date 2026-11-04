from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.incident_manager.constants import IncidentStatus
from apps.incident_manager.tests.test_dashboard_filters import incident

User = get_user_model()


class NotificationsTests(APITestCase):
    def setUp(self):
        self.url = reverse("incident-notifications")
        self.seen_url = reverse("incident-notifications-seen")
        self.operator = User.objects.create(username="operator", is_staff=True)
        self.client.force_authenticate(self.operator)

    def opened_bell(self, user, hours_ago):
        user.notifications_seen_at = timezone.now() - timedelta(hours=hours_ago)
        user.save()

    def test_unread_counts_pending_incidents_reported_since_the_bell_was_last_opened(self):
        incident("before", hours_ago=5)
        self.opened_bell(self.operator, hours_ago=3)
        incident("new 1", hours_ago=2)
        incident("new 2")
        incident("validated", validation_status=IncidentStatus.VALIDATED.value)

        data = self.client.get(self.url).data

        self.assertEqual(data["unread"], 2)
        self.assertEqual([i["description"] for i in data["results"]], ["new 2", "new 1"])
        self.assertEqual(set(data["results"][0]), {"id", "description", "district", "thana", "address", "created_at"})

    def test_at_most_ten_unread_incidents_are_listed_but_all_are_counted(self):
        for n in range(12):
            incident(f"new {n}")

        data = self.client.get(self.url).data

        self.assertEqual((data["unread"], len(data["results"])), (12, 10))

    def test_a_user_who_never_opened_the_bell_sees_the_last_24_hours(self):
        incident("old", hours_ago=30)
        incident("recent", hours_ago=2)

        self.assertEqual(self.client.get(self.url).data["unread"], 1)

    def test_marking_seen_resets_unread_to_zero_for_that_user_only(self):
        other = User.objects.create(username="other operator", is_staff=True)
        incident("new")

        response = self.client.post(self.seen_url)
        self.client.force_authenticate(other)
        others_unread = self.client.get(self.url).data["unread"]
        self.client.force_authenticate(self.operator)

        self.assertEqual(response.data, {"unread": 0})
        self.assertEqual(self.client.get(self.url).data["unread"], 0)
        self.assertEqual(others_unread, 1)

    def test_non_operators_get_403(self):
        self.client.force_authenticate(User.objects.create(username="citizen"))

        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.post(self.seen_url).status_code, status.HTTP_403_FORBIDDEN)
