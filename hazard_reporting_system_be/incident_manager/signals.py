from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Incident
from .tasks import process_incident_and_send_sms  # Import the background task


@receiver(post_save, sender=Incident)
def incident_post_save(sender, instance, created, **kwargs):
    if created:
        # Trigger the background task
        process_incident_and_send_sms.delay(instance.id)
