from django.core.management.base import BaseCommand, CommandError

from apps.incident_manager.services.boundaries import BoundaryImportError, import_boundaries


class Command(BaseCommand):
    help = (
        "Create or update Bangladesh's divisions, districts, upazilas/thanas and unions with their boundaries "
        "from the OCHA/BBS GeoJSON files (adm1..adm4) in a folder. Safe to run again."
    )

    def add_arguments(self, parser):
        parser.add_argument("folder", help="Folder holding the adm1, adm2, adm3 and adm4 GeoJSON files")

    def handle(self, *args, folder, **options):
        try:
            summary = import_boundaries(folder)
        except BoundaryImportError as error:
            raise CommandError(str(error))
        for level, counts in summary.items():
            self.stdout.write(f"{level}: {counts['created']} created, {counts['updated']} updated")
