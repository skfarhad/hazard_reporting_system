"""Checks for places and phone numbers reported from Bangladesh."""
import re

# Bangladesh's bounding box, slightly padded (Teknaf to Tetulia, Satkhira to Sylhet).
BD_LATITUDE = (20.3, 26.8)
BD_LONGITUDE = (87.9, 92.8)

# 01 + operator digit 3-9 + 8 digits; +880 / 880 prefixes are accepted.
_BD_MOBILE = re.compile(r"^(?:\+?88)?(01[3-9]\d{8})$")


def inside_bangladesh(latitude, longitude):
    return BD_LATITUDE[0] <= latitude <= BD_LATITUDE[1] and BD_LONGITUDE[0] <= longitude <= BD_LONGITUDE[1]


def normalise_bd_mobile(text):
    """'+880 1712-345678' -> '01712345678'; None if it isn't a Bangladeshi mobile number."""
    match = _BD_MOBILE.match(re.sub(r"[\s\-()]", "", text or ""))
    return match.group(1) if match else None
