"""The dashboard's WebSocket (/ws/dashboard/).

The page sends {"type": "auth", "token": "<JWT access token>"} first (in a message, so the token never
appears in server logs). Active operators join the dashboard group and get {"type": "ready"}, then a nudge
such as {"type": "incident.changed", "id": 12} whenever something changes. Anyone else is closed with
4401 (not signed in) or 4403 (not an operator).
"""
import asyncio
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .services.broadcast import DASHBOARD_GROUP

NOT_SIGNED_IN = 4401
NOT_AN_OPERATOR = 4403


@database_sync_to_async
def user_for_token(token):
    auth = JWTAuthentication()
    try:
        return auth.get_user(auth.get_validated_token(token))
    except (InvalidToken, TokenError, AuthenticationFailed):
        return None


class DashboardConsumer(AsyncJsonWebsocketConsumer):
    AUTH_TIMEOUT = 5  # seconds to send the auth message

    async def connect(self):
        self.joined = False
        await self.accept()
        self.auth_timer = asyncio.ensure_future(self.close_if_silent())

    async def close_if_silent(self):
        await asyncio.sleep(self.AUTH_TIMEOUT)
        if not self.joined:
            await self.close(code=NOT_SIGNED_IN)

    @classmethod
    async def decode_json(cls, text_data):
        try:
            return json.loads(text_data)
        except ValueError:
            return {}

    async def receive_json(self, content, **kwargs):
        if self.joined:
            return  # signed in: the page has nothing else to say
        self.auth_timer.cancel()
        token = content.get("token") if isinstance(content, dict) and content.get("type") == "auth" else None
        user = await user_for_token(token) if isinstance(token, str) else None
        if user is None:
            await self.close(code=NOT_SIGNED_IN)
        elif not (user.is_active and user.is_staff):
            await self.close(code=NOT_AN_OPERATOR)
        else:
            await self.channel_layer.group_add(DASHBOARD_GROUP, self.channel_name)
            self.joined = True
            await self.send_json({"type": "ready"})

    async def disconnect(self, code):
        self.auth_timer.cancel()
        if self.joined:
            await self.channel_layer.group_discard(DASHBOARD_GROUP, self.channel_name)

    async def dashboard_nudge(self, event):
        await self.send_json({"type": f"{event['kind']}.changed", "id": event["id"]})
