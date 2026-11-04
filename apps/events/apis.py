from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event
from .serializers import EventSerializer


class EventListView(APIView):
    """Events (emergencies) with their hazard, newest first. `?active=true` keeps only ongoing ones."""

    permission_classes = [IsAdminUser]

    @swagger_auto_schema(
        operation_description="List events with their hazard (operators only)",
        manual_parameters=[openapi.Parameter("active", openapi.IN_QUERY, type=openapi.TYPE_BOOLEAN,
                                             description="true: only events that have started and not ended")],
        responses={200: EventSerializer(many=True), 403: "Not an operator"},
    )
    def get(self, request, *args, **kwargs):
        events = Event.objects.select_related("hazard").prefetch_related("districts")
        if request.query_params.get("active") == "true":
            events = events.active()
        return Response(EventSerializer(events, many=True).data)
