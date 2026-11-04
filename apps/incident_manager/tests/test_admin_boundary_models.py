from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.incident_manager.models import District, Division, Incident, Thana, Union


class PlaceNameRuleTests(TestCase):
    """Place names repeat across Bangladesh; they only need to be unique within their parent."""

    def setUp(self):
        self.dhaka = Division.objects.create(name="Dhaka")
        self.khulna = Division.objects.create(name="Khulna")
        self.gazipur = District.objects.create(name="Gazipur", division=self.dhaka)
        self.jhenaidah = District.objects.create(name="Jhenaidah", division=self.khulna)

    def assertRejected(self, model, **fields):
        with self.assertRaises(IntegrityError), transaction.atomic():
            model.objects.create(**fields)

    def test_the_same_thana_name_is_allowed_in_two_districts(self):
        Thana.objects.create(name="Kaliganj", district=self.gazipur)
        Thana.objects.create(name="Kaliganj", district=self.jhenaidah)

        self.assertEqual(Thana.objects.filter(name="Kaliganj").count(), 2)

    def test_one_district_cannot_have_two_thanas_with_the_same_name_ignoring_case(self):
        Thana.objects.create(name="Kaliganj", district=self.gazipur)

        self.assertRejected(Thana, name="kaliganj", district=self.gazipur)

    def test_the_same_district_name_is_rejected_twice_in_one_division(self):
        District.objects.create(name="Kushtia", division=self.khulna)

        self.assertRejected(District, name="KUSHTIA", division=self.khulna)


class AreaCodeTests(TestCase):
    """Each place can carry its national area code (OCHA/BBS P-code), unique across the country."""

    def setUp(self):
        self.chattogram = Division.objects.create(name="Chattogram", code="BD20")
        self.feni = District.objects.create(name="Feni", division=self.chattogram, code="BD2030")

    def test_area_codes_are_unique_across_the_country(self):
        cumilla = District.objects.create(name="Cumilla", division=self.chattogram, code="BD2019")
        Thana.objects.create(name="Parshuram", district=self.feni, code="BD203094")

        for model, fields in [
            (Division, {"name": "Dhaka"}),
            (District, {"name": "Noakhali", "division": self.chattogram}),
            (Thana, {"name": "Barura", "district": cumilla}),
        ]:
            with self.subTest(model=model.__name__):
                taken = {"Division": "BD20", "District": "BD2030", "Thana": "BD203094"}[model.__name__]
                with self.assertRaises(IntegrityError), transaction.atomic():
                    model.objects.create(code=taken, **fields)

    def test_places_added_by_hand_need_no_area_code(self):
        sonagazi = Thana.objects.create(name="Sonagazi", district=self.feni)
        fulgazi = Thana.objects.create(name="Fulgazi", district=self.feni)

        self.assertIsNone(sonagazi.code)
        self.assertIsNone(fulgazi.code)


class UnionTests(TestCase):
    """Unions sit under thanas; their names repeat across thanas but not within one."""

    def setUp(self):
        khulna = Division.objects.create(name="Khulna")
        jhenaidah = District.objects.create(name="Jhenaidah", division=khulna)
        self.shailkupa = Thana.objects.create(name="Shailkupa", district=jhenaidah)
        self.harinakunda = Thana.objects.create(name="Harinakunda", district=jhenaidah)

    def test_the_same_union_name_is_allowed_in_two_thanas_but_not_twice_in_one(self):
        Union.objects.create(name="Abaipur", thana=self.shailkupa, code="BD40448010")
        Union.objects.create(name="Abaipur", thana=self.harinakunda)

        with self.assertRaises(IntegrityError), transaction.atomic():
            Union.objects.create(name="ABAIPUR", thana=self.shailkupa)
        self.assertEqual(list(self.shailkupa.unions.values_list("name", flat=True)), ["Abaipur"])

    def test_deleting_a_union_keeps_its_incidents_without_a_union(self):
        abaipur = Union.objects.create(name="Abaipur", thana=self.shailkupa)
        incident = Incident.objects.create(description="help", contact_number="01712345678", union=abaipur)

        abaipur.delete()

        incident.refresh_from_db()
        self.assertIsNone(incident.union)
