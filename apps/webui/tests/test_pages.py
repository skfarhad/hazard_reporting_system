from django.test import TestCase


class WebUIPageTests(TestCase):
    """The pages are static shells; the JS modules fetch data and check the login."""

    PAGES = {
        "/app/": "webui/js/dashboard.js",
        "/app/incidents/": "webui/js/incidents.js",
        "/app/volunteers/": "webui/js/volunteers.js",
        "/app/login/": "webui/js/login.js",
    }

    def test_each_page_renders_and_loads_its_module(self):
        for path, module in self.PAGES.items():
            with self.subTest(path=path):
                response = self.client.get(path)

                self.assertEqual(response.status_code, 200)
                self.assertContains(response, module)

    def test_every_page_loads_the_design_system_and_theme_toggle(self):
        for path in [*self.PAGES, "/app/design/"]:
            with self.subTest(path=path):
                response = self.client.get(path)

                self.assertEqual(response.status_code, 200)
                self.assertContains(response, "webui/css/hrs.css")
                self.assertContains(response, "webui/js/theme.js")

    def test_root_redirects_to_the_dashboard(self):
        response = self.client.get("/")

        self.assertRedirects(response, "/app/", fetch_redirect_response=False)
