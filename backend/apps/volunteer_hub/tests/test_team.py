from django.test import TestCase
from apps.volunteer_hub.models import Volunteer, VolunteerTeam


class VolunteerTeamModelTest(TestCase):
    def setUp(self):
        # Create volunteers
        self.leader = Volunteer.objects.create(
            full_name="Team Leader", contact_number="123456789"
        )
        self.member1 = Volunteer.objects.create(
            full_name="Member One", contact_number="987654321"
        )
        self.member2 = Volunteer.objects.create(
            full_name="Member Two", contact_number="555555555"
        )

        # Create team
        self.team = VolunteerTeam.objects.create(
            name="Rescue Team", team_leader=self.leader
        )
        self.team.members.set([self.member1, self.member2])

    def test_team_creation(self):
        # Test that the team is created correctly
        self.assertEqual(self.team.name, "Rescue Team")
        self.assertEqual(self.team.team_leader, self.leader)
        self.assertIn(self.member1, self.team.members.all())
        self.assertIn(self.member2, self.team.members.all())

    def test_get_sms_recipient(self):
        # Test that the correct SMS recipient is returned
        recipient = self.team.get_sms_recipient()
        self.assertEqual(recipient, "123456789")
