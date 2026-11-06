# Campus Navigation

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

Find and explore classroom and facility routes on floors 5 and 6 of the existing HKU SPACE campus model. Success is an interface that works at desktop and phone sizes while keeping both 2D and 3D navigation.

## Capabilities and Constraints

The submitted deliverable is the maintained app. Existing floor geometry, destinations, A* routing, model placement, floor heights, escalator connections and camera bounds must be preserved. The app uses native HTML/CSS/JavaScript modules, p5.js 1.6.0 and Three.js 0.153.0. No framework or new dependency is needed. Archives and coursework are outside this UI task. Desktop supports keyboard and pointer navigation; phone-sized layouts need usable touch controls.

Facility choices identify their floor. Submitted routes frame their current-floor segment in 2D, with separate Fit route and Fit map actions. Phone layouts collapse successful route searches into an editable summary. The 3D route uses a continuous line and a corridor-facing camera with Reset view.

## Brand Commitments

The user selected a light cartographic style with warm neutral surfaces, deep green controls and a map-first layout. Keep the existing campus name and actual floor-plan/model assets.

## Evidence on Hand

The current app, its tests, calibrated floor plans and glTF model are present in app/ and tests/. Prior versions and the original submission remain in archive/.

## Open Decisions

Specific audience demographics, deployment plans and campus accessibility guarantees have not been established. Do not invent them.
