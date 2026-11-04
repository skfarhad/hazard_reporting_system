from django.urls import path
from .apis import IncidentCreateView, IncidentDetailView, IncidentListView, IncidentReportView, NeedTypeListView

urlpatterns = [
    path("", IncidentCreateView.as_view(), name="incident-create"),
    path("report/", IncidentReportView.as_view(), name="incident-report"),
    path("list/", IncidentListView.as_view(), name="incident-list"),
    path("<int:pk>/", IncidentDetailView.as_view(), name="incident-detail"),
    path("need-types/", NeedTypeListView.as_view(), name="need-type-list"),
]
