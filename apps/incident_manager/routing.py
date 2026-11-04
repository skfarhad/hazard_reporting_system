from channels.routing import URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path

from .consumers import DashboardConsumer

websocket_urlpatterns = [
    path("ws/dashboard/", DashboardConsumer.as_asgi()),
]


def websocket_application():
    """Only pages served from our own hosts (ALLOWED_HOSTS, read when this is built) may open the socket."""
    return AllowedHostsOriginValidator(URLRouter(websocket_urlpatterns))
