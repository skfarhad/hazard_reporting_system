from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.tests.factories import district, event
from apps.incident_manager.models import Incident, NeedType, Provider, Thana, Union
from apps.volunteer_hub.models import Volunteer


class IncidentDetailApiTests(APITestCase):
    def setUp(self):
        self.operator = get_user_model().objects.create(username="operator", is_staff=True)
        feni = district("Feni")
        self.volunteer = Volunteer.objects.create(
            full_name="Rahim Uddin", contact_number="01800000000", address="Feni", location=Point(91.4, 23.0, srid=4326),
        )
        self.incident = Incident.objects.create(
            contact_number="01700000001",
            description="5 people on roof",
            address="Govt. Primary School",
            location=Point(91.43, 23.21, srid=4326),
            district=feni,
            thana=Thana.objects.create(name="Parshuram", district=feni),
            provider=Provider.objects.create(name="Smoke Test Gateway"),
            event=event("Feni Flood"),
            life_threatening=True,
            people_count=5,
        )
        self.incident.needs.set(NeedType.objects.filter(code__in=["rescue", "medical"]))
        self.incident.volunteers.set([self.volunteer])
        self.url = reverse("incident-detail", args=[self.incident.id])

    def test_an_operator_can_fetch_one_incident_with_its_district_thana_provider_volunteers_and_update_time(self):
        self.client.force_authenticate(self.operator)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data["id"], self.incident.id)
        self.assertEqual(data["description"], "5 people on roof")
        self.assertEqual(sorted(data["needs"]), ["medical", "rescue"])
        self.assertEqual(data["event"]["hazard"]["code"], "flood")
        self.assertEqual((data["district"], data["thana"]), ("Feni", "Parshuram"))
        self.assertEqual(data["provider"], "Smoke Test Gateway")
        self.assertEqual(data["volunteers"], [
            {"id": self.volunteer.id, "full_name": "Rahim Uddin", "contact_number": "01800000000", "photo": None},
        ])
        self.assertEqual(data["volunteer_count"], 1)
        self.assertNotIn("volunteer", data)
        self.assertIn("updated_at", data)
        self.assertAlmostEqual(data["latitude"], 23.21)

    def test_optional_links_are_null_when_missing(self):
        bare = Incident.objects.create(contact_number="1", description="x", address="y")
        self.client.force_authenticate(self.operator)

        data = self.client.get(reverse("incident-detail", args=[bare.id])).data

        self.assertEqual((data["district"], data["thana"], data["provider"], data["volunteers"], data["event"]),
                         (None, None, None, [], None))
        self.assertIsNone(data["union"])

    def test_incident_details_and_list_include_the_union_name(self):
        self.incident.union = Union.objects.create(name="Mirzanagar", thana=self.incident.thana)
        self.incident.save()
        self.client.force_authenticate(self.operator)

        detail = self.client.get(self.url).data
        listed = self.client.get(reverse("incident-list")).data["results"]

        self.assertEqual(detail["union"], "Mirzanagar")
        self.assertEqual([row["union"] for row in listed if row["id"] == self.incident.id], ["Mirzanagar"])

    def test_fetching_a_missing_incident_returns_404(self):
        self.client.force_authenticate(self.operator)

        response = self.client.get(reverse("incident-detail", args=[999999]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_operators_cannot_fetch_an_incident(self):
        self.client.force_authenticate(get_user_model().objects.create(username="public"))

        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)

    def test_updating_an_incident_responds_with_the_detail_shape(self):
        self.client.force_authenticate(self.operator)

        response = self.client.patch(self.url, {"people_count": 7}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["people_count"], 7)
        self.assertEqual(response.data["thana"], "Parshuram")
        self.assertEqual(response.data["volunteers"][0]["full_name"], "Rahim Uddin")


class IncidentSourceForOperatorsTests(APITestCase):
    def setUp(self):
        self.operator = get_user_model().objects.create(username="operator", is_staff=True)
        self.client.force_authenticate(self.operator)

    def test_operators_see_the_source_in_the_list_and_the_reporters_name_in_the_details(self):
        reporter = get_user_model().objects.create(username="citizen", full_name="Karim Uddin")
        no_name = get_user_model().objects.create(username="anon42")
        web = Incident.objects.create(contact_number="1", description="x", address="y", source="web", reported_by=reporter)
        unnamed = Incident.objects.create(contact_number="2", description="x", address="y", source="web", reported_by=no_name)
        sms = Incident.objects.create(contact_number="3", description="x", address="y")

        listed = {i["id"]: i["source"] for i in self.client.get(reverse("incident-list")).data["results"]}
        detail = lambda incident: self.client.get(reverse("incident-detail", args=[incident.id])).data

        self.assertEqual(listed, {web.id: "web", unnamed.id: "web", sms.id: "provider"})
        self.assertEqual(detail(web)["reported_by"], {"id": reporter.id, "name": "Karim Uddin"})
        self.assertEqual(detail(unnamed)["reported_by"]["name"], "anon42")
        self.assertIsNone(detail(sms)["reported_by"])
        self.assertEqual(detail(sms)["source"], "provider")
