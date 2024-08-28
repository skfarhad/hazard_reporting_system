from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VolunteerViewSet, VolunteerListView

router = DefaultRouter()
router.register(r'volunteer-lists', VolunteerViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path("volunteers/", VolunteerListView.as_view(), name="volunteer-list"),
]
