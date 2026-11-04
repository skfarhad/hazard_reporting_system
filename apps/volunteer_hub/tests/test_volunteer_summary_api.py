from django.contrib.auth import get_user_model
from rest_framework import status

from apps.volunteer_hub.tests.test_get_volunteer import VolunteerApiTestCase, volunteer


class VolunteerSummaryTests(VolunteerApiTestCase):
    url_name = "volunteer-summary"

    def test_volunteer_summary_counts_active_inactive_and_total(self):
        volunteer("Karim", district=self.feni, thana=self.parshuram)
        volunteer("Rahim", district=self.feni, is_active=False)
        volunteer("Salma", district=self.sylhet)

        self.assertEqual(self.client.get(self.url).data, {"active": 2, "inactive": 1, "total": 3})
        self.assertEqual(self.client.get(self.url, {"district": self.feni.id}).data,
                         {"active": 1, "inactive": 1, "total": 2})
        self.assertEqual(self.client.get(self.url, {"thana": self.parshuram.id, "q": "kar"}).data,
                         {"active": 1, "inactive": 0, "total": 1})

    def test_the_summary_ignores_the_active_filter_so_each_card_keeps_its_count(self):
        volunteer("Karim")
        volunteer("Rahim", is_active=False)

        self.assertEqual(self.client.get(self.url, {"active": "true"}).data, {"active": 1, "inactive": 1, "total": 2})

    def test_non_operators_cannot_read_the_volunteer_summary(self):
        self.client.force_authenticate(get_user_model().objects.create(username="citizen"))

        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)
