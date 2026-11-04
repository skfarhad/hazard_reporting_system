from django.urls import path

from .apis import EventListView

urlpatterns = [
    path("", EventListView.as_view(), name="event-list"),
]
