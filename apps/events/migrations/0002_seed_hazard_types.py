"""Seed the proposed hazard types (grouped like EM-DAT / the Common Alerting Protocol).

Admin-editable afterwards; re-running only creates missing rows.
"""
from django.db import migrations

HAZARD_TYPES = [
    # code, group, label_en, label_bn, icon, colour
    ("flood", "water_weather", "Flood", "বন্যা", "water", "#0284C7"),
    ("flash_flood", "water_weather", "Flash flood", "আকস্মিক বন্যা", "water", "#0369A1"),
    ("waterlogging", "water_weather", "Waterlogging", "জলাবদ্ধতা", "droplet-half", "#0EA5E9"),
    ("cyclone", "water_weather", "Cyclone / storm surge", "ঘূর্ণিঝড় / জলোচ্ছ্বাস", "tornado", "#4338CA"),
    ("storm", "water_weather", "Storm / tornado", "ঝড় / টর্নেডো", "cloud-lightning-rain", "#6366F1"),
    ("lightning", "water_weather", "Lightning", "বজ্রপাত", "lightning", "#CA8A04"),
    ("heatwave", "water_weather", "Heatwave", "তাপপ্রবাহ", "thermometer-sun", "#EA580C"),
    ("cold_wave", "water_weather", "Cold wave", "শৈত্যপ্রবাহ", "thermometer-snow", "#0891B2"),
    ("drought", "water_weather", "Drought", "খরা", "sun", "#B45309"),
    ("earthquake", "geological", "Earthquake", "ভূমিকম্প", "activity", "#7C2D12"),
    ("landslide", "geological", "Landslide", "ভূমিধস", "triangle", "#92400E"),
    ("river_erosion", "geological", "Riverbank erosion", "নদীভাঙন", "water", "#A16207"),
    ("tsunami", "geological", "Tsunami", "সুনামি", "tsunami", "#1E40AF"),
    ("fire", "fire_structural", "Fire", "অগ্নিকাণ্ড", "fire", "#DC2626"),
    ("building_collapse", "fire_structural", "Building collapse", "ভবন ধস", "building-x", "#57534E"),
    ("industrial_accident", "fire_structural", "Industrial / chemical accident", "শিল্প / রাসায়নিক দুর্ঘটনা", "radioactive", "#9333EA"),
    ("explosion", "fire_structural", "Explosion", "বিস্ফোরণ", "exclamation-octagon", "#B91C1C"),
    ("road_accident", "transport", "Road accident", "সড়ক দুর্ঘটনা", "car-front", "#475569"),
    ("boat_capsize", "transport", "Boat / launch capsize", "নৌকা / লঞ্চডুবি", "life-preserver", "#0F766E"),
    ("epidemic", "biological", "Epidemic", "মহামারি", "virus", "#16A34A"),
    ("other", "other", "Other", "অন্যান্য", "question-circle", "#64748B"),
]


def seed_hazard_types(apps, schema_editor):
    HazardType = apps.get_model("events", "HazardType")
    for order, (code, group, label_en, label_bn, icon, colour) in enumerate(HAZARD_TYPES, start=1):
        HazardType.objects.get_or_create(
            code=code,
            defaults={"group": group, "label_en": label_en, "label_bn": label_bn, "icon": icon,
                      "colour": colour, "sort_order": order * 10},
        )


def remove_seeded_hazard_types(apps, schema_editor):
    HazardType = apps.get_model("events", "HazardType")
    HazardType.objects.filter(code__in=[row[0] for row in HAZARD_TYPES], events__isnull=True).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_hazard_types, remove_seeded_hazard_types),
    ]
