from django.contrib import admin
from .models import Provider, Incident
from django.contrib import admin
from .models import Division, District, Thana
from leaflet.admin import LeafletGeoAdmin


@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "api_key", "website_link", "logo_url")
    search_fields = ("name", "description", "api_key")
    list_filter = ("name",)
    ordering = ("name",)
    readonly_fields = ("api_key",)  # Make the API key read-only


@admin.register(Incident)
class IncidentAdmin(LeafletGeoAdmin):
    list_display = (
        "contact_number",
        "provider",
        "description",
        "status",
        "address",
        "created_at",
    )
    search_fields = ("contact_number", "description", "status", "address")
    list_filter = ("status", "provider")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")



# Registering Division model
@admin.register(Division)
class DivisionAdmin(admin.ModelAdmin):
    list_display = ("name", "description")  # Fields to display in list view
    search_fields = ("name", "description")  # Fields to search by
    list_filter = ("name",)  # Fields to filter by


# Registering District model
@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ("name", "division", "description")  # Fields to display in list view
    search_fields = ("name", "description", "division__name")  # Fields to search by
    list_filter = ("division",)  # Fields to filter by


# Registering Thana model
@admin.register(Thana)
class ThanaAdmin(admin.ModelAdmin):
    list_display = ("name", "district", "description")  # Fields to display in list view
    search_fields = ("name", "description", "district__name")  # Fields to search by
    list_filter = ("district",)  # Fields to filter by
