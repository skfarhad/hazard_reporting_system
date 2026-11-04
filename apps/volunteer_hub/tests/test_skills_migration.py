from importlib import import_module

from django.apps import apps
from django.test import TestCase

from apps.volunteer_hub.models import Volunteer

migration = import_module("apps.volunteer_hub.migrations.0006_volunteer_skills")


def volunteer(name, assistance_type, notes=""):
    return Volunteer.objects.create(
        full_name=name, contact_number="018", address="x", notes=notes, assistance_type=assistance_type,
    )


class AssistanceTypeToSkillsTests(TestCase):
    def test_existing_assistance_types_map_to_skills(self):
        cook = volunteer("Cook", "food")
        doctor = volunteer("Doctor", " Doctor ")
        boatman = volunteer("Boatman", "boat")

        migration.map_assistance_types_to_skills(apps, None)

        self.assertEqual(list(cook.skills.values_list("code", flat=True)), ["food"])
        self.assertEqual(list(doctor.skills.values_list("code", flat=True)), ["medical"])
        self.assertEqual(list(boatman.skills.values_list("code", flat=True)), ["rescue"])

    def test_unmapped_assistance_types_are_kept_in_notes(self):
        driver = volunteer("Driver", "logistics", notes="Has a truck.")

        migration.map_assistance_types_to_skills(apps, None)

        driver.refresh_from_db()
        self.assertEqual(list(driver.skills.all()), [])
        self.assertEqual(driver.notes, "Has a truck.\nPrevious assistance type: logistics")

    def test_volunteers_without_an_assistance_type_are_left_unchanged(self):
        blank = volunteer("New", "", notes="")

        migration.map_assistance_types_to_skills(apps, None)

        blank.refresh_from_db()
        self.assertEqual(list(blank.skills.all()), [])
        self.assertEqual(blank.notes, "")
