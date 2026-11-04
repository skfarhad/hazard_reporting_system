from django.contrib import admin

from .models import Event, HazardType


@admin.register(HazardType)
class HazardTypeAdmin(admin.ModelAdmin):
    list_display = ("label_en", "label_bn", "code", "group", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    list_filter = ("group", "is_active")
    search_fields = ("code", "label_en", "label_bn")


class ActiveFilter(admin.SimpleListFilter):
    title = "status"
    parameter_name = "active"

    def lookups(self, request, model_admin):
        return [("yes", "Active"), ("no", "Ended or not started")]

    def queryset(self, request, queryset):
        if self.value() == "yes":
            return queryset.active()
        if self.value() == "no":
            return queryset.exclude(pk__in=queryset.active())
        return queryset


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("name", "hazard", "started_at", "ended_at")
    list_filter = (ActiveFilter, "hazard")
    search_fields = ("name",)
    filter_horizontal = ("districts",)
