from django.urls import path
from .apis import IncidentCreateView, IncidentListView

urlpatterns = [
    path("", IncidentCreateView.as_view(), name="incident-create"),
    path("list/", IncidentListView.as_view(), name="incident-list"),
]
