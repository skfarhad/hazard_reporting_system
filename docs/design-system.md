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
| `--hrs-volunteer` | Volunteers on the map and in badges |
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
| `hrs-navbar`, `hrs-brand`, `hrs-brand-mark`, `hrs-nav-center` | Top bar: brand left, page tabs centred (lg and up), account actions right |
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

Leaflet's stylesheet loads after `hrs.css`, so map overrides are scoped under `.leaflet-container`.
In dark mode the OpenStreetMap tiles are inverted with a CSS filter (`--hrs-map-tiles-filter`).
