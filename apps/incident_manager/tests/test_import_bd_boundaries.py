import json
import os
import tempfile
from io import StringIO

from django.core.management import CommandError, call_command
from django.test import SimpleTestCase, TestCase

from apps.incident_manager.models import District, Division, Incident, Thana, Union
from apps.incident_manager.services.boundaries import BoundaryImportError, import_boundaries, official_name


def box(west, south, east, north):
    return {"type": "Polygon", "coordinates": [[[west, south], [east, south], [east, north], [west, north], [west, south]]]}


# A tiny Bangladesh in the shape of the OCHA/BBS files: names, codes and parent codes at every level.
DIVISIONS = [
    {"ADM1_EN": "Chittagong", "ADM1_PCODE": "BD20", "geometry": box(91.0, 22.5, 92.0, 23.5)},
    {"ADM1_EN": "Khulna", "ADM1_PCODE": "BD40", "geometry": box(88.5, 22.5, 89.5, 23.5)},
]
DISTRICTS = [
    {"ADM2_EN": "Feni", "ADM2_PCODE": "BD2030", "ADM1_PCODE": "BD20", "geometry": box(91.3, 22.8, 91.6, 23.2)},
    {"ADM2_EN": "Jhenaidah", "ADM2_PCODE": "BD4044", "ADM1_PCODE": "BD40", "geometry": box(89.0, 23.0, 89.3, 23.3)},
]
THANAS = [
    {"ADM3_EN": "Parshuram", "ADM3_PCODE": "BD203094", "ADM2_PCODE": "BD2030", "geometry": box(91.3, 23.0, 91.45, 23.2)},
    {"ADM3_EN": "Kaliganj", "ADM3_PCODE": "BD203050", "ADM2_PCODE": "BD2030", "geometry": box(91.45, 23.0, 91.6, 23.2)},
    {"ADM3_EN": "Kaliganj", "ADM3_PCODE": "BD404433", "ADM2_PCODE": "BD4044", "geometry": box(89.0, 23.0, 89.15, 23.15)},
]
# A C-shaped union (like a town wrapped round a river bend): its centroid falls outside it.
C_SHAPE = {"type": "Polygon", "coordinates": [[
    [91.36, 23.06], [91.44, 23.06], [91.44, 23.08], [91.38, 23.08], [91.38, 23.16],
    [91.44, 23.16], [91.44, 23.18], [91.36, 23.18], [91.36, 23.06],
]]}
UNIONS = [
    {"ADM4_EN": "Abaipur", "ADM4_PCODE": "BD20309401", "ADM3_PCODE": "BD203094", "geometry": box(91.3, 23.0, 91.35, 23.05)},
    {"ADM4_EN": "Mirzanagar", "ADM4_PCODE": "BD20309402", "ADM3_PCODE": "BD203094", "geometry": C_SHAPE},
    {"ADM4_EN": "Abaipur", "ADM4_PCODE": "BD40443301", "ADM3_PCODE": "BD404433", "geometry": box(89.0, 23.0, 89.05, 23.05)},
]
LEVELS = {1: DIVISIONS, 2: DISTRICTS, 3: THANAS, 4: UNIONS}


def write_level(folder, level, rows):
    features = [
        {"type": "Feature", "properties": {k: v for k, v in row.items() if k != "geometry"}, "geometry": row["geometry"]}
        for row in rows
    ]
    with open(os.path.join(folder, f"bangladesh_geojson_adm{level}_test.json"), "w") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f)


class ImportTestCase(TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.folder = self.tmp.name
        for level, rows in LEVELS.items():
            write_level(self.folder, level, rows)


class BuildHierarchyTests(ImportTestCase):
    def test_the_import_builds_divisions_districts_thanas_and_unions_from_area_codes(self):
        import_boundaries(self.folder)

        self.assertEqual(
            [Division.objects.count(), District.objects.count(), Thana.objects.count(), Union.objects.count()],
            [2, 2, 3, 3],
        )
        parshuram = Thana.objects.get(code="BD203094")
        self.assertEqual((parshuram.name, parshuram.district.name, parshuram.district.division.name),
                         ("Parshuram", "Feni", "Chattogram"))
        self.assertEqual(
            sorted(Thana.objects.filter(name="Kaliganj").values_list("district__name", flat=True)), ["Feni", "Jhenaidah"],
        )
        self.assertEqual(Union.objects.get(code="BD40443301").thana.district.name, "Jhenaidah")

    def test_single_polygons_are_stored_as_multipolygons(self):
        import_boundaries(self.folder)

        for model in (Division, District, Thana, Union):
            with self.subTest(model=model.__name__):
                self.assertEqual({row.polygon.geom_type for row in model.objects.all()}, {"MultiPolygon"})

    def test_every_imported_area_gets_a_centre_inside_it(self):
        import_boundaries(self.folder)

        for model in (Division, District, Thana, Union):
            for row in model.objects.all():
                with self.subTest(place=row.name, code=row.code):
                    self.assertTrue(row.polygon.contains(row.center))


class RepeatAndAdoptTests(ImportTestCase):
    def test_running_the_import_twice_creates_no_duplicates_and_updates_shapes(self):
        import_boundaries(self.folder)
        ids = set(Thana.objects.values_list("id", flat=True))
        moved = [dict(THANAS[0], geometry=box(91.31, 23.01, 91.44, 23.19))] + THANAS[1:]
        write_level(self.folder, 3, moved)

        summary = import_boundaries(self.folder)

        self.assertEqual(set(Thana.objects.values_list("id", flat=True)), ids)
        self.assertEqual(Union.objects.count(), 3)
        self.assertEqual(summary["thanas"], {"created": 0, "updated": 3})
        self.assertAlmostEqual(Thana.objects.get(code="BD203094").polygon.extent[0], 91.31)

    def test_the_import_adopts_places_added_by_hand_and_keeps_their_ids_and_incidents(self):
        chattogram = Division.objects.create(name="Chattogram")
        feni = District.objects.create(name="feni", division=chattogram)
        parshuram = Thana.objects.create(name="Parshuram", district=feni)
        incident = Incident.objects.create(description="help", contact_number="01712345678",
                                           district=feni, thana=parshuram)

        import_boundaries(self.folder)

        self.assertEqual(Division.objects.get(code="BD20").id, chattogram.id)
        self.assertEqual(District.objects.get(code="BD2030").id, feni.id)
        self.assertEqual(Thana.objects.get(code="BD203094").id, parshuram.id)
        self.assertEqual(District.objects.get(id=feni.id).name, "Feni")
        self.assertEqual([Division.objects.count(), District.objects.count(), Thana.objects.count()], [2, 2, 3])
        incident.refresh_from_db()
        self.assertEqual((incident.district_id, incident.thana_id), (feni.id, parshuram.id))


class SafetyTests(ImportTestCase):
    def test_a_folder_missing_a_level_file_is_rejected_with_its_name(self):
        os.remove(os.path.join(self.folder, "bangladesh_geojson_adm3_test.json"))

        with self.assertRaisesMessage(BoundaryImportError, "No adm3 (upazilas/thanas) file in"):
            import_boundaries(self.folder)
        self.assertEqual(Division.objects.count(), 0)

    def test_an_unknown_parent_code_stops_the_import_without_saving_anything(self):
        write_level(self.folder, 4, UNIONS + [
            {"ADM4_EN": "Nowhere", "ADM4_PCODE": "BD99999901", "ADM3_PCODE": "BD999999", "geometry": box(89.1, 23.1, 89.12, 23.12)},
        ])

        with self.assertRaisesMessage(BoundaryImportError, "Nowhere (BD99999901) points at unknown parent code BD999999"):
            import_boundaries(self.folder)
        self.assertEqual([Division.objects.count(), District.objects.count(), Thana.objects.count()], [0, 0, 0])

    def test_the_import_simplifies_shapes_but_keeps_small_islands(self):
        # Chattogram's coast as a jagged line of 400 points, plus a 300 m island offshore.
        jagged = [[91.0 + i * 0.0025, 22.5 + (0.00002 if i % 2 else 0)] for i in range(401)]
        mainland = jagged + [[92.0, 23.5], [91.0, 23.5], [91.0, 22.5]]
        island = [[91.5, 22.0], [91.503, 22.0], [91.503, 22.003], [91.5, 22.003], [91.5, 22.0]]
        write_level(self.folder, 1, [
            dict(DIVISIONS[0], geometry={"type": "MultiPolygon", "coordinates": [[mainland], [island]]}), DIVISIONS[1],
        ])

        import_boundaries(self.folder)

        chattogram = Division.objects.get(code="BD20")
        self.assertEqual(len(chattogram.polygon), 2)
        self.assertLess(chattogram.polygon.num_points, 50)


class CommandTests(ImportTestCase):
    def test_the_command_reports_created_and_updated_counts_per_level(self):
        out = StringIO()

        call_command("import_bd_boundaries", self.folder, stdout=out)
        call_command("import_bd_boundaries", self.folder, stdout=out)

        lines = out.getvalue().splitlines()
        self.assertEqual(lines[:4], [
            "divisions: 2 created, 0 updated",
            "districts: 2 created, 0 updated",
            "thanas: 3 created, 0 updated",
            "unions: 3 created, 0 updated",
        ])
        self.assertEqual(lines[-1], "unions: 0 created, 3 updated")

    def test_the_command_turns_import_problems_into_command_errors(self):
        with self.assertRaisesMessage(CommandError, "No adm1 (divisions) file in"):
            call_command("import_bd_boundaries", tempfile.gettempdir() + "/no-such-folder-here", stdout=StringIO())


class OfficialNameTests(SimpleTestCase):
    def test_old_spellings_become_the_official_ones_as_whole_words(self):
        self.assertEqual(official_name("Chittagong"), "Chattogram")
        self.assertEqual(official_name("Comilla Sadar Dakshin"), "Cumilla Sadar Dakshin")
        self.assertEqual(official_name("Jessore"), "Jashore")
        self.assertEqual(official_name("Barisal Sadar (Kotwali)"), "Barishal Sadar (Kotwali)")
        self.assertEqual(official_name("Bogra"), "Bogura")

    def test_other_names_and_words_that_merely_contain_an_old_spelling_are_left_alone(self):
        self.assertEqual(official_name("Feni"), "Feni")
        self.assertEqual(official_name("Bograpur"), "Bograpur")
        self.assertEqual(official_name("  Parshuram "), "Parshuram")
