"""Tell open dashboards that something changed. They re-fetch through the API, so nudges carry no data."""
import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction

logger = logging.getLogger(__name__)

DASHBOARD_GROUP = "dashboard"


def notify(kind, object_id):
    """Nudges every connected dashboard once the current transaction commits ("incident" or "volunteer")."""
    transaction.on_commit(lambda: _send(kind, object_id))


def _send(kind, object_id):
    try:
        layer = get_channel_layer()
        if layer is not None:
            async_to_sync(layer.group_send)(
                DASHBOARD_GROUP, {"type": "dashboard.nudge", "kind": kind, "id": object_id},
            )
    except Exception as error:  # Live updates are best effort: never break the save that triggered them.
        logger.warning("Could not nudge dashboards about %s %s: %s", kind, object_id, error)
