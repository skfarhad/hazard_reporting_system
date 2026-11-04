"""The dashboard WebSocket: operators sign in with their JWT and get nudged when incidents or volunteers change."""
from unittest.mock import patch

from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework_simplejwt.tokens import AccessToken

from apps.incident_manager.consumers import DashboardConsumer
from apps.incident_manager.models import Incident
from apps.incident_manager.routing import websocket_application
from apps.volunteer_hub.models import Volunteer

IN_MEMORY = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
User = get_user_model()


@override_settings(CHANNEL_LAYERS=IN_MEMORY, ALLOWED_HOSTS=["testserver"])
class DashboardSocketTestCase(TestCase):
    def setUp(self):
        self.operator = User.objects.create(username="operator", is_staff=True)
        self.citizen = User.objects.create(username="citizen")
        self.application = websocket_application()
        # Channels closes "old" database connections around each database call; inside a TestCase that is
        # the test's own connection (and transaction), so keep it open.
        keep_connection = patch("channels.db.close_old_connections")
        keep_connection.start()
        self.addCleanup(keep_connection.stop)

    def token(self, user):
        return str(AccessToken.for_user(user))

    async def open_socket(self, token=None, origin=b"http://testserver"):
        socket = WebsocketCommunicator(self.application, "/ws/dashboard/", headers=[(b"origin", origin)])
        connected, _ = await socket.connect()
        self.assertTrue(connected)
        if token is not None:
            await socket.send_json_to({"type": "auth", "token": token})
        return socket

    async def signed_in_socket(self):
        socket = await self.open_socket(await sync_to_async(self.token)(self.operator))
        self.assertEqual(await socket.receive_json_from(), {"type": "ready"})
        return socket

    async def assert_closed_with(self, socket, code):
        self.assertEqual(await socket.receive_output(timeout=2), {"type": "websocket.close", "code": code})


class SocketSignInTests(DashboardSocketTestCase):
    async def test_an_operator_with_a_valid_token_joins_and_gets_ready(self):
        socket = await self.signed_in_socket()

        await socket.disconnect()

    async def test_a_non_operator_is_closed_with_4403(self):
        socket = await self.open_socket(await sync_to_async(self.token)(self.citizen))

        await self.assert_closed_with(socket, 4403)

    async def test_a_bad_token_or_a_first_message_that_is_not_auth_is_closed_with_4401(self):
        for first in [{"type": "auth", "token": "not-a-jwt"}, {"type": "hello"}, {"type": "auth"}]:
            with self.subTest(first=first):
                socket = await self.open_socket()
                await socket.send_json_to(first)
                await self.assert_closed_with(socket, 4401)

    async def test_no_auth_message_within_the_timeout_closes_the_socket(self):
        with patch.object(DashboardConsumer, "AUTH_TIMEOUT", 0.05):
            socket = await self.open_socket()

            await self.assert_closed_with(socket, 4401)

    async def test_a_socket_from_another_site_is_refused(self):
        socket = WebsocketCommunicator(self.application, "/ws/dashboard/", headers=[(b"origin", b"https://evil.example")])

        connected, _ = await socket.connect()

        self.assertFalse(connected)


def save_incident():
    return Incident.objects.create(contact_number="01712345678", description="help", address="x")


class NudgeTests(DashboardSocketTestCase):
    async def run_and_commit(self, change):
        """Runs a database change and its on-commit callbacks (TestCase never really commits)."""
        def run():
            with self.captureOnCommitCallbacks(execute=True):
                return change()
        return await sync_to_async(run)()

    async def test_saving_an_incident_nudges_connected_dashboards_after_commit(self):
        first, second = await self.signed_in_socket(), await self.signed_in_socket()

        incident = await self.run_and_commit(save_incident)

        for socket in (first, second):
            self.assertEqual(await socket.receive_json_from(), {"type": "incident.changed", "id": incident.id})

    async def test_nothing_is_sent_before_the_change_is_committed(self):
        socket = await self.signed_in_socket()

        def save_without_commit():
            with self.captureOnCommitCallbacks(execute=False) as callbacks:
                save_incident()
            return callbacks

        callbacks = await sync_to_async(save_without_commit)()

        self.assertEqual(len(callbacks), 1)
        self.assertTrue(await socket.receive_nothing())

    async def test_assigning_a_volunteer_and_saving_a_volunteer_send_nudges(self):
        incident = await self.run_and_commit(save_incident)
        socket = await self.signed_in_socket()

        volunteer = await self.run_and_commit(
            lambda: Volunteer.objects.create(full_name="Karim", contact_number="018", address="x", notes=""))
        self.assertEqual(await socket.receive_json_from(), {"type": "volunteer.changed", "id": volunteer.id})

        await self.run_and_commit(lambda: incident.volunteers.add(volunteer))
        self.assertEqual(await socket.receive_json_from(), {"type": "incident.changed", "id": incident.id})

        await self.run_and_commit(lambda: incident.volunteers.remove(volunteer))
        self.assertEqual(await socket.receive_json_from(), {"type": "incident.changed", "id": incident.id})

    async def test_assigning_from_the_volunteers_side_nudges_about_each_incident(self):
        first, second = await self.run_and_commit(save_incident), await self.run_and_commit(save_incident)
        volunteer = await self.run_and_commit(
            lambda: Volunteer.objects.create(full_name="Karim", contact_number="018", address="x", notes=""))
        socket = await self.signed_in_socket()

        await self.run_and_commit(lambda: volunteer.assigned_incidents.add(first, second))

        received = {(await socket.receive_json_from())["id"] for _ in range(2)}
        self.assertEqual(received, {first.id, second.id})

    async def test_deleting_an_incident_nudges_with_its_old_id(self):
        incident = await self.run_and_commit(save_incident)
        old_id = incident.id
        socket = await self.signed_in_socket()

        await self.run_and_commit(incident.delete)

        self.assertEqual(await socket.receive_json_from(), {"type": "incident.changed", "id": old_id})

    async def test_non_operators_never_receive_nudges(self):
        socket = await self.open_socket(await sync_to_async(self.token)(self.citizen))
        await self.assert_closed_with(socket, 4403)

        await self.run_and_commit(save_incident)

        self.assertTrue(await socket.receive_nothing())


class BroadcastFailureTests(TestCase):
    def test_a_channel_layer_error_does_not_break_saving_an_incident(self):
        class BrokenLayer:
            async def group_send(self, *args, **kwargs):
                raise ConnectionError("redis is down")

        with patch("apps.incident_manager.services.broadcast.get_channel_layer", return_value=BrokenLayer()), \
                self.assertLogs("apps.incident_manager.services.broadcast", level="WARNING") as logs, \
                self.captureOnCommitCallbacks(execute=True):
            incident = save_incident()

        self.assertTrue(Incident.objects.filter(pk=incident.pk).exists())
        self.assertIn("redis is down", logs.output[0])
