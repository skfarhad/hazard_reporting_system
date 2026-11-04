from django.test import TestCase

from apps.incident_manager.models import Incident


class IncidentFieldTests(TestCase):
    def test_an_incidents_string_names_its_id_and_validation_status(self):
        # Regression: __str__ referenced a non-existent `status` field and raised AttributeError.
        incident = Incident.objects.create(contact_number="017", description="x", address="y")

        self.assertEqual(str(incident), f"Incident {incident.id} - pending")

    def test_a_new_incident_is_not_life_threatening_and_has_no_people_count(self):
        incident = Incident.objects.create(contact_number="017", description="x", address="y")

        self.assertFalse(incident.life_threatening)
        self.assertIsNone(incident.people_count)
        self.assertEqual(list(incident.needs.all()), [])
