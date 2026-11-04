"""Time windows for the dashboard's period dropdown."""
from datetime import timedelta, timezone as dt_timezone

from django.conf import settings

PERIODS = ("today", "24h", "7d", "event")


def local_timezone():
    # Bangladesh has no daylight saving time, so a fixed offset is exact.
    return dt_timezone(timedelta(hours=settings.DASHBOARD_UTC_OFFSET_HOURS))


def period_start(period, now):
    """When a time-based period began, as an aware datetime. "event" has no start time."""
    if period == "today":
        local = now.astimezone(local_timezone())
        return local.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(dt_timezone.utc)
    if period == "24h":
        return now - timedelta(hours=24)
    if period == "7d":
        return now - timedelta(days=7)
    raise ValueError(f"No start time for period {period!r}")
