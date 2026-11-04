"""
ASGI entry point: Django for HTTP, Channels for the dashboard WebSocket (/ws/dashboard/).

Served by Gunicorn with Uvicorn workers (see config/gunicorn.conf.py).
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Set up Django before importing anything that uses models.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter  # noqa: E402

from apps.incident_manager.routing import websocket_application  # noqa: E402

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": websocket_application(),
})
