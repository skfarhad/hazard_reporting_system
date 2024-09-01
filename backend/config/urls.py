from django.contrib import admin
from django.urls import path, include
from config import settings
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf.urls.static import static

# Change the Django admin header and title
admin.site.site_header = "Hazard Reporting System Admin"
admin.site.site_title = "Hazard Reporting System Portal"
admin.site.index_title = "Welcome to the Hazard Reporting System Admin"

# Define the schema view for Swagger
schema_view = get_schema_view(
    openapi.Info(
        title="Volunteer and Incident Management API",
        default_version="v1",
        description="API documentation for the Volunteer and Incident management system",
        terms_of_service="https://www.yourcompany.com/terms/",
        contact=openapi.Contact(email="contact@yourcompany.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/incidents/", include("incident_manager.urls")),
    path("api/volunteers/", include("volunteer_hub.urls")),
    # Swagger and Redoc URLs
    path(
        "swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    path("swagger.json", schema_view.without_ui(cache_timeout=0), name="schema-json"),
    path("swagger.yaml", schema_view.without_ui(cache_timeout=0), name="schema-yaml"),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
