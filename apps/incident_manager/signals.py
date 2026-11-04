from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Incident
from .tasks import process_incident_and_send_sms  # Import the background task
from apps.incident_manager.constants import IncidentStatus


@receiver(pre_save, sender=Incident)
def incident_pre_save(sender, instance, **kwargs):
    if instance.pk:  # Ensure this is not a new instance
        # Fetch the previous instance from the database
        previous_instance = Incident.objects.get(pk=instance.pk)

        # Check if the validation_status is changing to 'validated'
        if (
            previous_instance.validation_status != instance.validation_status
            and instance.validation_status == IncidentStatus.VALIDATED.value
        ):
            # Trigger the background task
            process_incident_and_send_sms.delay(instance.id)
