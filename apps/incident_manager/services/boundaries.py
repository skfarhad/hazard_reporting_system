"""Bangladesh's administrative areas and their boundaries, imported from the OCHA/BBS GeoJSON files.

Source: OCHA Common Operational Dataset, administrative boundaries for Bangladesh (Bangladesh Bureau
of Statistics), licence CC BY-IGO.
"""
import os
import re

from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import MultiPolygon
from django.db import transaction

# Old English spellings in the data → the official ones (renamed in 2018).
OFFICIAL_NAMES = {
    "Chittagong": "Chattogram",
    "Comilla": "Cumilla",
    "Jessore": "Jashore",
    "Barisal": "Barishal",
    "Bogra": "Bogura",
}
_OLD_SPELLING = re.compile(r"\b(" + "|".join(OFFICIAL_NAMES) + r")\b")


def official_name(name):
    """The official spelling of a place name: old spellings are replaced as whole words."""
    return _OLD_SPELLING.sub(lambda match: OFFICIAL_NAMES[match.group(1)], name.strip())


SIMPLIFY_TOLERANCE = 0.0001  # degrees, about 11 m: far fewer points, small islands kept
BATCH_SIZE = 500
_LEVEL_FILE = re.compile(r"adm(\d)[_.]", re.IGNORECASE)


class BoundaryImportError(Exception):
    pass


def _levels():
    from apps.incident_manager.models import District, Division, Thana, Union

    # (ADM level, model, field pointing at the parent level)
    return [(1, Division, None), (2, District, "division"), (3, Thana, "district"), (4, Union, "thana")]


LEVEL_NAMES = {1: "divisions", 2: "districts", 3: "upazilas/thanas", 4: "unions"}


def level_files(folder):
    """The adm1–adm4 GeoJSON files directly in `folder` (sub-folders such as `small/` are ignored)."""
    files = {}
    if not os.path.isdir(folder):
        return files
    for entry in sorted(os.listdir(folder)):
        match = _LEVEL_FILE.search(entry)
        path = os.path.join(folder, entry)
        if match and entry.lower().endswith((".json", ".geojson")) and os.path.isfile(path):
            files.setdefault(int(match.group(1)), path)
    return files


def as_multipolygon(shape):
    """Any polygonal shape as a valid MultiPolygon (SRID 4326)."""
    if not shape.valid:
        shape = shape.make_valid()
    if shape.geom_type == "Polygon":
        shape = MultiPolygon(shape)
    elif shape.geom_type != "MultiPolygon":  # a collection after repairs: keep its polygons
        polygons = [part for part in shape if part.geom_type == "Polygon"]
        polygons += [p for part in shape if part.geom_type == "MultiPolygon" for p in part]
        shape = MultiPolygon(polygons)
    shape.srid = 4326
    return shape


def read_level(path, level, tolerance=SIMPLIFY_TOLERANCE):
    """Areas in one file, one at a time: code, official name, parent code, simplified shape and centre."""
    layer = DataSource(path)[0]
    for feature in layer:
        shape = feature.geom.geos
        shape.srid = 4326
        shape = as_multipolygon(shape.simplify(tolerance, preserve_topology=True))
        yield {
            "code": feature.get(f"ADM{level}_PCODE"),
            "name": official_name(feature.get(f"ADM{level}_EN")),
            "parent_code": feature.get(f"ADM{level - 1}_PCODE") if level > 1 else None,
            "polygon": shape,
            "center": shape.point_on_surface,
        }


def _name_key(parent_id, name):
    return parent_id, name.casefold()


def _upsert_level(model, parent_field, areas, parents):
    """Update areas known by code; adopt hand-added ones (no code) by name under the same parent; create the rest."""
    parent_id = f"{parent_field}_id" if parent_field else None
    rows = list(model.objects.defer("polygon", "center"))
    by_code = {row.code: row for row in rows if row.code}
    by_name = {_name_key(getattr(row, parent_id) if parent_id else None, row.name): row for row in rows if not row.code}
    created, updated = [], []
    for area in areas:
        fields = {"code": area["code"], "name": area["name"], "polygon": area["polygon"], "center": area["center"]}
        parent = parents.get(area["parent_code"]) if parent_field else None
        if parent_field and parent is None:
            raise BoundaryImportError(
                f"{area['name']} ({area['code']}) points at unknown parent code {area['parent_code']}."
            )
        if parent_field:
            fields[parent_field] = parent
        row = by_code.get(area["code"]) or by_name.pop(_name_key(parent.id if parent else None, area["name"]), None)
        if row is None:
            created.append(model(**fields))
            continue
        for name, value in fields.items():
            setattr(row, name, value)
        updated.append(row)
    model.objects.bulk_create(created, batch_size=BATCH_SIZE)
    model.objects.bulk_update(updated, ["code", "name", "polygon", "center"] + ([parent_field] if parent_field else []),
                              batch_size=BATCH_SIZE)
    return {"created": len(created), "updated": len(updated)}


def import_boundaries(folder, tolerance=SIMPLIFY_TOLERANCE):
    """Create or update every level from the files in `folder`, parents first, matching on area code."""
    files = level_files(folder)
    for level, _model, _parent in _levels():
        if level not in files:
            raise BoundaryImportError(f"No adm{level} ({LEVEL_NAMES[level]}) file in {folder}.")
    summary = {}
    with transaction.atomic():
        parents = {}
        for level, model, parent_field in _levels():
            areas = read_level(files[level], level, tolerance)
            summary[model._meta.verbose_name_plural] = _upsert_level(model, parent_field, areas, parents)
            parents = {row.code: row for row in model.objects.filter(code__isnull=False).defer("polygon", "center")}
    return summary
