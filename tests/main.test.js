import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

class Element {
    hidden = false;
    disabled = false;
    value = '';
    textContent = '';
    attributes = {};
    dataset = {};
    children = [];
    listeners = new Map();
    classes = new Set();
    classList = {
        toggle: (name, force) => force ? this.classes.add(name) : this.classes.delete(name),
        contains: name => this.classes.has(name)
    };
    setAttribute(key, value) { this.attributes[key] = value; }
    getAttribute(key) { return this.attributes[key] ?? null; }
    appendChild(child) { this.children.push(child); return child; }
    replaceChildren(...children) { this.children = children; }
    focus() { this.focused = true; globalThis.document.activeElement = this; }
    setPointerCapture(id) { this.capturedPointer = id; }
    addEventListener(event, handler) {
        const handlers = this.listeners.get(event) ?? [];
        handlers.push(handler);
        this.listeners.set(event, handlers);
    }
    async fire(name, properties = {}) {
        const event = { ...properties, preventDefault() { this.defaultPrevented = true; } };
        for (const handler of this.listeners.get(name) ?? []) await handler(event);
        return event;
    }
}

async function setup(t, { mobile = true } = {}) {
    const directory = await mkdtemp(path.join(tmpdir(), 'campus-main-test-'));
    const elements = new Map();
    const element = id => {
        if (!elements.has(id)) elements.set(id, new Element());
        return elements.get(id);
    };
    for (const id of ['errormessage', 'route-summary', 'infomsg', 'threedcontainer', 'model-loading']) {
        element(id).hidden = true;
    }
    element('edit-route').setAttribute('aria-expanded', 'true');
    const buttons = ['forward', 'back', 'left', 'right', 'up', 'down'].map(move => {
        const button = new Element();
        button.dataset.move = move;
        return button;
    });
    const drawn = {};
    const draws = [];
    const activations = [];
    const threeDRoutes = [];
    const movements = [];
    let resetCount = 0;
    let createCount = 0;
    let onPosition;
    const map3D = {
        setRoute: route => threeDRoutes.push(route),
        setActive: active => activations.push(active),
        setMovement: (direction, pressed) => movements.push([direction, pressed]),
        resetView: () => { resetCount++; }
    };
    let load = async () => map3D;
    globalThis.window = { matchMedia: () => ({ matches: mobile }) };
    globalThis.document = {
        getElementById: element,
        createElement: () => new Element(),
        querySelectorAll: selector => {
            assert.equal(selector, '[data-move]');
            return buttons;
        }
    };
    globalThis.__mainMapFactory = () => Object.fromEntries(
        ['setRoute', 'setFloor', 'setMinimap', 'setPosition', 'zoom', 'fit', 'fitRoute'].map(name =>
            [name, value => {
                drawn[name] = value;
                draws.push([name, value]);
                if (name === 'fitRoute') return Boolean(drawn.setRoute?.segments.some(segment => segment.floor === drawn.setFloor));
            }])
    );
    globalThis.__mainCreateMap3D = async (_container, callback) => {
        createCount++;
        onPosition = callback;
        return load();
    };
    t.after(async () => {
        delete globalThis.__mainMapFactory;
        delete globalThis.__mainCreateMap3D;
        delete globalThis.document;
        delete globalThis.window;
        await rm(directory, { recursive: true, force: true });
    });
    const mock3DPath = path.join(directory, 'map-3d.mjs');
    await writeFile(mock3DPath, 'export const createMap3D = (...args) => globalThis.__mainCreateMap3D(...args);\n');
    const source = (await readFile(new URL('../app/src/main.js', import.meta.url), 'utf8'))
        .replace("'./navigation.js'", JSON.stringify(new URL('../app/src/navigation.js', import.meta.url).href))
        .replace("import { createMap2D } from './map-2d.js';", 'const createMap2D = globalThis.__mainMapFactory;')
        .replace("import('./map-3d.js')", `import(${JSON.stringify(pathToFileURL(mock3DPath).href)})`);
    const mainPath = path.join(directory, 'main.mjs');
    await writeFile(mainPath, source);
    await import(pathToFileURL(mainPath).href);
    return {
        element, drawn, draws, buttons, activations, threeDRoutes, movements, map3D,
        get createCount() { return createCount; },
        get resetCount() { return resetCount; },
        setLoad(value) { load = value; },
        position(value) { onPosition(value); },
        async submit(from, to) {
            element('start_input').value = from;
            element('end_input').value = to;
            await element('route-form').fire('submit');
        }
    };
}

test('route summaries, floor browsing and validation retain the submitted route', async t => {
    const env = await setup(t);
    const { element, drawn, draws } = env;
    assert.ok(element('destinations').children.some(option => option.value === '611'));
    assert.equal(element('fit-route').disabled, true);
    assert.ok(element('destinations').children.some(option => option.value === 'Elevator · 6F'));
    assert.ok(!element('destinations').children.some(option => option.value === 'Male Toilet'));
    await env.submit('501', 'Male Toilet · 5F');
    const submitted = drawn.setRoute;
    assert.deepEqual(submitted.segments.map(segment => segment.floor), [5]);
    assert.equal(element('route-summary').hidden, false);
    assert.equal(element('empty-state').hidden, true);
    assert.equal(element('route-description').textContent, '501 to Male Toilet · 5F');
    assert.equal(element('infomsg').hidden, true);
    assert.equal(element('same-floor-note').hidden, false);
    assert.equal(element('route-steps').children[0].attributes['aria-pressed'], 'true');
    assert.match(element('route-announcement').textContent, /Floor 5/);
    assert.equal(element('fit-route').disabled, false);
    assert.equal(draws.filter(([name]) => name === 'fitRoute').length, 1);
    assert.equal(draws.filter(([name]) => name === 'fit').length, 0);

    element('end_input').value = 'unsubmitted edit';
    await element('map_6f').fire('click');
    assert.equal(drawn.setRoute, submitted);
    assert.equal(drawn.setFloor, 6);
    assert.equal(element('fit-route').disabled, true);
    assert.equal(draws.filter(([name]) => name === 'fit').length, 1, 'an irrelevant floor falls back to the full plan');
    assert.equal(element('route-description').textContent, '501 to Male Toilet · 5F');
    await element('route-form').fire('submit');
    assert.equal(drawn.setRoute, null);
    assert.equal(element('route-summary').hidden, true);
    assert.equal(element('errormessage').hidden, false);
    assert.equal(element('start_input').attributes['aria-invalid'], 'false');
    assert.equal(element('end_input').attributes['aria-invalid'], 'true');
    assert.equal(element('end_input').attributes['aria-describedby'], 'destination-hint error-text');
    assert.equal(element('end_input').focused, true);
    await env.submit('constructor', '501');
    assert.equal(drawn.setRoute, null);
    assert.equal(element('start_input').attributes['aria-invalid'], 'true');
    assert.equal(element('start_input').focused, true);
    assert.match(element('error-text').textContent, /starting point/);

    await env.submit('611', '501');
    const crossFloor = drawn.setRoute;
    assert.deepEqual(crossFloor.segments.map(segment => segment.floor), [6, 5]);
    assert.equal(drawn.setFloor, 6);
    assert.equal(element('floor-label').textContent, 'Floor 6');
    assert.equal(element('infomsg').hidden, false);
    assert.equal(element('same-floor-note').hidden, true);
    assert.equal(element('errormessage').hidden, true);
    assert.equal(element('start_input').attributes['aria-invalid'], 'false');
    assert.equal(element('start_input').attributes['aria-describedby'], 'destination-hint');
    const [first, second] = element('route-steps').children;
    assert.deepEqual([first.textContent, second.textContent], ['6F', '5F']);
    const beforeStep = draws.filter(([name]) => name === 'fitRoute').length;
    await second.fire('click');
    assert.equal(draws.filter(([name]) => name === 'fitRoute').length, beforeStep + 1);
    assert.equal(drawn.setRoute, crossFloor);
    assert.equal(drawn.setFloor, 5);
    assert.equal(first.attributes['aria-pressed'], 'false');
    assert.equal(second.attributes['aria-pressed'], 'true');
    assert.equal(element('switch2d').attributes['aria-pressed'], 'true');
    const routeFits = draws.filter(([name]) => name === 'fitRoute').length;
    assert.equal(element('fit-route').disabled, false);
    await element('fit-route').fire('click');
    assert.equal(draws.filter(([name]) => name === 'fitRoute').length, routeFits + 1);
    const fits = draws.filter(([name]) => name === 'fit').length;
    await element('fit-map').fire('click');
    assert.equal(draws.filter(([name]) => name === 'fit').length, fits + 1);
    await element('zoomin').fire('click');
    assert.equal(drawn.zoom, 1);
    await element('zoomout').fire('click');
    assert.equal(drawn.zoom, -1);
});

test('3D load failure permits retry and successful initialization is reused', async t => {
    const env = await setup(t);
    const { element, drawn, activations } = env;
    await env.submit('501', '601');
    await element('reset-view').fire('click');
    assert.equal(env.resetCount, 0, 'reset is safe before the model has loaded');
    env.setLoad(async () => { throw new Error('Test model load failure'); });
    const log = console.error;
    console.error = () => {};
    try { await element('switchmap').fire('click'); } finally { console.error = log; }
    assert.equal(env.createCount, 1);
    assert.equal(element('errormessage').hidden, false);
    assert.equal(element('switchmap').disabled, false);
    assert.equal(element('switchmap').attributes['aria-busy'], 'false');
    assert.equal(element('model-loading').hidden, true);
    assert.equal(element('three-d-label').textContent, '3D view');
    assert.deepEqual(activations, []);

    env.setLoad(async () => env.map3D);
    await element('switchmap').fire('click');
    assert.equal(drawn.setMinimap, true);
    assert.equal(element('threedcontainer').hidden, false);
    assert.equal(element('twodmapcontainer').hidden, true);
    assert.equal(element('floor-controls').hidden, true);
    assert.equal(element('zoom-controls').hidden, true);
    assert.equal(element('switchmap').attributes['aria-pressed'], 'true');
    assert.equal(env.threeDRoutes.at(-1), drawn.setRoute);
    await element('reset-view').fire('click');
    assert.equal(env.resetCount, 1);
    env.position({ x: 23, y: 6, z: 37, floor: 6 });
    assert.equal(drawn.setPosition.floor, 6);
    assert.equal(element('floor-label').textContent, 'Floor 6');
    assert.equal(element('minimap-floor').textContent, '6F');
    await element('switchmap').fire('click');
    assert.deepEqual(activations, [true]);
    await element('switch2d').fire('click');
    assert.equal(drawn.setMinimap, false);
    assert.equal(element('threedcontainer').hidden, true);
    assert.equal(element('floor-controls').hidden, false);
    assert.equal(element('switch2d').attributes['aria-pressed'], 'true');
    await element('switchmap').fire('click');
    assert.equal(env.createCount, 2, 'one failed load and one successful initialization');
    assert.deepEqual(activations, [true, false, true]);
});

test('returning to 2D while the model loads cannot switch back unexpectedly', async t => {
    const env = await setup(t);
    const { element } = env;
    let resolve;
    const pending = new Promise(done => { resolve = done; });
    env.setLoad(() => pending);
    const opening = element('switchmap').fire('click');
    assert.equal(element('switchmap').disabled, true);
    assert.equal(element('switchmap').attributes['aria-busy'], 'true');
    assert.equal(element('three-d-label').textContent, 'Loading…');
    assert.equal(element('model-loading').hidden, false);
    await element('switch2d').fire('click');
    assert.equal(element('model-loading').hidden, true);
    resolve(env.map3D);
    await opening;
    assert.equal(element('threedcontainer').hidden, true);
    assert.equal(element('twodmapcontainer').hidden, false);
    assert.equal(element('switchmap').attributes['aria-busy'], 'false');
    assert.equal(element('switchmap').disabled, false);
    assert.deepEqual(env.activations, []);
    await element('switchmap').fire('click');
    assert.equal(env.createCount, 1);
    assert.deepEqual(env.activations, [true]);
});

test('screen movement supports pointer cancellation, keyboard release and assistive clicks', async t => {
    const env = await setup(t);
    const { element, movements, buttons } = env;
    await buttons[0].fire('pointerdown', { pointerId: 1 });
    assert.deepEqual(movements, [], 'hidden controls cannot start inactive movement');
    await element('switchmap').fire('click');
    for (const button of buttons) {
        const down = await button.fire('pointerdown', { pointerId: 7 });
        assert.equal(down.defaultPrevented, true);
        assert.equal(button.capturedPointer, 7);
        assert.deepEqual(movements.at(-1), [button.dataset.move, true]);
        await button.fire('pointerup');
        assert.deepEqual(movements.at(-1), [button.dataset.move, false]);
    }
    const forward = buttons[0];
    for (const event of ['pointercancel', 'lostpointercapture', 'blur']) {
        await forward.fire('pointerdown', { pointerId: 2 });
        await forward.fire(event);
        assert.deepEqual(movements.at(-1), ['forward', false], event);
    }
    for (const key of [' ', 'Enter']) {
        assert.equal((await forward.fire('keydown', { key })).defaultPrevented, true);
        assert.deepEqual(movements.at(-1), ['forward', true]);
        assert.equal((await forward.fire('keyup', { key })).defaultPrevented, true);
        assert.deepEqual(movements.at(-1), ['forward', false]);
    }
    const count = movements.length;
    await forward.fire('keydown', { key: 'a' });
    await forward.fire('click', { detail: 1 });
    assert.equal(movements.length, count);
    await forward.fire('click', { detail: 0 });
    assert.deepEqual(movements.at(-1), ['forward', true]);
    await new Promise(resolve => setTimeout(resolve, 220));
    assert.deepEqual(movements.at(-1), ['forward', false]);
    await element('switch2d').fire('click');
    const inactiveCount = movements.length;
    await forward.fire('click', { detail: 0 });
    assert.equal(movements.length, inactiveCount);
    await new Promise(resolve => setTimeout(resolve, 220));
});


test('mobile route summary collapses only valid submissions and editing retains the route', async t => {
    const env = await setup(t);
    const { element, drawn } = env;
    assert.equal(element('route-planner').classList.contains('is-compact'), false);
    await env.submit('611', 'Elevator · 6F');
    const submitted = drawn.setRoute;
    assert.deepEqual(submitted.segments.map(segment => segment.floor), [6]);
    assert.equal(element('route-planner').classList.contains('is-compact'), true);
    assert.equal(element('edit-route').getAttribute('aria-expanded'), 'false');
    assert.equal(element('edit-route').textContent, 'Edit route');
    assert.equal(document.activeElement, element('edit-route'));
    await element('edit-route').fire('click');
    assert.equal(element('route-planner').classList.contains('is-compact'), false);
    assert.equal(element('edit-route').getAttribute('aria-expanded'), 'true');
    assert.equal(element('edit-route').textContent, 'Hide fields');
    assert.equal(document.activeElement, element('start_input'));
    assert.equal(element('start_input').value, '611');
    assert.equal(element('end_input').value, 'Elevator · 6F');
    assert.equal(drawn.setRoute, submitted);
    await element('edit-route').fire('click');
    assert.equal(element('route-planner').classList.contains('is-compact'), true);
    assert.equal(document.activeElement, element('edit-route'));
    for (const generic of ['Elevator', 'Male Toilet', 'Escalator']) {
        await env.submit('611', generic);
        assert.equal(drawn.setRoute, null, `${generic} must not bypass public destination validation`);
        assert.equal(element('route-planner').classList.contains('is-compact'), false);
        assert.equal(element('edit-route').getAttribute('aria-expanded'), 'true');
        assert.equal(element('end_input').getAttribute('aria-invalid'), 'true');
        assert.equal(element('errormessage').hidden, false);
        assert.equal(document.activeElement, element('end_input'));
        assert.match(element('error-text').textContent, /with its floor/);
    }
});

test('desktop submissions keep focus in the existing interaction instead of the compact edit control', async t => {
    const env = await setup(t, { mobile: false });
    const { element } = env;
    element('run').focus();
    await env.submit('501', '611');
    assert.equal(document.activeElement, element('run'));
    await element('edit-route').fire('click');
    assert.equal(document.activeElement, element('run'));
    assert.equal(element('start_input').value, '501');
    assert.equal(element('end_input').value, '611');
});
