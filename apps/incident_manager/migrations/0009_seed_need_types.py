"""Seed the proposed need types and give existing incidents the fallback need.

The list is a proposal (see agent-os/specs/2026-11-04-hazard-agnostic-incident-types). It is
admin-editable afterwards: re-running this seed only creates missing rows and never overwrites
labels, keywords or colours that operators changed.
"""
from django.db import migrations

NEED_TYPES = [
    # code, label_en, label_bn, sms_keywords, icon, colour, sort_order, is_fallback
    ("rescue", "Rescue", "উদ্ধার", ["rescue", "uddhar", "uddhaar", "udhar", "উদ্ধার"], "life-preserver", "#DC2626", 10, False),
    ("medical", "Medical", "চিকিৎসা", ["medical", "medicine", "oshudh", "osudh", "oshud", "ওষুধ", "চিকিৎসা"], "heart-pulse", "#DB2777", 20, False),
    ("food", "Food", "খাবার", ["food", "khabar", "khaddo", "খাবার"], "basket", "#D97706", 30, False),
    ("water", "Water & sanitation", "পানি ও স্যানিটেশন", ["water", "pani", "পানি"], "droplet", "#0284C7", 40, False),
    ("shelter", "Shelter", "আশ্রয়", ["shelter", "ashroy", "asroy", "আশ্রয়"], "house", "#7C3AED", 50, False),
    ("missing", "Missing person", "নিখোঁজ", ["missing", "nikhoj", "nikhoz", "নিখোঁজ"], "person-exclamation", "#0F766E", 60, False),
    ("safety", "Safety", "নিরাপত্তা", ["safety", "nirapotta", "নিরাপত্তা"], "shield-exclamation", "#B45309", 70, False),
    ("damage", "Damage report", "ক্ষতির খবর", ["damage", "khoti", "ক্ষতি"], "cone-striped", "#475569", 80, False),
    ("other", "Other", "অন্যান্য", [], "question-circle", "#64748B", 999, True),
]


def seed_need_types(apps, schema_editor):
    NeedType = apps.get_model("incident_manager", "NeedType")
    for code, label_en, label_bn, keywords, icon, colour, sort_order, is_fallback in NEED_TYPES:
        NeedType.objects.get_or_create(
            code=code,
            defaults={
                "label_en": label_en, "label_bn": label_bn, "sms_keywords": keywords, "icon": icon,
                "colour": colour, "sort_order": sort_order, "is_fallback": is_fallback,
            },
        )


def backfill_other_need(apps, schema_editor):
    NeedType = apps.get_model("incident_manager", "NeedType")
    Incident = apps.get_model("incident_manager", "Incident")
    other = NeedType.objects.get(code="other")
    Through = Incident.needs.through
    Through.objects.bulk_create(
        [Through(incident_id=pk, needtype_id=other.pk) for pk in Incident.objects.filter(needs=None).values_list("pk", flat=True)],
        ignore_conflicts=True,
    )


def remove_seeded_need_types(apps, schema_editor):
    NeedType = apps.get_model("incident_manager", "NeedType")
    NeedType.objects.filter(code__in=[row[0] for row in NEED_TYPES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("incident_manager", "0008_needtype_incident_triage"),
    ]

    operations = [
        migrations.RunPython(seed_need_types, remove_seeded_need_types),
        migrations.RunPython(backfill_other_need, migrations.RunPython.noop),
    ]
