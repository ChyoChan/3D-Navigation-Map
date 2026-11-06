# Refactor notes

These notes record the original local refactor. This public code distribution includes all maintained and archived source trees with their runtime assets. Coursework records, reports, videos, CAD files and local review captures described below remain preserved in the local project and are excluded from this repository.

## Scope

The submitted deliverable is the maintained app. All earlier versions and original submissions remain intact under `archive/`. Assignment documents were treated as project records, not as instructions to change scope.

| Original location | New location |
| --- | --- |
| `PKPD_Group_5/` | `archive/PKPD_Group_5/` |
| `3D-Navigation-Map-main/` | `archive/3D-Navigation-Map-main/` |
| `web/` | `archive/web/` |
| `Assignment/` | `docs/Assignment/` |
| `Information/` | `docs/Information/` |
| `Project Deliverable/` | `docs/Project Deliverable/` |
| `One drive folder.docx` | `docs/One drive folder.docx` |
| `2D map/` | `assets/source-floor-plans/` |

All 182 original files were checked by SHA-256 against these locations before application. Hidden Finder metadata is also preserved, but omitted from the readable folder listing. Nothing was committed, pushed or pulled.

## Maintained app changes

- Replaced the three coupled global scripts with four native JavaScript modules. Route search returns complete floor segments; graphics code consumes them directly.
- Preserved the submitted floor geometry, destination coordinates, diagonal movement and neighbor order. Representative paths match the original algorithm exactly.
- Preserved the model placement, floor heights, escalator slope, camera limits, movement controls and existing visual assets. The active 3D renderer now sizes to its map container so the minimap and its close control stay visible.
- Validated destination labels with own-property checks so inherited object names cannot pass as destinations. Named facilities belong to the floor selected at submission; floor browsing retains that route.
- Fixed the sixth-floor image filename case, the missing wheel-zoom handler, repeated model/listener/animation initialization, and stale route handling on an irrelevant floor.
- Generated one shared destination list from the routing data, including the already configured room 611. Removed unused sound-addon loading from the maintained page.
- Added form submission, input labels, accessible icon-button names, status announcements and visible keyboard focus. Status messages and map controls stay above canvas layers.
- Reset held movement keys when the pointer unlocks or the window loses focus. Limited frame time and vertical friction integration to prevent unstable jumps after a pause or slow frame.

## Checks and limits

`npm test` runs 12 tests using Node's standard library. It covers all destination combinations on both selected floors, original-path comparisons, same-point and repeated searches, validation, UI route retention, 2D/minimap controls, 3D lifecycle and resource reuse, failure/retry, and exact-case local HTML/CSS/module/glTF references.

A real Chrome browser smoke check loaded the floor plans and the textured 3D model and exercised routing and switching views. No backend, package installation or build pipeline was introduced. Full movement/collision behavior across the physical building, mobile layouts, other browsers and archived prototypes were not exhaustively tested. The original app provides free camera movement with bounds, not wall collision detection.

CDN dependencies remain pinned to their existing versions, so a working connection is required. Historical examples retain their original limitations, including missing Draco decoder files in the Tokyo demo and known prototype mistakes. Documents, videos, CAD data, vendored libraries and captured bundles were not rewritten.

## Responsive interface update

The interface now uses a light cartographic palette and responsive route/map layouts, SVG controls, an expandable legend, fit-to-view floor plans and touch-enabled maps. The route summary contains selectable floor segments. Form errors mark and focus the invalid field; loading state can be canceled by choosing 2D. The 3D module keeps its calibrated model and desktop controls while adding touch look and six on-screen movement directions. Twenty-two tests pass. Browser captures cover desktop, phone, small phone, tablet, landscape and the user's current viewport; physical touch hardware and non-Chrome browsers were not tested.

## Navigation usability improvements

- Replaced oversized 3D spheres with thin continuous route geometry and small endpoint cones. Route setup and Reset view place the camera in the corridor facing along the first segment; same-point routes retain their floor's overview. Model calibration and free movement remain intact.
- Collapsed successful phone searches into an editable route summary, retaining field values, focus behavior and cross-floor transfer information.
- Added Fit route alongside Fit map. Search, floor changes and route-floor steps frame the current segment, with bounded zoom and clearance for floating controls. Manual pan and zoom retain the existing limits.
- Exposed 31 destinations: 21 rooms and 10 explicit facility/floor combinations. Generic facility aliases remain compatible within the routing module, while the form requires a floor-qualified choice.

All 38 tests pass, including all 1,922 public destination/floor combinations, exact original paths, framing on small and short viewports, compact editing and 3D reset/lifecycle checks. Real-browser captures cover desktop, phone, 320px width, tablet and short landscape in both map modes. The scoped review found and verified fixes for same-point floor reporting and small-screen endpoint/control overlap. The style detector reported 15 pre-existing token-documentation advisories and no new mechanical bans; unrelated styling was left alone. Physical touch hardware and browsers outside Chromium were not tested. The existing CDN requirement and free-camera behavior remain.
