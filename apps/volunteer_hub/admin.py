from django.contrib import admin
from django.utils.html import format_html

from .models import Volunteer


@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = ("photo_thumbnail", "full_name", "contact_number", "district", "is_active")
    list_display_links = ("full_name",)
    list_filter = ("is_active", "skills", "district")
    search_fields = ("full_name", "contact_number", "address")
    filter_horizontal = ("skills",)

    @admin.display(description="Photo")
    def photo_thumbnail(self, obj):
        if not obj.photo:
            return "—"
        return format_html('<img src="{}" alt="" width="32" height="32" style="border-radius:50%;object-fit:cover">',
                           obj.photo.url)
