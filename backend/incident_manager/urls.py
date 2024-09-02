from django.urls import path
from .api import IncidentCreateView , SearchFilterIncidentAPIView #, IncidentListSearch 

urlpatterns = [
    path("", IncidentCreateView.as_view(), name="incident-create"),
    path("search/", SearchFilterIncidentAPIView.as_view(), name="incident-search"),

]
