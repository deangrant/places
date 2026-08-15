---
version: alpha
name: Places
description: >-
  Dark forest Places explorer with soft teal accent, frosted side panel chrome,
  Sora UI type, and a light Mapbox canvas under dark overlays.
colors:
  background: "#0f1a17"
  background-elevated: "#162420"
  background-panel: "#1a2c27"
  surface-chrome: "rgb(15 26 23 / 94%)"
  surface-overlay: "rgb(15 26 23 / 55%)"
  surface-map-fallback: "rgb(15 26 23 / 72%)"
  modal-backdrop: "rgb(6 14 12 / 72%)"
  on-background: "#e8f0ec"
  on-background-muted: "#9bb0a6"
  on-accent: "#06140f"
  outline: "#2a4038"
  outline-strong: "#3d5a4e"
  accent: "#3d9b7a"
  accent-strong: "#2f7d62"
  accent-soft: "rgb(61 155 122 / 18%)"
  danger: "#d9786a"
  marker: "#3d9b7a"
  marker-selected: "#2f7d62"
  marker-cluster-large: "#24634e"
  marker-stroke: "#ffffff"
  wash-teal: "rgb(61 155 122 / 18%)"
  wash-gold: "rgb(240 195 90 / 8%)"
typography:
  body-md:
    fontFamily: Sora
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.45
  body-sm:
    fontFamily: Sora
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.4
  label-sm:
    fontFamily: Sora
    fontSize: 0.68rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.04em
    textTransform: uppercase
  hint-sm:
    fontFamily: Sora
    fontSize: 0.8rem
    fontWeight: 400
    lineHeight: 1.35
  button-md:
    fontFamily: Sora
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.2
  title-md:
    fontFamily: Sora
    fontSize: 1.05rem
    fontWeight: 600
    lineHeight: 1.3
  badge:
    fontFamily: Sora
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.02em
  attrib:
    fontFamily: Sora
    fontSize: 0.7rem
    fontWeight: 400
    lineHeight: 1.35
rounded:
  sm: 6px
  md: 10px
  full: 9999px
spacing:
  "1": 0.25rem
  "2": 0.5rem
  "3": 0.75rem
  "4": 1rem
  "5": 1.5rem
  "6": 2rem
  side-panel-width: 360px
  side-panel-sheet-height: 42vh
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: 0.55rem 0.95rem
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
    textColor: "{colors.on-accent}"
  button-secondary:
    backgroundColor: "{colors.background-elevated}"
    textColor: "{colors.on-background}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: 0.55rem 0.95rem
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.on-background-muted}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: 0.55rem 0.7rem
  input-focus:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
  select-trigger:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.sm}"
    padding: 0.55rem 0.7rem
  select-list:
    backgroundColor: "{colors.background-elevated}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.md}"
  select-item-active:
    backgroundColor: "{colors.accent-soft}"
  select-item-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.on-background}"
  badge-accent:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
  side-panel:
    backgroundColor: "{colors.surface-chrome}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.md}"
    width: "{spacing.side-panel-width}"
  modal-panel:
    backgroundColor: "{colors.background-panel}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.md}"
  loading-card:
    backgroundColor: "{colors.background-elevated}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.md}"
---

# Places

## Overview

Places is a dark, map-first explorer for live OpenStreetMap data. The personality
is calm and operational: a deep forest canvas with soft teal and gold radial
washes, frosted dark chrome over a light Mapbox map, and elevated green panels
for filters, results, and dialogs. Teal (`accent`) is the single brand action
color — primary buttons, focus rings, links, selected listbox rows, and map
markers. Sora carries all UI chrome. The emotional target is focused and
geographic, not playful and not neon. Default presentation is **dark mode
only** (`color-scheme: dark`); there is no light theme in the current token set.

Canonical CSS tokens live in
[`apps/web/src/styles/global.css`](../../apps/web/src/styles/global.css).

## Colors

The palette is dark forest neutrals plus one teal accent and restrained danger.

- **Accent (#3d9b7a):** Teal for primary actions, focus outlines, links, badges,
  and unselected markers. Stronger `#2f7d62` for hover / selected marker.
  Soft tint `rgba(61, 155, 122, 0.18)` for selected rows and ghost hover.
- **On-accent (#06140f):** Near-black ink on filled primary buttons. Documented
  here as a role; the Button CSS still inlines this hex today.
- **Ink (#e8f0ec):** Light mint body text; muted `#9bb0a6` for labels, hints,
  and secondary chrome.
- **Surfaces:** Page `#0f1a17`; elevated `#162420`; panel `#1a2c27`; frosted side
  chrome `rgba(15, 26, 23, 0.94)`.
- **Outline:** Soft green borders `#2a4038` / `#3d5a4e`.
- **Danger (#d9786a):** Errors and destructive emphasis only — no soft danger
  chip token yet.
- **Map markers:** Align with accent / accent-strong; cluster large `#24634e`;
  stroke white. Keep Mapbox paint constants centralized under `MapView`
  (`map-layers.ts`), matching `--color-marker*`.

Do not introduce a second saturated brand color. Keep purple, cream landing
themes, and glow effects out of the product chrome. A faint gold wash on the
page background is atmospheric only — not a second action color.

## Typography

One family only:

- **Sora** — shell, filters, buttons, labels, panels, map attribution chrome.
  Fallbacks: `"Avenir Next", "Segoe UI", sans-serif`.

Weights stay practical (400 body, 600 labels/buttons/badges). Form labels are
uppercase micro type (`~0.68rem`, wide tracking). Avoid display/hero type
scales on Places surfaces; this is an explorer workspace, not a marketing page.
There is no product mono stack today.

## Layout

The shell is a full-viewport grid: filter chrome on top, then a workspace where
the Mapbox map fills the pane and a frosted side panel overlays results/detail.

- Side panel width `min(360px, calc(100% - 1.5rem))`, inset by `--space-3`.
- Below `1100px`, the side panel becomes a bottom sheet
  (`height: min(42vh, 420px)`).
- Modals center a panel up to `36rem` wide over a dark green backdrop.
- Spacing uses a 4px-based rem scale (`--space-1` … `--space-6`: `0.25rem` …
  `2rem`). Prefer compact padding in filters; panels and modals use
  `--space-4` / `--space-5` grouping.

## Elevation & Depth

Depth is tonal and frosted, with one shared panel shadow:

- Page background: dual radial washes (teal + soft gold) over `--color-bg`.
- Side panel: translucent forest chrome with `backdrop-filter: blur(10px)`.
- Shadow: `--shadow-panel` (`0 12px 40px rgba(0, 0, 0, 0.35)`) on panels,
  modals, select menus, and loading cards.
- Hierarchy: map canvas < frosted chrome < elevated / panel surfaces < modal.

Avoid multi-layer dramatic shadows or glow accents. Short enter motions
(`panelIn`, `selectIn`, `cardIn`) are allowed for presence; do not add noisy
ambient animation.

## Shapes

Corner language is restrained:

- **6px (`rounded.sm`)** — buttons, inputs, select triggers, most controls.
- **10px (`rounded.md`)** — side panel, modals, select menus, loading cards.
- **Pill (`rounded.full`)** — badges only.

Keep radii consistent; do not mix large marketing-card radii into the explorer.

## Components

Map new UI to existing patterns under `apps/web/src/components/` and
`pages/Places/`:

- **Buttons** — `primary` (teal fill + on-accent text), `secondary` (elevated +
  strong border), `ghost` (muted text). Prefer existing variants over new ones.
- **Inputs** — dark field, soft border; stronger border on hover/focus; optional
  clear control.
- **Select** — custom listbox trigger + elevated menu; active/selected rows use
  `accent-soft`; country Select may be `searchable`.
- **Badges** — accent-soft pill chips (category / status hints).
- **FormField** — uppercase muted label above the control; optional muted hint.
- **Modal** — panel surface, strong border, shared panel shadow.
- **Side panel / loading card** — frosted or elevated surfaces over the map.
- **Map** — Mapbox light style under dark UI; marker paint from `MapView`
  helpers, not scattered one-off hex in random modules.

App code should keep using CSS variables from `global.css` rather than
hard-coded hex in new modules when a token already exists.

## Do's and Don'ts

### Do

- Keep the experience dark, forest-green, and map-first.
- Use teal only for action, focus, selection, links, and brand emphasis.
- Use Sora for UI chrome; match existing label/button weight scales.
- Prefer borders + tonal surfaces; reuse `--shadow-panel` sparingly.
- Match spacing to the existing `--space-*` scale and compact filter density.
- Keep Mapbox layer/paint colors centralized under `MapView` map-layer helpers.

### Don't

- Invent purple, cream, light-landing, or neon themes on Places surfaces.
- Swap in Inter/Roboto/system-only stacks or decorative display fonts.
- Turn the product into a light dashboard without a deliberate token redesign.
- Use large card radii, pill primary buttons, or dashboard stat strips.
- Scatter marker/cluster hex outside `MapView` map-layer helpers.
- Hard-code one-off colors when a token in `global.css` already covers the role.
- Let user-global “expressive landing” design rules override this system on
  Places surfaces.
