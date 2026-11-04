from django.urls import path
from .apis import IncidentCreateView

urlpatterns = [
    path("", IncidentCreateView.as_view(), name="incident-create"),
]
