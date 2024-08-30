from django.urls import path
from .api import IncidentCreateView, IncidentApiView

urlpatterns = [
    path("", IncidentCreateView.as_view(), name="incident-create"),
    path("view/", IncidentApiView.as_view(), name="incident-view"),
    path("view/<int:id>", IncidentApiView.as_view(), name="incident-single"),
]
