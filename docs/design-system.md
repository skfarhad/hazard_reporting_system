# HRS design system

The web dashboard's look lives in one stylesheet,
[`apps/webui/static/webui/css/hrs.css`](../apps/webui/static/webui/css/hrs.css), modelled on
PharmaTally's `tally.css`. The live reference page is **`/app/design/`**; check new components there
in both themes.

## How it works

- **Tokens** are CSS custom properties prefixed `--hrs-`, defined for light and dark. The theme is the
  `data-bs-theme` attribute on `<html>`. It's set before paint from the saved choice, or else the
  system setting, and the navbar button toggles it (`theme.js`).
- **Bootstrap's own variables point at the tokens,** so stock classes (`btn-primary`, `form-control`,
  `table`, `alert-danger`, `text-secondary`) already match. Prefer them over custom classes.
- **Every page** extends `webui/base.html`, which includes `webui/components/hrs_head.html` (fonts,
  Bootstrap, `hrs.css`, theme script). Page-specific layout goes in `app.css`.
- **JS reads tokens** with `cssVar('--hrs-…', fallback)` from `theme.js`. Map markers do this, so
  they change colour with the theme. Listen for the `hrs:themechange` event to redraw.

## Colour

| Token | Use |
|---|---|
| `--hrs-brand` (rescue navy) | Primary actions, active navigation, links |
| `--hrs-accent` (SOS orange) | Rare emphasis, e.g. new or urgent highlights |
| `--hrs-status-pending` / `-validated` / `-rejected` | Incident validation status everywhere: map markers, dots, badges, list items |
| `--hrs-volunteer` / `--hrs-volunteer-inactive` | Volunteers on the map and in badges; the active / inactive dot on avatars |
| `--hrs-panel-head`, `--hrs-highlight` | Dashboard panel headers (lavender tint); selected incident card and assigned volunteer |
| `--hrs-success` / `-warning` / `-danger` / `-info` | Feedback (alerts, toasts, destructive buttons) |
| `--hrs-background`, `--hrs-surface`, `--hrs-surface-muted`, `--hrs-border` | Page, cards and panels, hover and fills, dividers |
| `--hrs-text`, `--hrs-text-muted`, `--hrs-text-subtle` | Body, secondary, placeholder and disabled text |

Validated is red on purpose: a validated incident is a confirmed emergency that needs action. Use
the `-text` variants (`--hrs-danger-text` …) for text on tinted backgrounds; they keep AA contrast.

## Scales

- **Type:** display 28 · h1 24 · h2 20 · h3 18 · h4 16 · body 15 · small 13 · eyebrow 12 caps.
  Noto Sans with Noto Sans Bengali, so Bangla renders in the same family.
- **Radius:** sm 8 · md 12 (buttons, inputs) · lg 16 (cards) · pill (badges, chips).
- **Controls:** sm 34 · md 44 · lg 52 px high.
- **Motion:** 150 / 250 ms ease-out-cubic; disabled under `prefers-reduced-motion`.

## Components

| Class | What |
|---|---|
| `hrs-navbar`, `hrs-navbar-inner`, `hrs-brand`, `hrs-brand-mark`, `hrs-nav-center` | Full-width top bar: brand at the left edge, page tabs centred (lg and up), account actions at the right edge |
| `hrs-container` | Centred content column, `--hrs-content-max` wide (900px, leaving room for a sidebar later) |
| `hrs-card`, `hrs-panel`, `hrs-hero` | Surfaces (Bootstrap `.card` is styled the same way) |
| `hrs-dot hrs-dot-{status}` | Status dot: `pending`, `validated`, `rejected`, `volunteer` |
| `hrs-badge hrs-badge-{status}` | Status pill with a tinted background |
| `hrs-chip` | Stat chip; as a `<button>` with `aria-pressed`, a filter chip |
| `hrs-list`, `hrs-list-item` (`aria-current`, `.is-new`) | Incident feed rows: selected state and a pulse for new reports |
| `hrs-stat`, `hrs-field` | Number with label; label/value pair in detail views |
| `hrs-segmented` | Segmented control on `nav-pills` |
| `hrs-search` | Input with a search icon |
| `hrs-empty`, `hrs-spinner-overlay` | Empty state; loading overlay |
| `btn-ghost`, `btn-icon` | Borderless button; square icon button |
| `hrs-pin hrs-pin--{status}` (`--urgent`), `hrs-pin-count`, `hrs-pin-alert` | Incident map pin: teardrop filled with the main need's colour (`--hrs-pin-fill`) and icon, outline in the status colour, rejected faded, `+N` further needs, pulsing `!` when life-threatening. Built by `incidentPinHtml()` in `map.js` |
| `hrs-filter-bar`, `hrs-chip-row` | Search + filters toolbar; a row of need chips (`button.hrs-chip[aria-pressed]`), one swipeable line on phones |
| `hrs-need-icons`, `hrs-need-icon` | An incident's needs as small circles in the need colour (`--hrs-pin-fill`) with the need icon; label in `.visually-hidden` |
| `hrs-badge-urgent` | Life-threatening badge |
| `hrs-row-link`, `hrs-incident-card` | Clickable, keyboard-focusable incident row (table, ≥768px) and card (phones) |
| `hrs-detail-map`, `hrs-detail-fields`, `hrs-edit-form` | Incident details pop-up: map preview, field grid, triage edit form. Need checkboxes are `.btn-check` + `label.hrs-chip` |
| `.pagination` | Bootstrap pagination mapped to the brand tokens |
| `hrs-badge-web` | "Web" badge on incidents reported from the web app |
| `hrs-report-panel` | Panel shown to non-operators instead of incident data, with a Report button |
| `hrs-report-map` | Map in the report form (tap to place the pin; 45vh on phones) |
| `hrs-map-legend` (`.is-collapsed`) | Collapsible on-map legend (needs, pin outlines, badges, volunteer). Built by `addLegend()` in `map-legend.js`; open on ≥768px, remembers the operator's choice |

| `hrs-dashboard` (`--no-incidents`, `--no-volunteers`, `[data-mobile-tab]`) | Live dashboard grid: 320px · map · 320px, a collapsed side becomes a 48px rail; under 992px one section at a time with `hrs-dash-tabs` at the bottom |
| `hrs-panel--incidents` / `--volunteers` (`.is-collapsed`), `hrs-panel-head`, `hrs-panel-body`, `hrs-panel-controls`, `hrs-panel-showing` | Dashboard side panels |
| `hrs-stat-card--{pending,resolved,active,inactive,all}` | Count card that filters (`button[aria-pressed]`): tinted fill, outline when chosen |
| `hrs-area-row`, `hrs-area-select` | Zilla / Upazilla dropdowns on a muted fill |
| `hrs-dash-item` (`.is-selected`), `hrs-dash-card`, `hrs-dash-title`, `-meta`, `-place`, `-message`, `-foot`, `hrs-dash-status--{status}`, `hrs-vol-badge` | Incident card: title, date • time, District • Thana, one-line message, "N volunteers", status outline badge |
| `hrs-popup-card` | The incident card inside a map popup |
| `hrs-vol-card` (`.is-assigned`), `hrs-avatar`, `hrs-avatar-dot--on/off` | Volunteer card; round photo (or initials) with an active dot |
| `hrs-live-status[data-status]`, `hrs-map-report` | "Live" badge at the top of the map; Report incident button at its bottom-centre |
| `hrs-bell`, `hrs-bell-badge`, `hrs-bell-menu`, `hrs-avatar-button` | Navbar bell with unread count; account avatar |
| `hrs-place-list`, `hrs-place`, `hrs-place-row`, `hrs-place-map` | Location tab: districts with their thanas, boundary preview |

Leaflet's stylesheet loads after `hrs.css`, so map overrides are scoped under `.leaflet-container`.
In dark mode the OpenStreetMap tiles are inverted with a CSS filter (`--hrs-map-tiles-filter`).

Need icons and colours come from the admin-editable need types (`/api/incidents/need-types/`).
Only Bootstrap Icons names (`[a-z0-9-]+`) and `#RRGGBB` colours are used; anything else falls
back to a grey question mark. The `/app/design/` page shows sample pins and the legend.
