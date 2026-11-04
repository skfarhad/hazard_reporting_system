from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.incident_manager.tests.test_dashboard_filters import incident
from apps.volunteer_hub.models import Volunteer


def volunteer(name):
    return Volunteer.objects.create(full_name=name, contact_number="01812345678", address="x", notes="")


class AssignmentApiTestCase(APITestCase):
    def setUp(self):
        self.client.force_authenticate(get_user_model().objects.create(username="operator", is_staff=True))
        self.flood = incident("flood")
        self.karim, self.rahim = volunteer("Karim"), volunteer("Rahim")
        self.assign_url = reverse("incident-volunteers", args=[self.flood.id])

    def unassign_url(self, person):
        return reverse("incident-volunteer", args=[self.flood.id, person.id])

    def assigned(self):
        return sorted(self.flood.volunteers.values_list("full_name", flat=True))


class AssignVolunteerTests(AssignmentApiTestCase):
    def test_an_operator_can_assign_a_volunteer_and_assigning_again_changes_nothing(self):
        first = self.client.post(self.assign_url, {"volunteer": self.karim.id}, format="json")
        again = self.client.post(self.assign_url, {"volunteer": self.karim.id}, format="json")

        self.assertEqual((first.status_code, again.status_code), (status.HTTP_200_OK, status.HTTP_200_OK))
        self.assertEqual(again.data["volunteer_count"], 1)
        self.assertEqual(self.assigned(), ["Karim"])

    def test_assigning_an_unknown_volunteer_is_rejected(self):
        response = self.client.post(self.assign_url, {"volunteer": 999999}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("volunteer", response.data)

    def test_assigning_to_a_missing_incident_is_404(self):
        url = reverse("incident-volunteers", args=[999999])

        self.assertEqual(self.client.post(url, {"volunteer": self.karim.id}, format="json").status_code,
                         status.HTTP_404_NOT_FOUND)

    def test_unassigning_removes_only_that_volunteer(self):
        self.flood.volunteers.set([self.karim, self.rahim])

        response = self.client.delete(self.unassign_url(self.karim))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.assigned(), ["Rahim"])

    def test_unassigning_someone_not_assigned_is_404(self):
        self.assertEqual(self.client.delete(self.unassign_url(self.karim)).status_code, status.HTTP_404_NOT_FOUND)

    def test_non_operators_cannot_assign(self):
        self.client.force_authenticate(get_user_model().objects.create(username="citizen"))
        self.flood.volunteers.set([self.rahim])

        post = self.client.post(self.assign_url, {"volunteer": self.karim.id}, format="json")
        delete = self.client.delete(self.unassign_url(self.rahim))

        self.assertEqual((post.status_code, delete.status_code), (status.HTTP_403_FORBIDDEN, status.HTTP_403_FORBIDDEN))
        self.assertEqual(self.assigned(), ["Rahim"])


class PatchVolunteersTests(AssignmentApiTestCase):
    def patch(self, **body):
        return self.client.patch(reverse("incident-detail", args=[self.flood.id]), body, format="json")

    def test_patching_volunteers_replaces_the_list(self):
        self.flood.volunteers.set([self.karim])

        response = self.patch(volunteers=[self.rahim.id])

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(self.assigned(), ["Rahim"])
        self.assertEqual([v["full_name"] for v in response.data["volunteers"]], ["Rahim"])
        self.assertEqual(response.data["volunteer_count"], 1)

    def test_patching_an_empty_list_unassigns_everyone(self):
        self.flood.volunteers.set([self.karim, self.rahim])

        self.assertEqual(self.patch(volunteers=[]).status_code, status.HTTP_200_OK)
        self.assertEqual(self.assigned(), [])

    def test_unknown_volunteer_ids_are_rejected(self):
        self.flood.volunteers.set([self.karim])

        response = self.patch(volunteers=[self.rahim.id, 999999])

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("volunteers", response.data)
        self.assertEqual(self.assigned(), ["Karim"])

    def test_details_list_the_assigned_volunteers_with_photos(self):
        self.rahim.photo = "volunteers/rahim.png"
        self.rahim.save()
        self.flood.volunteers.set([self.rahim, self.karim])

        data = self.client.get(reverse("incident-detail", args=[self.flood.id])).data

        self.assertEqual([v["full_name"] for v in data["volunteers"]], ["Karim", "Rahim"])
        self.assertTrue(data["volunteers"][1]["photo"].endswith("/media/volunteers/rahim.png"))
        self.assertIsNone(data["volunteers"][0]["photo"])
