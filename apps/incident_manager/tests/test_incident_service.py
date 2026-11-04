from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.test import TestCase

from apps.incident_manager.models import District, Division, Thana, Union
from apps.incident_manager.services.incidents import create_incident


def area(west, south, east, north):
    return MultiPolygon(Polygon.from_bbox((west, south, east, north)), srid=4326)


def report(location=None, description="help", **places):
    return create_incident(description=description, address="here", contact_number="01712345678",
                           location=location, **places)


class CreateIncidentServiceTests(TestCase):
    def test_the_creation_service_ignores_a_status_from_its_caller(self):
        incident = create_incident(
            description="help", address="here", contact_number="01712345678",
            location=Point(90.4, 23.8, srid=4326), validation_status="validated",
        )

        incident.refresh_from_db()
        self.assertEqual(incident.validation_status, "pending")


class AreaFromLocationTests(TestCase):
    """A new report is placed in the district, thana and union whose boundaries contain it."""

    def setUp(self):
        chattogram = Division.objects.create(name="Chattogram")
        self.feni = District.objects.create(name="Feni", division=chattogram, polygon=area(91.3, 22.8, 91.6, 23.2))
        self.parshuram = Thana.objects.create(name="Parshuram", district=self.feni, polygon=area(91.3, 23.0, 91.45, 23.2))
        self.fulgazi = Thana.objects.create(name="Fulgazi", district=self.feni, polygon=area(91.45, 23.0, 91.6, 23.2))
        # Overlaps Parshuram's union (as slivers between simplified shapes can) but belongs to Fulgazi;
        # created first, so only the thana check can pick Parshuram's union for a Parshuram report.
        self.amjadhat = Union.objects.create(name="Amjadhat", thana=self.fulgazi, polygon=area(91.3, 23.0, 91.6, 23.1))
        self.mirzanagar = Union.objects.create(name="Mirzanagar", thana=self.parshuram, polygon=area(91.3, 23.0, 91.45, 23.1))

    def test_a_report_with_only_a_location_gets_its_district_thana_and_union(self):
        incident = report(Point(91.5, 23.05, srid=4326))

        self.assertEqual((incident.district, incident.thana, incident.union), (self.feni, self.fulgazi, self.amjadhat))

    def test_the_union_comes_from_the_reports_own_thana_when_it_is_known(self):
        incident = report(Point(91.35, 23.05, srid=4326), thana=self.parshuram, district=self.feni)

        self.assertEqual(incident.union, self.mirzanagar)

    def test_a_report_outside_every_boundary_gets_no_area(self):
        incident = report(Point(90.4, 23.8, srid=4326))

        self.assertEqual((incident.district, incident.thana, incident.union), (None, None, None))

    def test_a_report_without_a_location_gets_no_union(self):
        incident = report(None, district=self.feni, thana=self.parshuram)

        self.assertIsNone(incident.union)


class OldSpellingTests(TestCase):
    def test_an_sms_using_an_old_district_spelling_finds_the_district(self):
        chattogram = Division.objects.create(name="Chattogram")
        cumilla = District.objects.create(name="Cumilla", division=chattogram)
        sadar = Thana.objects.create(name="Cumilla Sadar Dakshin", district=cumilla)

        incident = report(description="rescue#Comilla#Comilla Sadar Dakshin#Bazar#water rising")

        self.assertEqual((incident.district, incident.thana), (cumilla, sadar))
