from django.db import models

from apps.common.models import TypeBase


class NeedType(TypeBase):
    """What help an incident needs (rescue, medical, food, ...). Volunteers offer the same types."""

    is_fallback = models.BooleanField(
        default=False, help_text="Used when a report has no recognised keyword. Only one type can be the fallback.",
    )

    class Meta(TypeBase.Meta):
        constraints = [
            models.UniqueConstraint(
                fields=["is_fallback"], condition=models.Q(is_fallback=True), name="one_fallback_need_type",
            ),
        ]

    @classmethod
    def fallback_code(cls):
        """Code of the fallback need type, looked up by flag so admins can rename it."""
        return cls.objects.filter(is_fallback=True).values_list("code", flat=True).first()

    @classmethod
    def keyword_map(cls):
        """{keyword: code} for active need types."""
        return {
            keyword: code
            for code, keywords in cls.objects.filter(is_active=True).values_list("code", "sms_keywords")
            for keyword in keywords
        }
