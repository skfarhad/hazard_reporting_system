"""Parse an SMS report: NEED#District#Thana#Area#Message.

The first segment holds one or more need keywords (joined by "+" or ","), matched without regard
to case or surrounding spaces against the active need types' keywords. A report is never
rejected: with no recognised keyword it gets the fallback need. The old four-part format
(District#Thana#Area#Message) still parses its location.
"""
from typing import Dict, List, NamedTuple

SEPARATOR = "#"
MAX_REPORT_LENGTH = 2000
FALLBACK_NEED = "other"


class ParsedReport(NamedTuple):
    need_codes: List[str]
    district: str
    thana: str
    area: str
    message: str


def _need_codes(segment: str, keyword_map: Dict[str, str]) -> List[str]:
    """Need codes for a keyword segment, or [] unless every token is a known keyword."""
    tokens = [t.strip().lower() for t in segment.replace(",", "+").split("+")]
    if not tokens or not all(t in keyword_map for t in tokens):
        return []
    codes = []
    for token in tokens:
        if keyword_map[token] not in codes:
            codes.append(keyword_map[token])
    return codes


def parse_report(text: str, keyword_map: Dict[str, str], fallback: str = FALLBACK_NEED) -> ParsedReport:
    text = (text or "")[:MAX_REPORT_LENGTH].strip()
    parts = [p.strip() for p in text.split(SEPARATOR, 4)]

    codes = _need_codes(parts[0], keyword_map) if text else []
    if codes:
        rest = parts[1:]
        if len(rest) == 4:
            district, thana, area, message = rest
            return ParsedReport(codes, district, thana, area, message)
        return ParsedReport(codes, "", "", "", SEPARATOR.join(rest))

    if len(parts) == 4:
        district, thana, area, message = parts
        return ParsedReport([fallback], district, thana, area, message)
    return ParsedReport([fallback], "", "", "", text)
