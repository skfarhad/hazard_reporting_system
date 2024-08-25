from django.contrib import admin
from .models import Provider, Incident

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
        "updated_at",
    )
    search_fields = ("contact_number", "description", "status", "address")
    list_filter = ("status", "provider")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")
