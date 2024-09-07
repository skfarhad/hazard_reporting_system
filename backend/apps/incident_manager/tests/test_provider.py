from django.test import TestCase, RequestFactory
from apps.incident_manager.models import Provider
from rest_framework_api_key.models import APIKey
from rest_framework_api_key.permissions import HasAPIKey
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class ProviderModelTest(TestCase):

    def test_provider_str_method(self):
        """Test the string representation of the Provider model."""
        provider = Provider.objects.create(
            name="Test Provider",
            description="Test Description",
            website_link="https://example.com",
            logo_url="https://example.com/logo.png",
        )
        self.assertEqual(str(provider), "Test Provider")

    def test_api_key_generation(self):
        """Test that an API key is generated when a Provider is saved without one."""
        provider = Provider.objects.create(
            name="New Provider",
            description="New Description",
            website_link="https://example.com",
            logo_url="https://example.com/logo.png",
        )

        # Check that the API key has been generated
        self.assertIsNotNone(provider.api_key)

        # Verify that the generated API key matches one in the APIKey model
        api_key_exists = APIKey.objects.filter(prefix=provider.api_key[:8]).exists()
        self.assertTrue(api_key_exists)

    def test_api_key_preserved_on_update(self):
        """Test that the API key is not regenerated when updating a Provider."""
        provider = Provider.objects.create(
            name="Update Provider",
            description="Description before update",
            website_link="https://example.com",
            logo_url="https://example.com/logo.png",
        )

        original_api_key = provider.api_key

        # Update the provider details without changing the API key
        provider.description = "Updated Description"
        provider.save()

        # Check that the API key remains the same
        self.assertEqual(provider.api_key, original_api_key)

    def test_api_key_not_overwritten(self):
        """Test that a manually set API key is not overwritten."""
        manual_api_key = "manual-api-key-1234567890abcdef"

        provider = Provider.objects.create(
            name="Manual Key Provider",
            api_key=manual_api_key,
            description="Description",
            website_link="https://example.com",
            logo_url="https://example.com/logo.png",
        )

        # Check that the manual API key is preserved
        self.assertEqual(provider.api_key, manual_api_key)
