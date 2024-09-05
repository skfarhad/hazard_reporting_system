from django.contrib.gis.db import models
from .volunteer import Volunteer


class VolunteerTeam(models.Model):
    name = models.CharField(max_length=255, unique=True)  # Name of the team
    team_leader = models.ForeignKey(
        Volunteer, on_delete=models.SET_NULL, null=True, related_name="leading_teams"
    )
    members = models.ManyToManyField(Volunteer, related_name="teams")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def get_sms_recipient(self):
        """
        Return the contact number of the team leader for sending SMS instructions.
        """
        if self.team_leader:
            return self.team_leader.contact_number
        return None
