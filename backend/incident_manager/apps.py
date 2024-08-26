from django.apps import AppConfig


class IncidentManagerConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "incident_manager"

    def ready(self):
        import incident_manager.signals
