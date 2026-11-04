from django.urls import path

from . import places_manage
from .apis import (
    IncidentCreateView, IncidentDetailView, IncidentListView, IncidentReportView, IncidentSummaryView,
    IncidentVolunteersView, IncidentVolunteerView, NeedTypeListView, NotificationsSeenView, NotificationsView,
    PlaceListView,
)

urlpatterns = [
    path("", IncidentCreateView.as_view(), name="incident-create"),
    path("report/", IncidentReportView.as_view(), name="incident-report"),
    path("list/", IncidentListView.as_view(), name="incident-list"),
    path("summary/", IncidentSummaryView.as_view(), name="incident-summary"),
    path("<int:pk>/", IncidentDetailView.as_view(), name="incident-detail"),
    path("<int:pk>/volunteers/", IncidentVolunteersView.as_view(), name="incident-volunteers"),
    path("<int:pk>/volunteers/<int:volunteer_id>/", IncidentVolunteerView.as_view(), name="incident-volunteer"),
    path("notifications/", NotificationsView.as_view(), name="incident-notifications"),
    path("notifications/seen/", NotificationsSeenView.as_view(), name="incident-notifications-seen"),
    path("need-types/", NeedTypeListView.as_view(), name="need-type-list"),
    path("places/", PlaceListView.as_view(), name="place-list"),
    path("places/manage/divisions/", places_manage.DivisionListView.as_view(), name="manage-division-list"),
    path("places/manage/districts/", places_manage.DistrictListView.as_view(), name="manage-district-list"),
    path("places/manage/districts/<int:pk>/", places_manage.DistrictDetailView.as_view(),
         name="manage-district-detail"),
    path("places/manage/thanas/", places_manage.ThanaListView.as_view(), name="manage-thana-list"),
    path("places/manage/thanas/<int:pk>/", places_manage.ThanaDetailView.as_view(), name="manage-thana-detail"),
]
