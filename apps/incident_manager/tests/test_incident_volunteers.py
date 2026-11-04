from importlib import import_module

from django.apps import apps
from django.contrib.gis.geos import Point
from django.test import TestCase

from apps.incident_manager.models import Incident
from apps.volunteer_hub.models import Volunteer

migration = import_module("apps.incident_manager.migrations.0012_incident_volunteers")


def volunteer(name):
    return Volunteer.objects.create(full_name=name, contact_number="01712345678", address="x", notes="")


def incident(**fields):
    return Incident.objects.create(
        contact_number="01712345678", description="help", address="x", location=Point(91.4, 23.2), **fields,
    )


class IncidentVolunteersTests(TestCase):
    def test_assigning_volunteers_to_an_incident_keeps_all_of_them(self):
        karim, rahim = volunteer("Karim"), volunteer("Rahim")
        flood = incident()

        flood.volunteers.add(karim, rahim)

        self.assertEqual(sorted(flood.volunteers.values_list("full_name", flat=True)), ["Karim", "Rahim"])
        self.assertEqual(list(karim.assigned_incidents.all()), [flood])

    def test_the_data_migration_copies_the_single_volunteer_into_the_volunteers_list(self):
        karim = volunteer("Karim")
        assigned, unassigned = incident(volunteer=karim), incident()

        migration.copy_volunteer_to_volunteers(apps, None)

        self.assertEqual(list(assigned.volunteers.all()), [karim])
        self.assertEqual(list(unassigned.volunteers.all()), [])
