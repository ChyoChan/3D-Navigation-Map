import { DESTINATIONS, findRoute } from './navigation.js';
import { createMap2D } from './map-2d.js';

const element = id => document.getElementById(id);
const map = createMap2D(element('twodmapcontainer'), element('minimapContainer'));
let floor = 5;
let route = null;
let map3D = null;
let loading3D = null;
let threeDActive = false;
let wants3D = false;

for (const name of Object.keys(DESTINATIONS)) {
    const option = document.createElement('option');
    option.value = name;
    element('destinations').appendChild(option);
}

function updateFloorLabels() {
    element('floor-label').textContent = `Floor ${floor}`;
    element('minimap-floor').textContent = `${floor}F`;
    element('fit-route').disabled = !route?.segments.some(segment => segment.floor === floor);
    for (const value of [5, 6]) {
        element(`map_${value}f`).setAttribute('aria-pressed', String(floor === value));
    }
    for (const button of element('route-steps').children) {
        button.setAttribute('aria-pressed', String(Number(button.dataset.floor) === floor));
    }
}

function updateFloor(value) {
    floor = value;
    map.setFloor(value);
    updateFloorLabels();
}

function setPlannerExpanded(expanded, focus = false) {
    element('route-planner').classList.toggle('is-compact', Boolean(route) && !expanded);
    element('edit-route').setAttribute('aria-expanded', String(expanded));
    element('edit-route').textContent = expanded ? 'Hide fields' : 'Edit route';
    if (focus && window.matchMedia('(max-width: 760px)').matches) {
        element(expanded ? 'start_input' : 'edit-route').focus({ preventScroll: true });
    }
}

function fitRoute() {
    if (!map.fitRoute()) map.fit();
}

function showError(message) {
    element('error-text').textContent = message;
    element('errormessage').hidden = false;
    element('empty-state').hidden = true;
}

function renderRoute() {
    map.setRoute(route);
    map3D?.setRoute(route);
    element('route-summary').hidden = !route;
    element('empty-state').hidden = Boolean(route);
    element('infomsg').hidden = !route || route.segments.length < 2;
    element('same-floor-note').hidden = !route || route.segments.length > 1;
    element('route-steps').replaceChildren();
    updateFloorLabels();
    if (!route) return;
    element('route-description').textContent = `${route.from} to ${route.to}`;
    for (const segment of route.segments) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${segment.floor}F`;
        button.setAttribute('aria-label', `View route on floor ${segment.floor}`);
        button.dataset.floor = segment.floor;
        button.addEventListener('click', () => {
            show2D();
            updateFloor(segment.floor);
            fitRoute();
        });
        element('route-steps').appendChild(button);
    }
    element('route-announcement').textContent = `Route from ${route.from} to ${route.to}. ${route.segments.map(segment => `Floor ${segment.floor}`).join(', then ')}.`;
    updateFloorLabels();
}

element('route-form').addEventListener('submit', event => {
    event.preventDefault();
    const from = element('start_input').value.trim();
    const to = element('end_input').value.trim();
    const invalidStart = !Object.hasOwn(DESTINATIONS, from);
    const invalidEnd = !Object.hasOwn(DESTINATIONS, to);
    for (const [id, invalid] of [['start_input', invalidStart], ['end_input', invalidEnd]]) {
        element(id).setAttribute('aria-invalid', String(invalid));
        element(id).setAttribute('aria-describedby', invalid ? 'destination-hint error-text' : 'destination-hint');
    }
    route = invalidStart || invalidEnd ? null : findRoute(from, to, floor);
    element('errormessage').hidden = true;
    renderRoute();
    if (route) {
        updateFloor(route.segments[0].floor);
        fitRoute();
        setPlannerExpanded(false, true);
    } else {
        setPlannerExpanded(true);
        showError(invalidStart ? 'Choose a starting point from the suggestions.' : 'Choose a destination with its floor from the suggestions.');
        element(invalidStart ? 'start_input' : 'end_input').focus();
    }
});

for (const value of [5, 6]) {
    element(`map_${value}f`).addEventListener('click', () => {
        updateFloor(value);
        if (route) fitRoute();
    });
}
element('zoomin').addEventListener('click', () => map.zoom(1));
element('zoomout').addEventListener('click', () => map.zoom(-1));
element('fit-map').addEventListener('click', () => map.fit());
element('fit-route').addEventListener('click', fitRoute);
element('reset-view').addEventListener('click', () => map3D?.resetView());
element('edit-route').addEventListener('click', () => {
    const expanded = element('edit-route').getAttribute('aria-expanded') === 'true';
    setPlannerExpanded(!expanded, true);
});

function updateView() {
    element('switch2d').setAttribute('aria-pressed', String(!threeDActive));
    element('switchmap').setAttribute('aria-pressed', String(threeDActive));
    element('threedcontainer').hidden = !threeDActive;
    element('twodmapcontainer').hidden = threeDActive;
    element('floor-controls').hidden = threeDActive;
    element('zoom-controls').hidden = threeDActive;
    element('map-help').textContent = threeDActive ? 'Explore the campus. Your position appears on the floor plan.' : 'Drag to pan. Scroll or pinch to zoom.';
    map.setMinimap(threeDActive);
}

function show2D() {
    wants3D = false;
    threeDActive = false;
    map3D?.setActive(false);
    element('model-loading').hidden = true;
    updateView();
    updateFloor(floor);
}

element('switchmap').addEventListener('click', async () => {
    if (threeDActive) return;
    wants3D = true;
    element('switchmap').disabled = true;
    element('switchmap').setAttribute('aria-busy', 'true');
    element('three-d-label').textContent = 'Loading…';
    element('model-loading').hidden = false;
    try {
        if (!loading3D) {
            loading3D = import('./map-3d.js').then(({ createMap3D }) =>
                createMap3D(element('threedmodel'), position => {
                    if (!threeDActive) return;
                    floor = position.floor;
                    map.setPosition(position);
                    updateFloorLabels();
                })
            );
        }
        map3D = await loading3D;
        if (!wants3D) return;
        threeDActive = true;
        updateView();
        map3D.setRoute(route);
        map3D.setActive(true);
        element('errormessage').hidden = true;
    } catch (error) {
        loading3D = null;
        showError('The 3D map could not load. Check your connection, then try 3D view again.');
        console.error(error);
    } finally {
        element('switchmap').disabled = false;
        element('switchmap').setAttribute('aria-busy', 'false');
        element('three-d-label').textContent = '3D view';
        element('model-loading').hidden = true;
    }
});
element('switch2d').addEventListener('click', show2D);

for (const button of document.querySelectorAll('[data-move]')) {
    const move = pressed => {
        if (threeDActive) map3D.setMovement(button.dataset.move, pressed);
    };
    button.addEventListener('pointerdown', event => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        move(true);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur']) {
        button.addEventListener(event, () => move(false));
    }
    button.addEventListener('keydown', event => {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        move(true);
    });
    button.addEventListener('keyup', event => {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        move(false);
    });
    button.addEventListener('click', event => {
        // Assistive technology can activate a button without pointer or keyboard events.
        if (event.detail !== 0) return;
        move(true);
        setTimeout(() => move(false), 200);
    });
}

updateFloor(floor);
