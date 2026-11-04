from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.tests.factories import district
from apps.incident_manager.models import Incident, NeedType, Thana
from apps.volunteer_hub.models import Volunteer


def volunteer(name, lng=None, lat=None, **fields):
    location = Point(lng, lat, srid=4326) if lng is not None else None
    fields.setdefault("contact_number", "01812345678")
    return Volunteer.objects.create(full_name=name, address="Feni", notes="", location=location, **fields)


class VolunteerApiTestCase(APITestCase):
    url_name = "volunteer-list"

    def setUp(self):
        self.url = reverse(self.url_name)
        self.client.force_authenticate(get_user_model().objects.create(username="operator", is_staff=True))
        self.feni, self.sylhet = district("Feni"), district("Sylhet")
        self.parshuram = Thana.objects.create(name="Parshuram", district=self.feni)

    def names(self, **params):
        response = self.client.get(self.url, params)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        return [v["full_name"] for v in response.data]


class VolunteerListAccessTests(VolunteerApiTestCase):
    def test_only_operators_can_list_volunteers(self):
        volunteer("Karim")
        self.client.force_authenticate(get_user_model().objects.create(username="citizen"))
        signed_in = self.client.get(self.url)
        self.client.force_authenticate(None)
        anonymous = self.client.get(self.url)

        self.assertEqual(signed_in.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(anonymous.status_code, status.HTTP_401_UNAUTHORIZED)


class VolunteerListContentTests(VolunteerApiTestCase):
    def test_operators_see_active_and_inactive_volunteers_with_phone_area_and_photo(self):
        karim = volunteer("Karim", 91.43, 23.21, district=self.feni, thana=self.parshuram, photo="volunteers/k.png")
        volunteer("Rahim", is_active=False, contact_number="01912345678")

        data = self.client.get(self.url).data

        self.assertEqual([v["full_name"] for v in data], ["Karim", "Rahim"])
        first, second = data
        self.assertEqual(first["id"], karim.id)
        self.assertEqual(first["contact_number"], "01812345678")
        self.assertEqual(first["district"], {"id": self.feni.id, "name": "Feni"})
        self.assertEqual(first["thana"], {"id": self.parshuram.id, "name": "Parshuram"})
        self.assertTrue(first["photo"].endswith("/media/volunteers/k.png"))
        self.assertEqual((first["latitude"], first["longitude"]), (23.21, 91.43))
        self.assertTrue(first["is_active"])
        self.assertEqual((second["is_active"], second["district"], second["thana"], second["photo"]),
                         (False, None, None, None))
        self.assertEqual((second["latitude"], second["longitude"]), (None, None))

    def test_each_volunteer_shows_skills_and_how_many_incidents_they_are_assigned_to(self):
        karim = volunteer("Karim")
        karim.skills.set(NeedType.objects.filter(code__in=["food", "rescue"]))
        for _ in range(2):
            Incident.objects.create(contact_number="017", description="x", address="y").volunteers.add(karim)

        data = self.client.get(self.url).data[0]

        self.assertEqual(sorted(data["skills"]), ["food", "rescue"])
        self.assertEqual(data["assigned_incident_count"], 2)

    def test_listing_volunteers_uses_the_same_number_of_queries_for_two_or_twenty(self):
        food = NeedType.objects.get(code="food")

        def count_queries(n):
            Volunteer.objects.all().delete()
            for i in range(n):
                volunteer(f"V{i}", district=self.feni, thana=self.parshuram).skills.add(food)
            with CaptureQueriesContext(connection) as ctx:
                self.client.get(self.url)
            return len(ctx.captured_queries)

        self.assertEqual(count_queries(2), count_queries(20))


class VolunteerListFilterTests(VolunteerApiTestCase):
    def test_active_district_thana_and_search_filters(self):
        volunteer("Karim Feni", district=self.feni, thana=self.parshuram)
        volunteer("Rahim Feni", district=self.feni, is_active=False)
        volunteer("Salma Sylhet", district=self.sylhet, contact_number="01999999999")

        self.assertEqual(self.names(active="true"), ["Karim Feni", "Salma Sylhet"])
        self.assertEqual(self.names(active="false"), ["Rahim Feni"])
        self.assertEqual(self.names(district=self.feni.id), ["Karim Feni", "Rahim Feni"])
        self.assertEqual(self.names(thana=self.parshuram.id), ["Karim Feni"])
        self.assertEqual(self.names(q="rahim"), ["Rahim Feni"])
        self.assertEqual(self.names(q="0199999"), ["Salma Sylhet"])

    def test_near_orders_volunteers_by_distance_and_reports_km(self):
        volunteer("Far", 91.0, 23.21)
        volunteer("Close", 91.44, 23.21)
        volunteer("Nowhere")

        data = self.client.get(self.url, {"near": "23.21,91.43"}).data

        self.assertEqual([v["full_name"] for v in data], ["Close", "Far", "Nowhere"])
        self.assertAlmostEqual(data[0]["distance_km"], 1.0, delta=0.1)
        self.assertAlmostEqual(data[1]["distance_km"], 44.0, delta=1.0)
        self.assertIsNone(data[2]["distance_km"])

    def test_without_near_there_is_no_distance(self):
        volunteer("Karim", 91.44, 23.21)

        self.assertNotIn("distance_km", self.client.get(self.url).data[0])

    def test_a_bad_near_or_area_is_rejected_with_400(self):
        for params in [{"near": "north"}, {"near": "23.2"}, {"near": "95,200"}, {"district": "feni"}]:
            with self.subTest(params=params):
                self.assertEqual(self.client.get(self.url, params).status_code, status.HTTP_400_BAD_REQUEST)
