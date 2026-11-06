# Campus 3D Navigation Map

The maintained app is based on the submitted deliverable from `PKPD_Group_5/007_ Project Deliverable/3D-Navigation-Map`. It finds routes between classrooms and facilities on floors 5 and 6, with a 2D floor plan and a first-person 3D view.

## Run

From this project folder:

```sh
npm start
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Python 3 serves the static app; Node.js/npm runs the development commands. No dependency installation or build step is needed. The browser needs internet access for the existing pinned p5.js and Three.js CDN dependencies. Serve the app over HTTP rather than opening the HTML file directly.

Choose From and To destinations and press Find route or Enter. Facilities include their floor, for example `Elevator · 6F`; this choice is independent of the displayed map floor. A cross-floor route uses the escalator; browse each floor to view its segment. Browsing floors preserves the submitted route, including when the input fields contain unsubmitted edits. On phones, a successful search collapses the fields into the route summary; Edit route restores the saved values.

The 2D plan fits the available space and automatically frames the route after a search or floor change. Use the zoom buttons, mouse wheel, or pinch to zoom; drag to pan. Fit route frames the current floor's segment; Fit map restores the whole floor plan. With the canvas focused, arrow keys pan, +/− zoom, and 0 or Home fits the plan. Select a route floor step to view that segment.

Choose 3D view to explore the model along a thin continuous route line. The camera starts just inside the corridor facing along the route; Reset view restores that position without clearing the route. A same-point route uses an overview of its floor. On desktop, click the scene to capture the pointer: WASD or arrow keys move, Left Control rises, Left Shift descends, and Escape releases the pointer. On touch devices, drag the scene to look and hold the on-screen movement buttons. Those buttons also support keyboard activation. Choose 2D map to return; your full-map zoom is retained when changing view modes.

## Code and folders

```text
3D-Navigation-Map/
├── app/                         Maintained static application
│   ├── index.html               Page, import map and accessible controls
│   ├── src/
│   │   ├── navigation.js        Destinations, calibrated geometry and pure A* routing
│   │   ├── map-2d.js            Responsive p5 floor plan and minimap
│   │   ├── map-3d.js            Three.js navigation, route line and camera reset
│   │   └── main.js              Form events and communication between maps
│   ├── styles/main.css
│   └── assets/                  Original floor plans, models, textures and icons
├── tests/                       Node's built-in tests
├── archive/
│   ├── PKPD_Group_5/007_ Project Deliverable/3D-Navigation-Map/
│   │                            Original submitted source and runtime assets
│   ├── 3D-Navigation-Map-main/  Earlier app and bundled reference code
│   └── web/                    Earlier prototypes and HTML exercises
├── docs/
│   ├── FOLDER_STRUCTURE.md     Complete repository listing
│   └── REFACTOR_NOTES.md       Changes, preservation and verification limits
├── PRODUCT.md                  Product scope
├── DESIGN.md                   Design tokens and responsive patterns
├── .gitignore
├── package.json
└── README.md
```

This repository contains the maintained app and all three historical source trees with their runtime assets. Coursework documents, reports, videos, CAD source records and local design-review captures stay in the original local project; they are excluded from this code distribution. Historical code keeps its original relative structure. The large `ust.js` and `ust_main.js` files are captured bundles in the earlier app, not maintained source.

The app exchanges one route value: `{ from, to, segments: [{ floor, path: [{ x, y }] }] }`. Routing has no browser or graphics dependency. Each map owns its rendering state.

See the [complete folder structure](docs/FOLDER_STRUCTURE.md) and [refactor notes](docs/REFACTOR_NOTES.md).

## Verify

With Node.js 20 or newer:

```sh
npm test
```

The 38 tests cover all 1,922 destination/floor combinations, representative exact paths from the original source, explicit facility floors, accessible validation, compact route editing, route framing, responsive resizing, touch/pointer/keyboard controls, minimap state, 3D camera reset, loading/retry/cancellation, animation lifecycle, model calibration and case-sensitive asset references. Tests use graphics mocks; browser checks verify the real floor images, model and 2D/3D switching separately.

Archived prototypes and submission documents are preserved records, not part of the maintained app's test target. Existing experimental-code defects remain in the archive.

The responsive interface uses the user-selected light cartographic direction: warm neutral surfaces, evergreen controls, compact route planning and a map-first workspace. The legend is expandable. Portrait phone layouts stack the route planner and map; desktop and short landscape layouts keep them side by side. Outlined transfer markers distinguish the escalator from the actual A/B route endpoints. Original CAD files, documents, archived code and model calibration are unchanged.
