from django.contrib.gis.db import models


class Division(models.Model):
    name = models.CharField(max_length=100, unique=True)
    polygon = models.MultiPolygonField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name


class District(models.Model):
    name = models.CharField(max_length=100, unique=True)
    division = models.ForeignKey(
        Division, on_delete=models.CASCADE, related_name="districts"
    )
    polygon = models.MultiPolygonField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name


class Thana(models.Model):
    name = models.CharField(max_length=100, unique=True)
    district = models.ForeignKey(
        District, on_delete=models.CASCADE, related_name="thanas"
    )
    polygon = models.MultiPolygonField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name
