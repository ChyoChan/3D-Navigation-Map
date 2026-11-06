---
name: Campus Navigation
description: A light cartographic workspace for HKU SPACE campus routes.
colors:
  primary: "#1e5b47"
  primary-hover: "#154735"
  primary-active: "#0e3528"
  selected: "#e5eee7"
  ground: "#f3f4ee"
  surface: "#ffffff"
  ink: "#243b32"
  muted: "#576a60"
  border: "#dce2d9"
  input-border: "#a5b1a6"
  error: "#9c3c30"
  error-bg: "#fff1ed"
  destination: "#a74c38"
typography:
  title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "26px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  map-title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "19px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  route-title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.5
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "13px"
    fontWeight: 650
  action:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "14px"
    fontWeight: 650
  detail:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  panel: "16px"
  control: "10px"
  route-step: "8px"
  mode-option: "7px"
  floor-option: "6px"
spacing:
  step-1: "4px"
  step-2: "8px"
  step-3: "12px"
  step-4: "16px"
  step-5: "24px"
  step-6: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "48px"
    width: "100%"
  mode-selection:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "4px"
  mode-option-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.mode-option}"
    padding: "8px 12px"
  floor-selection:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "4px"
  floor-option-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.primary}"
    rounded: "{rounded.floor-option}"
  map-container:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
---

# Design System: Campus Navigation

## Overview

**Creative North Star: "Light cartographic style"**

A calm working interface built around actual campus drawings. Warm neutral ground, white work surfaces and deep evergreen controls make route editing and map inspection readable. The user chose this palette and a map-first layout; the interface keeps the existing HKU SPACE name and campus assets.

The visual language is compact and practical: system sans text, familiar native controls, thin boundaries and restrained selected states. The 2D floor plan and 3D model are content, with their original detail retained rather than restyled as decoration.

**Key Characteristics:**

- Warm neutral ground with white, bordered work areas.
- Evergreen actions and sage selections; terracotta destination markers.
- Functional system typography and visible control labels.
- Responsive map controls with keyboard and touch access.

## Colors

The palette pairs quiet green-tinted neutrals with evergreen controls and a separate destination signal. Frontmatter values follow the CSS custom properties in `app/styles/main.css`.

### Primary

- **Evergreen**: Primary route action, selected map mode, focus outlines, route path and origin markers. Its hover and active variants deepen the same action.
- **Sage Selection**: Selected floors and quiet hover feedback; it does not replace the stronger selected mode treatment.

### Secondary

- **Terracotta Destination**: Destination label and endpoint marker, distinct from the origin.
- **Brick Error / Pale Error Surface**: Invalid fields and alert messages. These are semantic signals rather than decorative accents.

### Neutral

- **Warm Ground**: Page work area and the map-mode group track.
- **White Surface**: Planner, map, fields and floating controls.
- **Dark Ink / Muted Ink**: Main text and supporting instructions.
- **Soft Border / Field Border**: Work-area divisions and stronger interactive field boundaries.

**The State and Signal Rule.** Use evergreen for actions and route origin, sage for quiet selections, and terracotta for the destination; accompany these colors with labels or marker shapes.

## Typography

**Body and UI Font:** The platform system sans stack in the frontmatter. These are functional headings and labels, with no separate display face.

### Hierarchy

- **Title**: Route-planner heading; reduces to (22px) at phone widths and (20px) in short landscape.
- **Map Title**: Map heading; reduces to (16px) on phones.
- **Route Title**: Submitted endpoint summary; reduces to (16px) on phones and wraps long destination names.
- **Body**: Planner explanation and ordinary supporting copy. Route notes use (13px) with (1.6) line height.
- **Label / Action**: Field labels and the primary action use medium emphasis; mode options and floor selections use (13px), with mode options at (600) weight.
- **Detail**: Hints, current-floor labels, map footer and legend information. Floor labels and floor controls use tabular numerals.

**The Working Type Rule.** Keep labels in sentence case and use size and weight to distinguish tasks, controls and supporting text.

## Layout

The desktop header is (76px) tall. Below it, a (320px) planner sits beside a fluid map workspace; the workspace fills the remaining dynamic viewport height with a (600px) minimum. The map has (24px) outer spacing, and the route planner uses (32px 24px 24px) padding. Spacing follows the six frontmatter steps, with smaller local adjustments for compact labels and map overlays.

At (1050px) and below, the planner narrows to (280px), the map gutter becomes (16px), and footer content stacks. At (760px) and below, the header becomes (68px), the page stacks planner, map and expandable legend with (16px) gutters, and From/To fields share two equal columns. The map viewport is (60svh), bounded by (380px) and (600px), so the drawing remains useful below the form. The route action remains full width. Safe-area bottom padding is honored where available.

At (380px) and below, outer spacing becomes (12px), planner padding becomes (16px), mode icons disappear while text remains, and the legend uses two columns.

A successful search at phone widths collapses the route fields into a compact summary with an Edit route action. Editing restores the entered values and focus; Hide fields returns to the summary. Cross-floor summaries retain the escalator instruction. Validation expands the fields and focuses the invalid value.

Short landscape has an explicit exception: widths (560px–760px) with height at most (500px) use a (52px) header and a (220px) planner beside the map. The planner scrolls within its column, the legend sits below it, and the map fills the remaining height. Open legends are bounded to (180px); the minimap reduces to (96px) wide and (108px) high. This preserves visible mode and map controls without expanding the viewport vertically.

**The Reachable Control Rule.** Keep interactive map targets at least (44px) high; icon map controls and movement controls are (44px × 44px). Inputs stay (48px) high. Compact layouts reduce spacing and secondary detail rather than shrinking those controls.

## Elevation & Depth

Work areas and controls are flat: the UI defines no box-shadow vocabulary. White surfaces, warm surrounding ground, thin borders and containment establish depth. Floating map controls are white bordered groups placed inside the map viewport; they do not use decorative elevation.

## Shapes

Main map panels, mobile planners and mobile legend containers use the panel radius. Inputs and primary controls use the control radius; route steps and movement keys use the smaller route-step radius. Nested mode and floor options use their own slightly smaller corners. Most boundaries are (1px). The origin is circular and the destination is squared; outlined floor-transfer markers preserve a distinct meaning. Short-landscape planner and legend join with (12px) outer corners.

## Components

### Buttons

The primary action is a full-width evergreen button with white text, a right arrow and the action typography. It has a (48px) minimum height on desktop; phones use (44px) minimum height and (10px 14px) padding. Hover and active states deepen the green. Disabled controls use (0.6) opacity; busy loading controls use a wait cursor.

Buttons, inputs, summaries, links and the map canvas receive a visible (3px) evergreen focus outline with (3px) offset. Zoom controls and the canvas inset their outline by (4px) so clipping does not hide focus.

### Inputs / Fields

White fields have the field-border stroke, control corners and dark text. Visible From/To labels pair with A/B marker shapes. Native destination suggestions remain available through a datalist; facilities include a floor suffix such as `Elevator · 6F`. Hover strengthens the border to evergreen; invalid fields use the error color, `aria-invalid` and linked error text. The error container uses `role="alert"`; route updates use a polite status announcement.

### Mode and Floor Selection

The 2D/3D switch is a small neutral track containing text-labelled buttons. Its selected mode is evergreen with white text; an unselected hover is sage. Floor controls are a white bordered group with sage selected options and evergreen text. Both expose `aria-pressed` within a labelled group. Route-summary floor buttons repeat the sage selection with a green border and return to the corresponding 2D floor without discarding the submitted route.

### Map Containers and Controls

The map container has a bordered toolbar, clipped drawing viewport and bordered footer. Zoom, Fit route, Fit map and floor controls stay within its viewport. Search and route-floor changes automatically frame the relevant segment with space for markers and controls. The 3D view adds a live floor-plan minimap, help text, movement controls and a labelled Reset view action below the minimap. Icon-only buttons carry accessible names; icons use inline SVG strokes. Canvas labels explain keyboard controls, and a skip link moves focus directly to the map.

Campus drawings, facility pictograms, model geometry and textures remain content assets. The 3D route uses a thin evergreen line and small evergreen/terracotta endpoint cones. Its camera faces along the route from the corridor near the origin; Reset view restores this pose. No new raster assets were generated for the interface; The (20) original source rasters remain unchanged.

### Legend and Status

The legend uses native `details` / `summary`, a labelled pictogram list and a rotating disclosure chevron. Empty, invalid, submitted-route and model-loading states use short instructions and semantic status or alert regions. Loading 3D leaves the 2D control available and identifies the pending mode with `aria-busy`.

State-color transitions and the disclosure rotation use (180ms) with `cubic-bezier(.16, 1, .3, 1)`. Reduced-motion preference disables transitions and animations and restores automatic scrolling. Coarse pointers receive touch-specific help; keyboard operation remains available.

## Do's and Don'ts

### Do:

- **Do** keep the actual campus drawings and model as the map content.
- **Do** preserve visible labels, pressed states, focus outlines and announced route or error feedback.
- **Do** maintain the 44px control floor and the short-landscape layout exception.
- **Do** use the existing flat white surfaces, borders and spacing rhythm for related work areas.

### Don't:

- **Don't** replace the chosen warm neutral and evergreen palette with a different visual theme.
- **Don't** use decorative map imagery in place of calibrated floor plans.
- **Don't** rely on color alone to distinguish origin, destination, transfer or selected controls.
- **Don't** obscure the corridor with oversized route markers.
