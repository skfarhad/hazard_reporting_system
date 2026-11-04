from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.tests.factories import district, event
from apps.incident_manager.models import District, Division, Incident, Thana
from apps.incident_manager.services.incidents import create_incident
from apps.volunteer_hub.models import Volunteer


def square(lng, lat, half=0.2):
    """A GeoJSON polygon: a small square around a point."""
    ring = [[lng - half, lat - half], [lng + half, lat - half], [lng + half, lat + half],
            [lng - half, lat + half], [lng - half, lat - half]]
    return {"type": "Polygon", "coordinates": [ring]}


class PlaceManagementTestCase(APITestCase):
    def setUp(self):
        self.client.force_authenticate(get_user_model().objects.create(username="operator", is_staff=True))
        self.chattogram = Division.objects.create(name="Chattogram")
        self.districts_url = reverse("manage-district-list")
        self.thanas_url = reverse("manage-thana-list")

    def district_url(self, d):
        return reverse("manage-district-detail", args=[d.id])

    def thana_url(self, t):
        return reverse("manage-thana-detail", args=[t.id])


class DistrictAndThanaCrudTests(PlaceManagementTestCase):
    def test_operators_can_create_rename_and_delete_districts_and_thanas(self):
        created = self.client.post(self.districts_url, {"name": "Feni", "division": self.chattogram.id}, format="json")
        feni = District.objects.get(name="Feni")
        thana = self.client.post(self.thanas_url, {"name": "Parshuram", "district": feni.id}, format="json")
        parshuram = Thana.objects.get(name="Parshuram")

        renamed = self.client.patch(self.district_url(feni), {"name": "Feni Sadar"}, format="json")
        thana_renamed = self.client.patch(self.thana_url(parshuram), {"name": "Parshuram Upazila"}, format="json")

        self.assertEqual((created.status_code, thana.status_code), (status.HTTP_201_CREATED, status.HTTP_201_CREATED))
        self.assertEqual(created.data["division"], {"id": self.chattogram.id, "name": "Chattogram"})
        self.assertEqual(thana.data["district"], {"id": feni.id, "name": "Feni"})
        self.assertEqual((renamed.data["name"], thana_renamed.data["name"]), ("Feni Sadar", "Parshuram Upazila"))
        self.assertEqual(self.client.delete(self.thana_url(parshuram)).status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.delete(self.district_url(feni)).status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(District.objects.exists())

    def test_the_district_list_shows_division_counts_and_whether_a_boundary_is_set(self):
        feni = district("Feni")
        Thana.objects.create(name="Parshuram", district=feni)
        Incident.objects.create(contact_number="1", description="x", address="y", district=feni)
        Volunteer.objects.create(full_name="Karim", contact_number="1", address="y", notes="", district=feni)

        row = self.client.get(self.districts_url).data[0]

        self.assertEqual(row["name"], "Feni")
        self.assertEqual((row["thana_count"], row["incident_count"], row["volunteer_count"]), (1, 1, 1))
        self.assertFalse(row["has_boundary"])
        self.assertNotIn("boundary", row)

    def test_the_thana_list_can_be_narrowed_to_one_district(self):
        feni, sylhet = district("Feni"), district("Sylhet")
        Thana.objects.create(name="Parshuram", district=feni)
        Thana.objects.create(name="Companiganj", district=sylhet)

        names = [t["name"] for t in self.client.get(self.thanas_url, {"district": feni.id}).data]

        self.assertEqual(names, ["Parshuram"])

    def test_the_divisions_are_listed_for_the_district_form(self):
        self.assertEqual(self.client.get(reverse("manage-division-list")).data,
                         [{"id": self.chattogram.id, "name": "Chattogram"}])

    def test_creating_a_district_needs_a_division_and_a_unique_name(self):
        district("Feni")

        no_division = self.client.post(self.districts_url, {"name": "Noakhali"}, format="json")
        duplicate = self.client.post(self.districts_url, {"name": "Feni", "division": self.chattogram.id}, format="json")
        no_district = self.client.post(self.thanas_url, {"name": "Sonagazi"}, format="json")

        self.assertIn("division", no_division.data)
        self.assertIn("name", duplicate.data)
        self.assertIn("district", no_district.data)
        self.assertEqual({no_division.status_code, duplicate.status_code, no_district.status_code},
                         {status.HTTP_400_BAD_REQUEST})

    def test_non_operators_cannot_manage_places(self):
        feni = district("Feni")
        self.client.force_authenticate(get_user_model().objects.create(username="citizen"))

        responses = [
            self.client.get(self.districts_url),
            self.client.post(self.districts_url, {"name": "X", "division": self.chattogram.id}, format="json"),
            self.client.patch(self.district_url(feni), {"name": "Y"}, format="json"),
            self.client.delete(self.district_url(feni)),
            self.client.get(self.thanas_url),
        ]

        self.assertEqual({r.status_code for r in responses}, {status.HTTP_403_FORBIDDEN})
        self.assertEqual(District.objects.get().name, "Feni")


class DeleteInUseTests(PlaceManagementTestCase):
    def setUp(self):
        super().setUp()
        self.feni = district("Feni")
        self.parshuram = Thana.objects.create(name="Parshuram", district=self.feni)

    def assert_refused(self, url):
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("detail", response.data)

    def test_deleting_a_district_or_thana_in_use_is_refused_with_409(self):
        Incident.objects.create(contact_number="1", description="x", address="y", thana=self.parshuram)

        self.assert_refused(self.thana_url(self.parshuram))
        self.assert_refused(self.district_url(self.feni))  # a thana inside it is in use
        self.assertTrue(Thana.objects.filter(pk=self.parshuram.pk).exists())

    def test_a_district_used_by_a_volunteer_an_incident_or_an_event_cannot_be_deleted(self):
        for use in [
            lambda: Volunteer.objects.create(full_name="K", contact_number="1", address="y", notes="", district=self.feni),
            lambda: Incident.objects.create(contact_number="1", description="x", address="y", district=self.feni),
            lambda: event("Feni Flood", districts=[self.feni]),
        ]:
            with self.subTest(use=use):
                used = use()
                self.assert_refused(self.district_url(self.feni))
                used.delete()

    def test_a_thana_used_by_a_volunteer_cannot_be_deleted(self):
        Volunteer.objects.create(full_name="K", contact_number="1", address="y", notes="", thana=self.parshuram)

        self.assert_refused(self.thana_url(self.parshuram))


class BoundaryTests(PlaceManagementTestCase):
    def setUp(self):
        super().setUp()
        self.feni = district("Feni")

    def set_boundary(self, boundary, url=None):
        return self.client.patch(url or self.district_url(self.feni), {"boundary": boundary}, format="json")

    def test_a_geojson_polygon_boundary_is_stored_as_a_multipolygon(self):
        response = self.set_boundary(square(91.43, 23.21))

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.feni.refresh_from_db()
        self.assertEqual(self.feni.polygon.geom_type, "MultiPolygon")
        self.assertTrue(self.feni.polygon.contains(Point(91.43, 23.21, srid=4326)))
        self.assertEqual(response.data["boundary"]["type"], "MultiPolygon")
        self.assertTrue(self.client.get(self.districts_url).data[0]["has_boundary"])

    def test_a_multipolygon_is_accepted_and_null_clears_the_boundary(self):
        multi = {"type": "MultiPolygon", "coordinates": [square(91.43, 23.21)["coordinates"]]}

        self.assertEqual(self.set_boundary(multi).status_code, status.HTTP_200_OK)
        self.assertEqual(self.set_boundary(None).data["boundary"], None)
        self.feni.refresh_from_db()
        self.assertIsNone(self.feni.polygon)

    def test_bad_geojson_a_point_or_a_boundary_outside_bangladesh_is_rejected(self):
        self_crossing = {"type": "Polygon", "coordinates": [[[91, 23], [92, 24], [92, 23], [91, 24], [91, 23]]]}
        for bad in [
            "not geojson",
            {"type": "Polygon", "coordinates": "nope"},
            {"type": "Point", "coordinates": [91.43, 23.21]},
            square(-0.12, 51.5),  # London
            self_crossing,
        ]:
            with self.subTest(boundary=bad):
                response = self.set_boundary(bad)
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("boundary", response.data)
        self.feni.refresh_from_db()
        self.assertIsNone(self.feni.polygon)

    def test_a_thana_boundary_can_be_set_and_is_returned(self):
        parshuram = Thana.objects.create(name="Parshuram", district=self.feni)

        response = self.set_boundary(square(91.43, 23.21), url=self.thana_url(parshuram))

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(self.client.get(self.thana_url(parshuram)).data["boundary"]["type"], "MultiPolygon")

    def test_an_uploaded_boundary_is_used_to_detect_the_area_of_a_web_report(self):
        parshuram = Thana.objects.create(name="Parshuram", district=self.feni)
        self.set_boundary(square(91.43, 23.21, half=0.5))
        self.set_boundary(square(91.43, 23.21), url=self.thana_url(parshuram))

        report = create_incident(description="water rising", address="School", contact_number="01712345678",
                                 location=Point(91.43, 23.21, srid=4326))

        self.assertEqual((report.district, report.thana), (self.feni, parshuram))
