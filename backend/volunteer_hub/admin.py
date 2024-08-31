from django.contrib import admin
from .models.volunteer import Volunteer
# Register your models here.


@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = (
        'full_name',
        'contact_number',
        'email',
        'location',
        'address',
        'is_active',
        'notes',
        'assistance_type',
        'created_at',
        'updated_at'
    )