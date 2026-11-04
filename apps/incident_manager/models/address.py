from django.contrib.gis.db import models
from django.db.models.functions import Lower


class Division(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=16, unique=True, null=True, blank=True)  # national area code (OCHA/BBS P-code)
    polygon = models.MultiPolygonField(null=True, blank=True)
    center = models.PointField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name


class District(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=16, unique=True, null=True, blank=True)  # national area code (OCHA/BBS P-code)
    division = models.ForeignKey(
        Division, on_delete=models.CASCADE, related_name="districts"
    )
    polygon = models.MultiPolygonField(null=True, blank=True)
    center = models.PointField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(Lower("name"), "division", name="unique_district_name_per_division"),
        ]

    def __str__(self):
        return self.name


class Thana(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=16, unique=True, null=True, blank=True)  # national area code (OCHA/BBS P-code)
    district = models.ForeignKey(
        District, on_delete=models.CASCADE, related_name="thanas"
    )
    polygon = models.MultiPolygonField(null=True, blank=True)
    center = models.PointField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(Lower("name"), "district", name="unique_thana_name_per_district"),
        ]

    def __str__(self):
        return self.name


class Union(models.Model):
    """A union (or city ward) inside a thana: the smallest area a report is placed in."""

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=16, unique=True, null=True, blank=True)  # national area code (OCHA/BBS P-code)
    thana = models.ForeignKey(Thana, on_delete=models.CASCADE, related_name="unions")
    polygon = models.MultiPolygonField(null=True, blank=True)
    center = models.PointField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(Lower("name"), "thana", name="unique_union_name_per_thana"),
        ]

    def __str__(self):
        return self.name
