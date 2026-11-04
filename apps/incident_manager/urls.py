from django.urls import path
from .apis import IncidentCreateView, IncidentListView, IncidentDetailView

urlpatterns = [
    path("", IncidentCreateView.as_view(), name="incident-create"),
    path("list/", IncidentListView.as_view(), name="incident-list"),
    path("<int:pk>/", IncidentDetailView.as_view(), name="incident-detail"),
]
