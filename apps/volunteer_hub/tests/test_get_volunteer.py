from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.gis.geos import Point
from apps.volunteer_hub.models import Volunteer


class VolunteerListViewTestCase(APITestCase):

    def setUp(self):
        # Create some volunteers
        Volunteer.objects.create(
            full_name="John Doe",
            contact_number="1234567890",
            location=Point(-74.005974, 40.712776, srid=4326),  # New York coordinates
            address="123 Main St, New York, NY",
            is_active=True,
            notes="Available for food distribution",
            assistance_type="food",
        )
        Volunteer.objects.create(
            full_name="Jane Smith",
            contact_number="0987654321",
            location=Point(
                -118.243683, 34.052235, srid=4326
            ),  # Los Angeles coordinates
            address="456 Elm St, Los Angeles, CA",
            is_active=True,
            notes="Available for medical assistance",
            assistance_type="doctor",
        )
        Volunteer.objects.create(
            full_name="Inactive Volunteer",
            contact_number="5555555555",
            location=Point(-87.629799, 41.878113, srid=4326),  # Chicago coordinates
            address="789 Oak St, Chicago, IL",
            is_active=False,  # This volunteer is inactive
            notes="Inactive volunteer",
            assistance_type="logistics",
        )

        # URL for the volunteer list
        self.url = reverse("volunteer-list")

    def test_get_volunteers(self):
        """Test retrieving the list of active volunteers."""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            len(response.data), 2
        )  # Only active volunteers should be returned

        # Check the content of the response
        first_volunteer = response.data[0]
        self.assertEqual(first_volunteer["full_name"], "John Doe")
        self.assertEqual(first_volunteer["latitude"], 40.712776)
        self.assertEqual(first_volunteer["longitude"], -74.005974)
        self.assertEqual(first_volunteer["assistance_type"], "food")
        self.assertEqual(first_volunteer["address"], "123 Main St, New York, NY")

    def test_no_volunteers(self):
        """Test retrieving volunteers when none are active."""
        # Set all volunteers to inactive
        Volunteer.objects.update(is_active=False)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # No volunteers should be returned

    def test_volunteer_location_data(self):
        """Test that the latitude and longitude data are correctly serialized."""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check the latitude and longitude for the second volunteer
        second_volunteer = response.data[1]
        self.assertEqual(second_volunteer["latitude"], 34.052235)
        self.assertEqual(second_volunteer["longitude"], -118.243683)

    def test_volunteer_list_structure(self):
        """Test that the returned data structure is as expected."""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check the keys in the first volunteer entry
        first_volunteer = response.data[0]
        self.assertIn("full_name", first_volunteer)
        self.assertIn("latitude", first_volunteer)
        self.assertIn("longitude", first_volunteer)
        self.assertIn("assistance_type", first_volunteer)
        self.assertIn("address", first_volunteer)
