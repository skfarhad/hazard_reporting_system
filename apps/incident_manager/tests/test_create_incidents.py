from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from django.contrib.gis.geos import Point
from apps.incident_manager.models import Provider, Incident, NeedType


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


class IncidentIntakeNeedsTests(APITestCase):
    def setUp(self):
        self.provider = Provider.objects.create(name="SMS Gateway", description="", website_link="", logo_url="")
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION="Api-Key " + self.provider.api_key)
        self.url = reverse("incident-create")
        self.base = {
            "contact_number": "01712345678",
            "latitude": 23.0159,
            "longitude": 91.3976,
            "address": "Govt. Primary School, Parshuram",
        }

    def needs_of_latest(self):
        return sorted(Incident.objects.latest("id").needs.values_list("code", flat=True))

    def test_a_provider_can_send_explicit_needs_and_triage_fields(self):
        data = {**self.base, "description": "5 people on roof", "needs": ["rescue", "medical"],
                "life_threatening": True, "people_count": 5}

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.needs_of_latest(), ["medical", "rescue"])
        incident = Incident.objects.latest("id")
        self.assertTrue(incident.life_threatening)
        self.assertEqual(incident.people_count, 5)

    def test_needs_are_parsed_from_the_report_text_when_the_provider_sends_none(self):
        data = {**self.base, "description": "RESCUE+oshudh#Feni#Parshuram#School#5 people on roof"}

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.needs_of_latest(), ["medical", "rescue"])

    def test_a_report_without_a_recognised_keyword_is_accepted_with_the_other_need(self):
        data = {**self.base, "description": "water rising fast, please help"}

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.needs_of_latest(), ["other"])

    def test_an_unknown_need_code_from_a_provider_is_refused_with_400(self):
        data = {**self.base, "description": "x", "needs": ["teleport"]}

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("needs", response.data)
        self.assertFalse(Incident.objects.exists())

    def test_the_existing_provider_payload_without_the_new_fields_is_still_accepted(self):
        data = {**self.base, "description": "Test incident", "additional_info": {"info": "x"}}

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.needs_of_latest(), ["other"])

    def test_an_unmatched_report_gets_the_fallback_need_even_if_it_was_renamed(self):
        NeedType.objects.filter(is_fallback=True).update(code="unclassified")
        data = {**self.base, "description": "please help"}

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.needs_of_latest(), ["unclassified"])
