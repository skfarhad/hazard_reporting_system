from django.urls import path

from .views import VolunteerListView, VolunteerSummaryView

urlpatterns = [
    path("volunteers/", VolunteerListView.as_view(), name="volunteer-list"),
    path("summary/", VolunteerSummaryView.as_view(), name="volunteer-summary"),
]
