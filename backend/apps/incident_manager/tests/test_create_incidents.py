from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from django.contrib.gis.geos import Point
from apps.incident_manager.models import Provider, Incident


class IncidentCreateViewTestCase(APITestCase):

    def setUp(self):
        # Create a provider with a unique API key
        self.provider = Provider.objects.create(
            name="Test Provider",
            description="Test Description",
            website_link="https://example.com",
            logo_url="https://example.com/logo.png",
        )

        # Set up the API client and authenticate with the provider's API key
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION="Api-Key " + self.provider.api_key)

        # URL for creating incidents
        self.url = reverse("incident-create")

    def test_create_incident_success(self):
        """Test creating an incident with valid data and a valid API key."""
        data = {
            "contact_number": "1234567890",
            "latitude": 10.1,
            "longitude": 125.6,
            "description": "Test incident",
            "additional_info": {"info": "some additional info"},
            "address": "1234 Example Street",
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Incident.objects.count(), 1)
        incident = Incident.objects.first()
        self.assertEqual(incident.provider, self.provider)

        # Compare the coordinates of the Point objects
        self.assertEqual(incident.location.x, 125.6)
        self.assertEqual(incident.location.y, 10.1)

        # Alternatively, use the equals method
        expected_point = Point(125.6, 10.1, srid=4326)
        self.assertTrue(incident.location.equals(expected_point))

        # Ensure the serialized data contains the correct latitude and longitude
        self.assertEqual(response.data["location_latitude"], 10.1)
        self.assertEqual(response.data["location_longitude"], 125.6)

    def test_create_incident_missing_required_fields(self):
        """Test creating an incident with missing required fields."""
        data = {
            "latitude": 10.1,
            "longitude": 125.6,
            "description": "Test incident",
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Incident.objects.count(), 0)
        self.assertIn("contact_number", response.data)
        self.assertIn("address", response.data)

    def test_create_incident_invalid_latitude_longitude(self):
        """Test creating an incident with invalid latitude/longitude values."""
        data = {
            "contact_number": "1234567890",
            "latitude": "invalid",
            "longitude": "invalid",
            "description": "Test incident",
            "address": "1234 Example Street",
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Incident.objects.count(), 0)
        self.assertIn("latitude", response.data)
        self.assertIn("longitude", response.data)

    def test_create_incident_with_extra_fields(self):
        """Test creating an incident with extra fields that are not defined in the model."""
        data = {
            "contact_number": "1234567890",
            "latitude": 10.1,
            "longitude": 125.6,
            "description": "Test incident",
            "address": "1234 Example Street",
            "extra_field": "This should not be accepted",
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Incident.objects.count(), 1)
        incident = Incident.objects.first()
        self.assertNotIn("extra_field", incident.__dict__)

    def test_create_incident_with_different_api_key(self):
        """Test creating an incident with a different valid API key."""
        # Create another provider
        another_provider = Provider.objects.create(
            name="Another Provider",
            description="Another Description",
            website_link="https://another-example.com",
            logo_url="https://another-example.com/logo.png",
        )

        # Use the API key from the new provider
        self.client.credentials(
            HTTP_AUTHORIZATION="Api-Key " + another_provider.api_key
        )

        data = {
            "contact_number": "1234567890",
            "latitude": 10.1,
            "longitude": 125.6,
            "description": "Test incident with different provider",
            "address": "5678 Another Street",
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Incident.objects.count(), 1)
        incident = Incident.objects.first()
        self.assertEqual(incident.provider, another_provider)

    def test_create_incident_duplicate(self):
        """Test creating an incident with the same details multiple times."""
        data = {
            "contact_number": "1234567890",
            "latitude": 10.1,
            "longitude": 125.6,
            "description": "Test incident",
            "address": "1234 Example Street",
        }

        response1 = self.client.post(self.url, data, format="json")
        response2 = self.client.post(self.url, data, format="json")
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Incident.objects.count(), 2
        )  # Each post should create a new incident

    def test_create_incident_without_authorization(self):
        """Test creating an incident without providing an API key."""
        # Remove the API key from the client's credentials
        self.client.credentials()

        data = {
            "contact_number": "1234567890",
            "latitude": 10.1,
            "longitude": 125.6,
            "description": "Test incident",
            "address": "1234 Example Street",
        }

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Incident.objects.count(), 0)
