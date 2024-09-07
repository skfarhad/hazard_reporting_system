"""
Test cases for Volunteer and Incident models to ensure structural integrity.

These tests are designed to validate the existence, types, and attributes of fields
within the Volunteer and Incident models. They ensure that any changes to the model
structure, field attributes, or relationships will cause the test cases to fail, 
thereby safeguarding against unintended modifications.
"""

from django.test import TestCase
from django.contrib.gis.db import models as gis_models
from apps.incident_manager.models import Incident
from apps.volunteer_hub.models import Volunteer
from apps.incident_manager.models.address import Thana, District
from apps.incident_manager.constants import IncidentStatus, TaskStatus


class VolunteerModelTest(TestCase):
    def test_volunteer_fields(self):
        # Check if the Volunteer model has the correct fields
        model_fields = Volunteer._meta.get_fields()

        # Ensure specific fields exist and have correct attributes
        self.assertTrue(
            any(
                field.name == "full_name" and isinstance(field, gis_models.CharField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "contact_number"
                and isinstance(field, gis_models.CharField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "location" and isinstance(field, gis_models.PointField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "address" and isinstance(field, gis_models.CharField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "thana"
                and isinstance(field, gis_models.ForeignKey)
                and field.related_model == Thana
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "district"
                and isinstance(field, gis_models.ForeignKey)
                and field.related_model == District
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "is_active" and isinstance(field, gis_models.BooleanField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "notes" and isinstance(field, gis_models.TextField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "assistance_type"
                and isinstance(field, gis_models.CharField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "created_at"
                and isinstance(field, gis_models.DateTimeField)
                and field.auto_now_add
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "updated_at"
                and isinstance(field, gis_models.DateTimeField)
                and field.auto_now
                for field in model_fields
            )
        )

    def test_volunteer_relationships(self):
        # Ensure foreign keys are correctly related
        self.assertEqual(Volunteer._meta.get_field("thana").related_model, Thana)
        self.assertEqual(Volunteer._meta.get_field("district").related_model, District)


class IncidentModelTest(TestCase):
    def test_incident_fields(self):
        # Check if the Incident model has the correct fields
        model_fields = Incident._meta.get_fields()

        # Ensure specific fields exist and have correct attributes
        self.assertTrue(
            any(
                field.name == "contact_number"
                and isinstance(field, gis_models.CharField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "provider" and isinstance(field, gis_models.ForeignKey)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "thana"
                and isinstance(field, gis_models.ForeignKey)
                and field.related_model == Thana
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "district"
                and isinstance(field, gis_models.ForeignKey)
                and field.related_model == District
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "location" and isinstance(field, gis_models.PointField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "description" and isinstance(field, gis_models.TextField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "additional_info"
                and isinstance(field, gis_models.JSONField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "validation_status"
                and isinstance(field, gis_models.CharField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "task_status" and isinstance(field, gis_models.CharField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "address" and isinstance(field, gis_models.CharField)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "volunteer" and isinstance(field, gis_models.ForeignKey)
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "created_at"
                and isinstance(field, gis_models.DateTimeField)
                and field.auto_now_add
                for field in model_fields
            )
        )
        self.assertTrue(
            any(
                field.name == "updated_at"
                and isinstance(field, gis_models.DateTimeField)
                and field.auto_now
                for field in model_fields
            )
        )

    def test_incident_choices(self):
        # Ensure that choices are correctly defined for status fields
        self.assertEqual(
            Incident._meta.get_field("validation_status").choices,
            IncidentStatus.choices(),
        )
        self.assertEqual(
            Incident._meta.get_field("task_status").choices, TaskStatus.choices()
        )

    def test_incident_relationships(self):
        # Ensure foreign keys are correctly related
        self.assertEqual(Incident._meta.get_field("thana").related_model, Thana)
        self.assertEqual(Incident._meta.get_field("district").related_model, District)
