from django.contrib.auth import get_user_model
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.tests.factories import district, event
from apps.incident_manager.constants import IncidentStatus
from apps.incident_manager.models import Incident, NeedType, Thana


def make_incidents(n, **fields):
    return [
        Incident.objects.create(contact_number=f"0170000{i:04d}", description=f"Report {i}", address="Somewhere", **fields)
        for i in range(n)
    ]


class IncidentListPaginationTests(APITestCase):
    def setUp(self):
        self.url = reverse("incident-list")
        self.client.force_authenticate(get_user_model().objects.create(username="operator", is_staff=True))

    def test_the_list_is_paginated_with_25_incidents_per_page_by_default_and_reports_the_total_count(self):
        make_incidents(30)

        first = self.client.get(self.url)
        second = self.client.get(self.url, {"page": 2})

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data["count"], 30)
        self.assertEqual(len(first.data["results"]), 25)
        self.assertIsNotNone(first.data["next"])
        self.assertIsNone(first.data["previous"])
        self.assertEqual(len(second.data["results"]), 5)

    def test_page_size_can_be_raised_up_to_500_but_not_beyond(self):
        Incident.objects.bulk_create(
            Incident(contact_number=str(i), description="x", address="y") for i in range(501)
        )

        self.assertEqual(len(self.client.get(self.url, {"page_size": 30}).data["results"]), 30)
        self.assertEqual(len(self.client.get(self.url, {"page_size": 1000}).data["results"]), 500)


class IncidentListFilterTests(APITestCase):
    def setUp(self):
        self.url = reverse("incident-list")
        self.client.force_authenticate(get_user_model().objects.create(username="operator", is_staff=True))
        self.feni_flood = event("Feni Flood", hazard_code="flood")
        self.dhaka_fire = event("Dhaka Fire", hazard_code="fire")
        self.rescue_medical = self.incident("Roof", needs=["rescue", "medical"], event=self.feni_flood, life_threatening=True)
        self.food = self.incident("Hungry", needs=["food"], event=self.feni_flood,
                                  validation_status=IncidentStatus.VALIDATED.value)
        self.fire = self.incident("Smoke", needs=["rescue"], event=self.dhaka_fire,
                                  validation_status=IncidentStatus.REJECTED.value)
        self.no_event = self.incident("Unsorted", needs=["other"])

    def incident(self, description, needs=(), **fields):
        incident = Incident.objects.create(contact_number="01700000000", description=description, address="-", **fields)
        incident.needs.set(NeedType.objects.filter(code__in=needs))
        return incident

    def ids(self, **params):
        response = self.client.get(self.url, params)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        return sorted(i["id"] for i in response.data["results"])

    def assert_bad_request(self, **params):
        self.assertEqual(self.client.get(self.url, params).status_code, status.HTTP_400_BAD_REQUEST)

    def test_filtering_by_several_needs_returns_incidents_with_any_of_them_each_once(self):
        response = self.client.get(self.url, {"needs": "rescue,medical"})

        self.assertEqual(response.data["count"], 2)
        self.assertEqual(sorted(i["id"] for i in response.data["results"]), sorted([self.rescue_medical.id, self.fire.id]))
        self.assertEqual(self.ids(needs="food"), [self.food.id])

    def test_an_unknown_need_code_is_rejected_with_400(self):
        self.assert_bad_request(needs="rescue,teleport")

    def test_filtering_by_status_returns_only_that_validation_status_and_an_invalid_status_is_400(self):
        self.assertEqual(self.ids(status="validated"), [self.food.id])
        self.assertEqual(self.ids(status="pending"), sorted([self.rescue_medical.id, self.no_event.id]))
        self.assert_bad_request(status="done")

    def test_filtering_by_event_id_returns_its_incidents_and_event_none_returns_incidents_without_an_event(self):
        self.assertEqual(self.ids(event=self.feni_flood.id), sorted([self.rescue_medical.id, self.food.id]))
        self.assertEqual(self.ids(event="none"), [self.no_event.id])

    def test_a_non_numeric_event_other_than_none_is_rejected_with_400(self):
        self.assert_bad_request(event="flood")

    def test_filtering_by_hazard_returns_incidents_whose_event_has_that_hazard(self):
        self.assertEqual(self.ids(hazard="fire"), [self.fire.id])
        self.assertEqual(self.ids(hazard="flood"), sorted([self.rescue_medical.id, self.food.id]))

    def test_filtering_by_life_threatening_returns_only_urgent_incidents(self):
        self.assertEqual(self.ids(life_threatening="true"), [self.rescue_medical.id])
        self.assertEqual(len(self.ids(life_threatening="false")), 3)

    def test_filters_combine_with_each_other(self):
        self.assertEqual(self.ids(needs="rescue", hazard="flood"), [self.rescue_medical.id])
        self.assertEqual(self.ids(needs="rescue", status="rejected"), [self.fire.id])
        self.assertEqual(self.ids(needs="food", life_threatening="true"), [])


class IncidentListSearchTests(APITestCase):
    def setUp(self):
        self.url = reverse("incident-list")
        self.client.force_authenticate(get_user_model().objects.create(username="operator", is_staff=True))
        feni = district("Feni")
        parshuram = Thana.objects.create(name="Parshuram", district=feni)
        self.by_text = Incident.objects.create(contact_number="01711111111", description="Family on the ROOF", address="School road")
        self.by_place = Incident.objects.create(contact_number="01722222222", description="help", address="Bazar",
                                                district=feni, thana=parshuram)
        self.by_event = Incident.objects.create(contact_number="01733333333", description="help", address="Ghat",
                                                event=event("Sylhet Flood 2027"))

    def ids(self, q, **params):
        response = self.client.get(self.url, {"q": q, **params})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return sorted(i["id"] for i in response.data["results"])

    def test_search_matches_description_address_contact_number_district_thana_and_event_name_ignoring_case(self):
        self.assertEqual(self.ids("roof"), [self.by_text.id])
        self.assertEqual(self.ids("school"), [self.by_text.id])
        self.assertEqual(self.ids("0172222"), [self.by_place.id])
        self.assertEqual(self.ids("feni"), [self.by_place.id])
        self.assertEqual(self.ids("PARSHU"), [self.by_place.id])
        self.assertEqual(self.ids("sylhet flood"), [self.by_event.id])
        self.assertEqual(self.ids("nothing like this"), [])

    def test_a_blank_search_returns_everything(self):
        self.assertEqual(len(self.ids("  ")), 3)

    def test_search_combines_with_filters(self):
        self.assertEqual(self.ids("help", event="none"), [self.by_place.id])


class IncidentListShapeTests(APITestCase):
    def setUp(self):
        self.url = reverse("incident-list")
        self.operator = get_user_model().objects.create(username="operator", is_staff=True)
        self.client.force_authenticate(self.operator)

    def test_each_results_event_includes_its_hazard_code_label_icon_and_colour(self):
        Incident.objects.create(contact_number="1", description="x", address="y", event=event("Feni Flood", hazard_code="flood"))

        result = self.client.get(self.url).data["results"][0]

        self.assertEqual(result["event"]["name"], "Feni Flood")
        self.assertEqual(result["event"]["hazard"], {"code": "flood", "label_en": "Flood", "icon": "water", "colour": "#0284C7"})

    def test_a_page_of_incidents_takes_the_same_number_of_queries_whatever_the_page_size(self):
        feni = district("Feni")
        thana = Thana.objects.create(name="Parshuram", district=feni)
        rescue = NeedType.objects.get(code="rescue")
        for i in range(20):
            incident = Incident.objects.create(contact_number=str(i), description="x", address="y", district=feni,
                                               thana=thana, event=event(f"Event {i}"))
            incident.needs.add(rescue)

        def queries(page_size):
            with CaptureQueriesContext(connection) as ctx:
                response = self.client.get(self.url, {"page_size": page_size, "q": "x", "needs": "rescue"})
            self.assertEqual(len(response.data["results"]), page_size)
            return len(ctx.captured_queries)

        self.assertEqual(queries(1), queries(20))

    def test_non_operators_cannot_list_incidents(self):
        self.client.force_authenticate(get_user_model().objects.create(username="public"))

        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)
