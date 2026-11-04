from django.views.generic import TemplateView


class Page(TemplateView):
    """A static page shell. Its JS module checks the login and loads data from the API."""

    page = ""

    def get_template_names(self):
        return [f"webui/{self.page}.html"]

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["page"] = self.page
        return context
