import assert from 'node:assert/strict';
import test from 'node:test';
import { createMap2D } from '../app/src/map-2d.js';
import { findRoute } from '../app/src/navigation.js';

function setup({ deferred = false, width = 1000, height = 800 } = {}) {
    let p;
    let observer;
    const listeners = {};
    const captured = new Set();
    const full = { clientWidth: width, clientHeight: height };
    const mini = { clientWidth: 176, clientHeight: 220 };
    const canvas = {
        elt: {
            style: {}, attributes: {},
            setAttribute(name, value) { this.attributes[name] = value; },
            addEventListener(name, handler) { listeners[name] = handler; },
            getBoundingClientRect: () => ({ left: 10, top: 20, width: p.width, height: p.height }),
            focus() {},
            setPointerCapture(id) { captured.add(id); },
            hasPointerCapture: id => captured.has(id),
            releasePointerCapture(id) { captured.delete(id); }
        },
        parent(value) { this.container = value; }
    };
    globalThis.ResizeObserver = class {
        constructor(callback) { this.callback = callback; observer = this; }
        observe() {}
    };
    globalThis.window = {
        p5: function (sketch) {
            p = {
                CENTER: 'center', images: [], paths: [], markers: [], markerStyles: [], labels: [],
                loadImage: url => url,
                createCanvas(w, h) { this.width = w; this.height = h; return canvas; },
                resizeCanvas(w, h) { this.width = w; this.height = h; },
                image(...args) { this.images.push(args); },
                clear() { this.paths = []; this.markers = []; this.markerStyles = []; this.labels = []; },
                beginShape() { this.path = []; },
                vertex(x, y) { this.path.push([x, y]); },
                endShape() { this.paths.push(this.path); },
                ellipse(...args) { this.markers.push(['circle', ...args]); this.markerStyles.push({ fill: this.fillColor, stroke: this.strokeColor }); },
                rect(...args) { this.markers.push(['square', ...args]); this.markerStyles.push({ fill: this.fillColor, stroke: this.strokeColor }); },
                fill(color) { this.fillColor = color; },
                stroke(color) { this.strokeColor = color; },
                text(label) { this.labels.push(label); },
                redraw() { this.draw(); }
            };
            for (const name of ['noLoop', 'noFill', 'strokeWeight', 'noStroke',
                'textFont', 'textAlign', 'textSize']) p[name] = () => {};
            sketch(p);
            p.boot = () => { p.preload(); p.setup(); p.draw(); };
            if (!deferred) p.boot();
            return p;
        }
    };
    const map = createMap2D(full, mini);
    const fire = (name, values = {}) => {
        const event = {
            preventDefault() { this.prevented = true; },
            clientX: p.width / 2 + 10, clientY: p.height / 2 + 20,
            pointerId: 1, pointerType: 'touch', ...values
        };
        listeners[name](event);
        return event;
    };
    return { map, p, canvas, full, mini, fire, captured, resize: () => observer.callback() };
}

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≠ ${expected}`);
const rect = p => p.images.at(-1).slice(1);
const route = { segments: [{ floor: 5, path: [{ x: 18, y: 12 }, { x: 18, y: 13 }] }] };

test('fits the full plan into its host and projects every route cell through the image rectangle', () => {
    const { map, p, canvas } = setup();
    assert.deepEqual([p.width, p.height], [1000, 800]);
    const [x, y, w, h] = rect(p);
    close(w / h, 1000 / 1800);
    assert.ok(x >= 24 && y >= 24 && x + w <= p.width - 24 && y + h <= p.height - 24);
    map.setRoute(route);
    const path = p.paths.at(-1);
    close(path[0][0], x + 18.5 * w / 57);
    close(path[0][1], y + 12.5 * h / 93);
    assert.deepEqual(p.markers.map(marker => marker[0]), ['circle', 'square']);
    assert.deepEqual(p.labels, ['A', 'B']);
    assert.deepEqual(p.markerStyles, [
        { fill: '#1e5b47', stroke: '#ffffff' },
        { fill: '#a74c38', stroke: '#ffffff' }
    ]);
    map.setFloor(6);
    assert.equal(p.paths.length, 0);
    assert.match(p.images.at(-1)[0], /6floor_done_75\.png$/);
    assert.match(canvas.elt.attributes['aria-label'], /^Floor 6 plan/);
    map.setFloor(5);
    assert.equal(p.paths.at(-1).length, 2);
    map.setRoute(null);
    assert.equal(p.paths.length, 0);
});

test('resizes with the host while retaining a fixed canvas footprint and ignores hidden sizes', () => {
    const { map, p, full, resize } = setup();
    map.setRoute(route);
    full.clientWidth = 360;
    full.clientHeight = 480;
    resize();
    assert.deepEqual([p.width, p.height], [360, 480]);
    const [x, y, w, h] = rect(p);
    assert.ok(x >= 24 && y >= 24 && x + w <= 336 && y + h <= 456);
    close(p.paths.at(-1)[0][0], x + 18.5 * w / 57);
    full.clientHeight = 0;
    resize();
    assert.deepEqual([p.width, p.height], [360, 480]);
});

test('zoom, pan, keyboard and fit keep the plan reachable without changing canvas dimensions', () => {
    const { map, p, fire, captured } = setup({ width: 400, height: 600 });
    map.zoom(1);
    const [, , initialWidth] = rect(p);
    assert.deepEqual([p.width, p.height], [400, 600]);
    fire('wheel', { deltaY: -700 });
    assert.ok(rect(p)[2] > initialWidth);
    const wheelRect = rect(p);
    assert.equal(fire('wheel', { deltaY: -100, ctrlKey: true }).prevented, undefined);
    assert.deepEqual(rect(p), wheelRect);
    fire('pointerdown');
    assert.equal(captured.size, 1);
    fire('pointermove', { clientX: 100000, clientY: 100000 });
    const [x, y, w, h] = rect(p);
    assert.ok(x <= 1e-8 && y <= 1e-8 && x + w >= p.width && y + h >= p.height);
    fire('pointercancel');
    assert.equal(captured.size, 0);
    const cancelled = rect(p);
    fire('pointermove', { clientX: 0, clientY: 0 });
    assert.deepEqual(rect(p), cancelled);
    const keyboard = fire('keydown', { key: 'ArrowRight' });
    assert.equal(keyboard.prevented, true);
    assert.ok(rect(p)[0] < cancelled[0]);
    for (let i = 0; i < 30; i++) map.zoom(1);
    const maxWidth = rect(p)[2];
    map.zoom(1);
    assert.equal(rect(p)[2], maxWidth);
    fire('keydown', { key: '0' });
    assert.ok(rect(p)[0] >= 24 && rect(p)[1] >= 24);
    for (let i = 0; i < 30; i++) map.zoom(-1);
    const minWidth = rect(p)[2];
    map.zoom(-1);
    assert.equal(rect(p)[2], minWidth);
});

test('two touch pointers zoom and pan around their moving center', () => {
    const { p, fire, captured } = setup({ width: 400, height: 600 });
    const before = rect(p);
    fire('pointerdown', { pointerId: 1, clientX: 160, clientY: 320 });
    fire('pointerdown', { pointerId: 2, clientX: 260, clientY: 320 });
    fire('pointermove', { pointerId: 2, clientX: 360, clientY: 320 });
    close(rect(p)[2], before[2] * 2);
    assert.ok(rect(p)[0] > (400 - rect(p)[2]) / 2);
    fire('pointerup', { pointerId: 2 });
    assert.equal(captured.size, 1);
    const afterPinch = rect(p);
    fire('pointermove', { pointerId: 1, clientX: 150, clientY: 310 });
    close(rect(p)[0], afterPinch[0] - 10);
    close(rect(p)[1], afterPinch[1] - 10);
});

test('minimap fits its own host and restores full-map zoom and pan', () => {
    const { map, p, canvas, mini, fire, resize } = setup({ width: 400, height: 600 });
    for (let i = 0; i < 5; i++) map.zoom(1);
    fire('pointerdown');
    fire('pointermove', { clientX: 230, clientY: 340 });
    fire('pointerup');
    const fullRect = rect(p);
    map.setMinimap(true);
    assert.equal(canvas.container, mini);
    assert.deepEqual([p.width, p.height], [176, 220]);
    assert.equal(canvas.elt.attributes.tabindex, '-1');
    const miniRect = rect(p);
    map.zoom(1);
    map.fit();
    assert.deepEqual(rect(p), miniRect);
    map.setPosition({ x: 18, z: 34, floor: 6 });
    assert.match(p.images.at(-1)[0], /6floor_done_75\.png$/);
    const marker = p.markers.at(-1);
    close(marker[1], miniRect[0] + 18 * miniRect[2] / 57);
    close(marker[2], miniRect[1] + 34 * miniRect[3] / 93);
    mini.clientWidth = 160;
    mini.clientHeight = 200;
    resize();
    assert.deepEqual([p.width, p.height], [160, 200]);
    map.setMinimap(false);
    assert.deepEqual([p.width, p.height], [400, 600]);
    assert.deepEqual(rect(p), fullRect);
    assert.equal(canvas.elt.attributes.tabindex, '0');
});

test('a toggle during image preload initializes directly in the responsive minimap host', () => {
    const { map, p, canvas, mini } = setup({ deferred: true });
    map.setMinimap(true);
    map.setFloor(6);
    p.boot();
    assert.equal(canvas.container, mini);
    assert.deepEqual([p.width, p.height], [176, 220]);
    assert.match(p.images.at(-1)[0], /6floor_done_75\.png$/);
});


test('cross-floor routes reserve A and B for actual endpoints and outline escalator transfers', () => {
    for (const [from, to] of [['501', '611'], ['611', '501']]) {
        const { map, p } = setup();
        const route = findRoute(from, to);
        map.setRoute(route);
        for (const minimap of [false, true]) {
            map.setMinimap(minimap);
            for (const [index, segment] of route.segments.entries()) {
                map.setFloor(segment.floor);
                const otherFloor = route.segments[1 - index].floor;
                assert.deepEqual(p.labels, minimap ? [] : index === 0 ? ['A', `${otherFloor}F`] : [`${otherFloor}F`, 'B']);
                assert.deepEqual(p.markers.map(marker => marker[0]), index === 0 ? ['circle', 'square'] : ['square', 'square']);
                assert.deepEqual(p.markerStyles, index === 0 ? [
                    { fill: '#1e5b47', stroke: '#ffffff' },
                    { fill: '#ffffff', stroke: '#1e5b47' }
                ] : [
                    { fill: '#ffffff', stroke: '#1e5b47' },
                    { fill: '#a74c38', stroke: '#ffffff' }
                ]);
            }
        }
    }
});

function routeIsVisible(p) {
    for (const [x, y] of p.paths.at(-1)) {
        assert.ok(Number.isFinite(x) && Number.isFinite(y));
        assert.ok(x >= 12 && x <= p.width - 12, `route x ${x} outside ${p.width}`);
        assert.ok(y >= 12 && y <= p.height - 12, `route y ${y} outside ${p.height}`);
    }
}

test('fit route enlarges short paths with context and keeps longer path endpoints visible', () => {
    const { map, p } = setup();
    const fullWidth = rect(p)[2];
    map.setRoute(route);
    assert.equal(map.fitRoute(), true);
    const shortWidth = rect(p)[2];
    assert.ok(shortWidth > fullWidth);
    assert.ok(shortWidth <= fullWidth * 8 + 1e-8);
    routeIsVisible(p);
    map.setRoute(findRoute('501', '508'));
    map.fitRoute();
    assert.ok(rect(p)[2] < shortWidth);
    routeIsVisible(p);
    map.fit();
    close(rect(p)[2], fullWidth);
});

test('fit route handles one point and rejects empty or irrelevant-floor routes without moving the view', () => {
    const { map, p } = setup();
    assert.equal(map.fitRoute(), false);
    map.setRoute(findRoute('501', '501'));
    assert.equal(map.fitRoute(), true);
    routeIsVisible(p);
    assert.ok(rect(p).every(Number.isFinite));
    map.setFloor(6);
    const emptyFloor = rect(p);
    assert.equal(map.fitRoute(), false);
    assert.deepEqual(rect(p), emptyFloor);
    map.setRoute(null);
    assert.equal(map.fitRoute(), false);
    map.setRoute({ segments: [{ floor: 6, path: [] }] });
    assert.equal(map.fitRoute(), false);
});

test('route framing follows container changes until the user pans or zooms', () => {
    const { map, p, full, resize, fire } = setup();
    map.setRoute(findRoute('501', '508'));
    map.fitRoute();
    full.clientWidth = 360;
    full.clientHeight = 480;
    resize();
    assert.deepEqual([p.width, p.height], [360, 480]);
    routeIsVisible(p);
    map.zoom(1);
    const manualZoom = rect(p);
    resize();
    assert.deepEqual(rect(p), manualZoom);
    map.fitRoute();
    fire('pointerdown');
    fire('pointermove', { clientX: 220, clientY: 300 });
    fire('pointerup');
    const manualPan = rect(p);
    resize();
    assert.deepEqual(rect(p), manualPan);
    map.fit();
    resize();
    assert.ok(rect(p)[0] >= 24 && rect(p)[1] >= 24);
});

test('route framing survives preload and minimap transitions on the current route floor', () => {
    const { map, p } = setup({ deferred: true, width: 400, height: 600 });
    map.setRoute(findRoute('501', '611'));
    assert.equal(map.fitRoute(), true);
    p.boot();
    routeIsVisible(p);
    const routeWidth = rect(p)[2];
    map.fit();
    assert.ok(routeWidth > rect(p)[2]);
    map.fitRoute();
    map.setMinimap(true);
    const miniRect = rect(p);
    assert.equal(map.fitRoute(), false);
    assert.deepEqual(rect(p), miniRect);
    map.setPosition({ x: 23, z: 37, floor: 6 });
    map.setMinimap(false);
    assert.deepEqual([p.width, p.height], [400, 600]);
    assert.match(p.images.at(-1)[0], /6floor_done_75\.png$/);
    routeIsVisible(p);
});

test('route framing leaves room-label context above and the lower control strip below', () => {
    for (const [width, height, controlBottom] of [[341, 506, 12], [400, 201, 8]]) {
        const { map, p } = setup({ width, height });
        map.setRoute(findRoute('611', 'Elevator · 6F'));
        map.setFloor(6);
        map.fitRoute();
        routeIsVisible(p);
        const path = p.paths.at(-1);
        assert.ok(path[0][1] >= Math.min(80, height / 4));
        const controlTop = height - controlBottom - 54;
        for (const [, y] of path) assert.ok(y + 12 < controlTop, `marker ${y} behind lower controls at ${controlTop}`);
    }
});

test('one-point room routes retain surrounding room context instead of using maximum zoom', () => {
    const { map, p } = setup({ width: 341, height: 506 });
    map.setRoute(findRoute('611', '611'));
    map.setFloor(6);
    const fullWidth = rect(p)[2];
    map.fitRoute();
    const [x, y, w, h] = rect(p);
    assert.ok(w < fullWidth * 8);
    for (const [column, row] of [[10.5, 22.5], [22.5, 38.5]]) {
        const px = x + column * w / 57;
        const py = y + row * h / 93;
        assert.ok(px >= 12 && px <= p.width - 12);
        assert.ok(py >= 12 && py <= p.height - 12);
    }
});

test('fit route keeps endpoints clear of map controls on the smallest supported phone', () => {
    for (const [from, to, floor] of [['Female Toilet · 5F', '505', 5], ['Female Toilet · 6F', '606', 6]]) {
        const { map, p, fire } = setup({ width: 294, height: 380 });
        map.setRoute(findRoute(from, to));
        map.setFloor(floor);
        map.fitRoute();
        routeIsVisible(p);
        const controls = [
            { left: 236, top: 187, right: 282, bottom: 368 },
            { left: 12, top: 314, right: 114, bottom: 368 }
        ];
        for (const marker of p.markers) {
            const [kind, x, y, diameter] = marker;
            const left = kind === 'circle' ? x - diameter / 2 : x;
            const top = kind === 'circle' ? y - diameter / 2 : y;
            for (const control of controls) {
                assert.ok(left + diameter <= control.left || left >= control.right
                    || top + diameter <= control.top || top >= control.bottom,
                `${from} to ${to}: endpoint overlaps map controls`);
            }
        }
        fire('pointerdown');
        fire('pointermove', { clientX: 10000, clientY: 10000 });
        fire('pointerup');
        const [x, y, w, h] = rect(p);
        assert.ok(Math.abs(x - (p.width - w) / 2) <= Math.max(0, (w - p.width) / 2) + 1e-8);
        assert.ok(Math.abs(y - (p.height - h) / 2) <= Math.max(0, (h - p.height) / 2) + 1e-8);
    }
});
