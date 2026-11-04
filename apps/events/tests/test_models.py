from django.test import TestCase

from apps.events.models import Event, HazardType
from apps.events.tests.factories import event

PROPOSED_GROUPS = {"water_weather", "geological", "fire_structural", "transport", "biological", "other"}


class EventModelTests(TestCase):
    def test_an_active_event_has_started_and_not_ended(self):
        running = event("Feni Flood")

        self.assertEqual(list(Event.objects.active()), [running])

    def test_ended_and_future_events_are_not_active(self):
        event("Last year's cyclone", started_days_ago=400, ended_days_ago=380)
        event("Forecast flood", started_days_ago=-2)

        self.assertEqual(list(Event.objects.active()), [])


class SeedHazardTypesTests(TestCase):
    def test_the_seeded_hazard_types_cover_every_proposed_group(self):
        self.assertEqual(set(HazardType.objects.values_list("group", flat=True)), PROPOSED_GROUPS)

    def test_the_seeded_hazard_types_include_bangladeshs_common_hazards(self):
        codes = set(HazardType.objects.values_list("code", flat=True))

        self.assertTrue({"flood", "cyclone", "landslide", "river_erosion", "fire", "boat_capsize"} <= codes)
