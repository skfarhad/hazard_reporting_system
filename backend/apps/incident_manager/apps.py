from django.apps import AppConfig


class IncidentManagerConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.incident_manager"

    def ready(self):
        import apps.incident_manager.signals
