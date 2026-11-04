from django.contrib import admin

from .models import Volunteer


@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = ("full_name", "contact_number", "district", "is_active")
    list_filter = ("is_active", "skills", "district")
    search_fields = ("full_name", "contact_number", "address")
    filter_horizontal = ("skills",)
