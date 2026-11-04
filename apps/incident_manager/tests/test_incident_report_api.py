from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from django.contrib.gis.geos import MultiPolygon, Polygon

from apps.events.tests.factories import district, event
from apps.incident_manager.models import Incident, Thana

VALID = {
    "description": "5 people on roof, water rising",
    "address": "Govt. Primary School",
    "contact_number": "01712345678",
    "latitude": 23.21,
    "longitude": 91.43,
}


class ReportApiTestCase(APITestCase):
    def setUp(self):
        cache.clear()  # rate-limit counters live in the cache
        self.url = reverse("incident-report")
        self.user = get_user_model().objects.create(username="citizen", full_name="Karim")
        self.client.force_authenticate(self.user)

    def report(self, **changes):
        return self.client.post(self.url, {**VALID, **changes}, format="json")


class ReportCreatesPendingIncidentTests(ReportApiTestCase):
    def test_a_signed_in_user_who_is_not_an_operator_can_report_an_incident_and_it_is_pending(self):
        response = self.report()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Incident.objects.get().validation_status, "pending")

    def test_the_report_records_the_reporter_and_the_web_source(self):
        self.report()

        incident = Incident.objects.get()
        self.assertEqual(incident.reported_by, self.user)
        self.assertEqual(incident.source, "web")
        self.assertIsNone(incident.provider)

    def test_a_status_sent_by_the_reporter_is_ignored(self):
        self.report(validation_status="validated", source="provider")

        incident = Incident.objects.get()
        self.assertEqual((incident.validation_status, incident.source), ("pending", "web"))

    def test_anonymous_requests_cannot_report(self):
        self.client.force_authenticate(None)

        response = self.report()

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(Incident.objects.exists())

    def test_the_report_keeps_needs_life_threatening_people_count_address_and_location(self):
        self.report(needs=["rescue", "medical"], life_threatening=True, people_count=5)

        incident = Incident.objects.get()
        self.assertEqual(sorted(incident.needs.values_list("code", flat=True)), ["medical", "rescue"])
        self.assertTrue(incident.life_threatening)
        self.assertEqual(incident.people_count, 5)
        self.assertEqual(incident.address, "Govt. Primary School")
        self.assertEqual(incident.description, "5 people on roof, water rising")
        self.assertAlmostEqual(incident.location.y, 23.21)
        self.assertAlmostEqual(incident.location.x, 91.43)

    def test_the_response_gives_only_the_id_status_and_time(self):
        response = self.report()

        self.assertEqual(set(response.data), {"id", "validation_status", "created_at"})
        self.assertEqual(response.data["id"], Incident.objects.get().id)

    @patch("apps.incident_manager.signals.process_incident_and_send_sms.delay")
    def test_reporting_does_not_queue_the_sms_task(self, mock_delay):
        self.report()

        mock_delay.assert_not_called()


def square(lng, lat, half=0.2):
    """A small square boundary around a point, for point-in-polygon tests."""
    return MultiPolygon(Polygon.from_bbox((lng - half, lat - half, lng + half, lat + half)), srid=4326)


class ReportNeedsPlaceAndEventTests(ReportApiTestCase):
    def test_without_needs_sms_keywords_in_the_message_decide_them_else_the_fallback_need(self):
        self.report(description="RESCUE+MEDICAL#Feni#Parshuram#School#roof")
        self.report(description="water everywhere, please come")

        keyworded, plain = Incident.objects.order_by("id")
        self.assertEqual(sorted(keyworded.needs.values_list("code", flat=True)), ["medical", "rescue"])
        self.assertEqual(list(plain.needs.values_list("code", flat=True)), ["other"])

    def test_a_chosen_district_and_thana_are_used(self):
        feni = district("Feni")
        parshuram = Thana.objects.create(name="Parshuram", district=feni)

        self.report(district=feni.id, thana=parshuram.id)

        incident = Incident.objects.get()
        self.assertEqual((incident.district, incident.thana), (feni, parshuram))

    def test_a_thana_alone_also_sets_its_district(self):
        feni = district("Feni")
        parshuram = Thana.objects.create(name="Parshuram", district=feni)

        self.report(thana=parshuram.id)

        self.assertEqual(Incident.objects.get().district, feni)

    def test_a_thana_that_is_not_in_the_chosen_district_is_rejected(self):
        feni, sylhet = district("Feni"), district("Sylhet")
        parshuram = Thana.objects.create(name="Parshuram", district=feni)

        response = self.report(district=sylhet.id, thana=parshuram.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("thana", response.data)
        self.assertFalse(Incident.objects.exists())

    def test_without_a_choice_the_district_and_thana_whose_boundaries_contain_the_pin_are_used(self):
        feni = district("Feni")
        feni.polygon = square(91.43, 23.21, half=0.5)
        feni.save()
        parshuram = Thana.objects.create(name="Parshuram", district=feni, polygon=square(91.43, 23.21))
        Thana.objects.create(name="Far away", district=feni, polygon=square(90.0, 22.0))

        self.report()

        incident = Incident.objects.get()
        self.assertEqual((incident.district, incident.thana), (feni, parshuram))

    def test_a_detected_thana_must_be_in_the_chosen_district_when_boundaries_overlap(self):
        feni, sylhet = district("Feni"), district("Sylhet")
        in_sylhet = Thana.objects.create(name="In Sylhet", district=sylhet, polygon=square(91.43, 23.21))
        Thana.objects.create(name="In Feni", district=feni, polygon=square(91.43, 23.21))

        self.report(district=sylhet.id)

        self.assertEqual(Incident.objects.get().thana, in_sylhet)

    def test_the_report_is_attached_to_the_active_event_covering_its_district(self):
        feni = district("Feni")
        flood = event("Feni Flood", districts=[feni])

        self.report(district=feni.id)

        self.assertEqual(Incident.objects.get().event, flood)


class ReportValidationTests(ReportApiTestCase):
    def assert_rejected(self, field, **changes):
        response = self.report(**changes)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn(field, response.data)
        self.assertFalse(Incident.objects.exists())

    def test_the_contact_number_is_required_and_must_be_a_bangladeshi_mobile_number(self):
        for bad in ["", "12345", "0171234567", "02123456789", "01212345678", "017123456789", "abc01712345678"]:
            with self.subTest(contact=bad):
                self.assert_rejected("contact_number", contact_number=bad)

    def test_plus_880_and_880_numbers_are_stored_as_01_numbers(self):
        for given in ["+8801712345678", "8801712345678", "017-1234 5678"]:
            with self.subTest(contact=given):
                Incident.objects.all().delete()
                self.assertEqual(self.report(contact_number=given).status_code, status.HTTP_201_CREATED)
                self.assertEqual(Incident.objects.get().contact_number, "01712345678")

    def test_a_location_outside_bangladesh_or_missing_is_rejected(self):
        self.assert_rejected("latitude", latitude=51.5, longitude=-0.12)
        self.assert_rejected("latitude", latitude=22.0, longitude=94.0)  # Bangladesh's latitude, in Myanmar
        self.assert_rejected("latitude", latitude=None)
        self.assert_rejected("longitude", longitude=None)

    def test_the_message_and_address_are_required_and_length_limited(self):
        self.assert_rejected("description", description="  ")
        self.assert_rejected("description", description="x" * 2001)
        self.assert_rejected("address", address="")
        self.assert_rejected("address", address="x" * 256)

    def test_an_unknown_need_code_is_rejected(self):
        self.assert_rejected("needs", needs=["rescue", "teleport"])

    def test_a_negative_people_count_is_rejected(self):
        self.assert_rejected("people_count", people_count=-1)


class ReportRateLimitTests(ReportApiTestCase):
    def test_non_operators_are_limited_to_10_reports_an_hour(self):
        for _ in range(10):
            self.assertEqual(self.report().status_code, status.HTTP_201_CREATED)

        response = self.report()

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("detail", response.data)
        self.assertEqual(Incident.objects.count(), 10)

    def test_the_limit_is_per_account(self):
        for _ in range(10):
            self.report()
        self.client.force_authenticate(get_user_model().objects.create(username="neighbour"))

        self.assertEqual(self.report().status_code, status.HTTP_201_CREATED)

    def test_operators_are_not_rate_limited(self):
        self.client.force_authenticate(get_user_model().objects.create(username="operator", is_staff=True))

        for _ in range(12):
            self.assertEqual(self.report().status_code, status.HTTP_201_CREATED)
