from django.db.models.signals import m2m_changed, post_delete, post_save, pre_save
from django.dispatch import receiver

from apps.incident_manager.constants import IncidentStatus
from apps.volunteer_hub.models import Volunteer

from .models import Incident
from .services.broadcast import notify
from .tasks import process_incident_and_send_sms  # Import the background task


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


# Live dashboard: nudge open dashboards after the change commits.

@receiver(post_save, sender=Incident)
@receiver(post_delete, sender=Incident)
def incident_changed(sender, instance, **kwargs):
    notify("incident", instance.pk)


@receiver(post_save, sender=Volunteer)
def volunteer_changed(sender, instance, **kwargs):
    notify("volunteer", instance.pk)


@receiver(m2m_changed, sender=Incident.volunteers.through)
def assignment_changed(sender, instance, action, reverse, pk_set, **kwargs):
    if action not in ("post_add", "post_remove", "post_clear"):
        return
    if not reverse:
        notify("incident", instance.pk)
        return
    # Changed from the volunteer's side (volunteer.assigned_incidents.add(...)).
    for incident_id in pk_set or ():
        notify("incident", incident_id)
