from django.urls import path
from .apis import (
    IncidentCreateView, IncidentDetailView, IncidentListView, IncidentReportView, IncidentSummaryView,
    IncidentVolunteersView, IncidentVolunteerView, NeedTypeListView, PlaceListView,
)

urlpatterns = [
    path("", IncidentCreateView.as_view(), name="incident-create"),
    path("report/", IncidentReportView.as_view(), name="incident-report"),
    path("list/", IncidentListView.as_view(), name="incident-list"),
    path("summary/", IncidentSummaryView.as_view(), name="incident-summary"),
    path("<int:pk>/", IncidentDetailView.as_view(), name="incident-detail"),
    path("<int:pk>/volunteers/", IncidentVolunteersView.as_view(), name="incident-volunteers"),
    path("<int:pk>/volunteers/<int:volunteer_id>/", IncidentVolunteerView.as_view(), name="incident-volunteer"),
    path("need-types/", NeedTypeListView.as_view(), name="need-type-list"),
    path("places/", PlaceListView.as_view(), name="place-list"),
]
