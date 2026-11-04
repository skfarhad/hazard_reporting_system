from importlib import import_module

from django.apps import apps
from django.test import TestCase

from apps.incident_manager.models import Incident, NeedType

seed = import_module("apps.incident_manager.migrations.0009_seed_need_types")

PROPOSED_CODES = {"rescue", "medical", "food", "water", "shelter", "missing", "safety", "damage", "other"}


class SeedNeedTypesTests(TestCase):
    def test_the_seeded_need_types_include_every_proposed_code_and_exactly_one_fallback(self):
        codes = set(NeedType.objects.values_list("code", flat=True))

        self.assertTrue(PROPOSED_CODES <= codes)
        self.assertEqual(list(NeedType.objects.filter(is_fallback=True).values_list("code", flat=True)), ["other"])

    def test_seeded_keywords_cover_english_and_banglish(self):
        keyword_map = NeedType.keyword_map()

        self.assertEqual(keyword_map["rescue"], "rescue")
        self.assertEqual(keyword_map["uddhar"], "rescue")
        self.assertEqual(keyword_map["উদ্ধার"], "rescue")
        self.assertEqual(keyword_map["oshudh"], "medical")

    def test_running_the_seed_again_doesnt_create_duplicates_or_overwrite_edited_labels(self):
        NeedType.objects.filter(code="rescue").update(label_en="Rescue (boat)")
        count = NeedType.objects.count()

        seed.seed_need_types(apps, None)

        self.assertEqual(NeedType.objects.count(), count)
        self.assertEqual(NeedType.objects.get(code="rescue").label_en, "Rescue (boat)")

    def test_existing_incidents_without_needs_get_the_other_need(self):
        old = Incident.objects.create(contact_number="017", description="x", address="y")
        food = NeedType.objects.get(code="food")
        classified = Incident.objects.create(contact_number="018", description="x", address="y")
        classified.needs.add(food)

        seed.backfill_other_need(apps, None)

        self.assertEqual(list(old.needs.values_list("code", flat=True)), ["other"])
        self.assertEqual(list(classified.needs.values_list("code", flat=True)), ["food"])
