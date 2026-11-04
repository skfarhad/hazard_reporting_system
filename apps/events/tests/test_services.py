from django.test import TestCase

from apps.events.services import attach_event
from apps.events.tests.factories import district, event
from apps.incident_manager.models import Incident


def incident_in(district_):
    return Incident.objects.create(contact_number="017", description="x", address="y", district=district_)


class AttachEventTests(TestCase):
    def setUp(self):
        self.feni = district("Feni")
        self.sylhet = district("Sylhet")

    def test_an_incident_in_a_district_covered_by_an_active_event_is_attached_to_it(self):
        flood = event("Feni Flood", districts=[self.feni])
        incident = incident_in(self.feni)

        attach_event(incident)

        incident.refresh_from_db()
        self.assertEqual(incident.event, flood)

    def test_ended_and_not_yet_started_events_are_ignored(self):
        event("Old flood", districts=[self.feni], started_days_ago=400, ended_days_ago=380)
        event("Forecast flood", districts=[self.feni], started_days_ago=-1)
        incident = incident_in(self.feni)

        attach_event(incident)

        incident.refresh_from_db()
        self.assertIsNone(incident.event)

    def test_when_several_active_events_cover_the_district_the_most_recently_started_wins(self):
        event("Monsoon flood", districts=[self.feni, self.sylhet], started_days_ago=20)
        landslide = event("Feni landslide", districts=[self.feni], started_days_ago=2, hazard_code="landslide")
        incident = incident_in(self.feni)

        attach_event(incident)

        incident.refresh_from_db()
        self.assertEqual(incident.event, landslide)

    def test_an_incident_without_a_district_is_not_attached_to_any_event(self):
        event("Feni Flood", districts=[self.feni])
        incident = incident_in(None)

        attach_event(incident)

        incident.refresh_from_db()
        self.assertIsNone(incident.event)
