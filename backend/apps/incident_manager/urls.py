from django.urls import path
from .api import IncidentCreateView

urlpatterns = [
    path("", IncidentCreateView.as_view(), name="incident-create"),
]
