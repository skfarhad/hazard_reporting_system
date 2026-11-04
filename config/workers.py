"""Gunicorn worker for the ASGI app. Django doesn't use the ASGI lifespan protocol, so it's switched off."""
from uvicorn.workers import UvicornWorker


class AsgiWorker(UvicornWorker):
    CONFIG_KWARGS = {**UvicornWorker.CONFIG_KWARGS, "lifespan": "off"}
