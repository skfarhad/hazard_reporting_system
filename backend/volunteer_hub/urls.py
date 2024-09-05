from django.urls import path, include
from .views import VolunteerListView, VolunteerTeamListView


urlpatterns = [
    path("volunteers/", VolunteerListView.as_view(), name="volunteer-list"),
    path("volunteer-teams/", VolunteerTeamListView.as_view(),
         name="volunteer-team-list"),
]
