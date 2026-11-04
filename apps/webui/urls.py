from django.urls import path

from .views import Page

urlpatterns = [
    path("", Page.as_view(page="dashboard"), name="webui-dashboard"),
    path("incidents/", Page.as_view(page="incidents"), name="webui-incidents"),
    path("volunteers/", Page.as_view(page="volunteers"), name="webui-volunteers"),
    path("login/", Page.as_view(page="login"), name="webui-login"),
]
