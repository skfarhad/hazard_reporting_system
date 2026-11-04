from rest_framework.pagination import PageNumberPagination


class IncidentPagination(PageNumberPagination):
    """25 incidents per page; clients such as the dashboard map may ask for up to 500."""

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 500
