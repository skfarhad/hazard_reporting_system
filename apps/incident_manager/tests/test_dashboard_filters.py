from datetime import datetime, timedelta, timezone as dt_timezone

from django.contrib.auth import get_user_model
from django.db import connection
from django.test import SimpleTestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.tests.factories import district, event
from apps.incident_manager.constants import TaskStatus
from apps.incident_manager.models import Incident, Thana
from apps.incident_manager.services.periods import period_start
from apps.volunteer_hub.models import Volunteer

UTC = dt_timezone.utc


def incident(description="help", hours_ago=0, **fields):
    created = Incident.objects.create(contact_number="01712345678", description=description, address="x", **fields)
    if hours_ago:
        Incident.objects.filter(pk=created.pk).update(created_at=timezone.now() - timedelta(hours=hours_ago))
    return created


class PeriodStartTests(SimpleTestCase):
    def test_today_starts_at_midnight_bangladesh_time_not_utc(self):
        # 19:00 UTC on 4 Nov is 01:00 on 5 Nov in Bangladesh (UTC+6), so "today" began at 18:00 UTC on 4 Nov.
        now = datetime(2026, 11, 4, 19, 0, tzinfo=UTC)

        self.assertEqual(period_start("today", now), datetime(2026, 11, 4, 18, 0, tzinfo=UTC))

    def test_before_bangladesh_midnight_today_began_the_previous_utc_evening(self):
        now = datetime(2026, 11, 4, 17, 59, tzinfo=UTC)  # 23:59 in Bangladesh

        self.assertEqual(period_start("today", now), datetime(2026, 11, 3, 18, 0, tzinfo=UTC))

    def test_last_24_hours_and_last_7_days_count_back_from_now(self):
        now = datetime(2026, 11, 4, 19, 0, tzinfo=UTC)

        self.assertEqual(period_start("24h", now), now - timedelta(hours=24))
        self.assertEqual(period_start("7d", now), now - timedelta(days=7))


class OperatorApiTestCase(APITestCase):
    url_name = "incident-list"

    def setUp(self):
        self.url = reverse(self.url_name)
        self.client.force_authenticate(get_user_model().objects.create(username="operator", is_staff=True))

    def listed(self, **params):
        response = self.client.get(self.url, params)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        return sorted(i["description"] for i in response.data["results"])


class PeriodFilterTests(OperatorApiTestCase):
    def test_last_24_hours_and_last_7_days_include_only_incidents_created_in_that_window(self):
        incident("now")
        incident("yesterday", hours_ago=30)
        incident("last month", hours_ago=24 * 30)

        self.assertEqual(self.listed(period="24h"), ["now"])
        self.assertEqual(self.listed(period="7d"), ["now", "yesterday"])
        self.assertEqual(self.listed(), ["last month", "now", "yesterday"])

    def test_today_excludes_incidents_from_before_bangladesh_midnight(self):
        incident("now")
        incident("two days ago", hours_ago=48)

        self.assertEqual(self.listed(period="today"), ["now"])

    def test_active_event_period_lists_only_incidents_attached_to_an_active_event(self):
        incident("in the flood", event=event("Feni Flood"))
        incident("in an old event", event=event("Old Fire", started_days_ago=30, ended_days_ago=20))
        incident("no event")

        self.assertEqual(self.listed(period="event"), ["in the flood"])

    def test_an_unknown_period_is_rejected_with_400(self):
        response = self.client.get(self.url, {"period": "forever"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("period", response.data)


class AreaAndTaskStatusFilterTests(OperatorApiTestCase):
    def test_district_and_thana_filters_narrow_the_list_by_id(self):
        feni, sylhet = district("Feni"), district("Sylhet")
        parshuram = Thana.objects.create(name="Parshuram", district=feni)
        sonagazi = Thana.objects.create(name="Sonagazi", district=feni)
        incident("parshuram", district=feni, thana=parshuram)
        incident("sonagazi", district=feni, thana=sonagazi)
        incident("sylhet", district=sylhet)

        self.assertEqual(self.listed(district=feni.id), ["parshuram", "sonagazi"])
        self.assertEqual(self.listed(thana=parshuram.id), ["parshuram"])

    def test_task_status_closed_lists_only_resolved_incidents(self):
        incident("done", task_status=TaskStatus.CLOSED.value)
        incident("open")

        self.assertEqual(self.listed(task_status="closed"), ["done"])

    def test_each_incident_shows_its_task_status_and_district_and_thana_names(self):
        feni = district("Feni")
        incident("x", district=feni, thana=Thana.objects.create(name="Parshuram", district=feni))

        row = self.client.get(self.url).data["results"][0]

        self.assertEqual((row["district"], row["thana"], row["task_status"]), ("Feni", "Parshuram", "open"))


class VolunteerCountTests(OperatorApiTestCase):
    def volunteers(self, n):
        return [Volunteer.objects.create(full_name=f"V{i}", contact_number="017", address="x", notes="") for i in range(n)]

    def test_each_listed_incident_has_its_volunteer_count_without_extra_queries(self):
        team = self.volunteers(3)
        incident("three").volunteers.set(team)
        incident("one").volunteers.set(team[:1])
        incident("none")
        with CaptureQueriesContext(connection) as few:
            self.client.get(self.url)
        for _ in range(5):
            incident("more").volunteers.set(team)

        with CaptureQueriesContext(connection) as many:
            rows = self.client.get(self.url).data["results"]

        counts = {r["description"]: r["volunteer_count"] for r in rows}
        self.assertEqual((counts["three"], counts["one"], counts["none"]), (3, 1, 0))
        self.assertEqual(len(many), len(few))
