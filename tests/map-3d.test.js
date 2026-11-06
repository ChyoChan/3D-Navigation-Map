import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const moduleUrl = new URL('../app/src/map-3d.js', import.meta.url);
const source = readFileSync(moduleUrl, 'utf8')
  .replace(/^import .*;\n/gm, '')
  .replace('export async function', 'async function')
  .replace('import.meta.url', JSON.stringify(moduleUrl.href));

function environment(loadError) {
  class Events {
    listeners = new Map();
    attributes = {};
    setAttribute(name, value) { this.attributes[name] = value; }
    setPointerCapture(id) { this.capturedPointer = id; }
    addEventListener(name, listener) {
      const listeners = this.listeners.get(name) || [];
      listeners.push(listener);
      this.listeners.set(name, listeners);
    }
    emit(name, event = {}) {
      for (const listener of this.listeners.get(name) || []) listener(event);
    }
  }
  class Vector {
    constructor(x = 0, y = 0, z = 0) { this.set(x, y, z); }
    set(x, y, z) { Object.assign(this, { x, y, z }); }
  }
  class Object3D extends Events {
    position = new Vector();
    rotation = { x: 0, y: 0, z: 0, order: 'XYZ' };
    children = [];
    add(...children) { this.children.push(...children); }
    clear() { this.children = []; }
    lookAt(...point) { this.target = point; }
    translateX(value) { this.position.x += value; }
    translateY(value) { this.position.y += value; }
    translateZ(value) { this.position.z += value; }
    updateProjectionMatrix() {}
  }
  const frames = new Map();
  const scenes = [];
  const renderers = [];
  const controls = [];
  const observers = [];
  const geometries = [];
  const materials = [];
  let nextFrame = 0;
  let loads = 0;
  const window = Object.assign(new Events(), {
    innerWidth: 1000, innerHeight: 800, devicePixelRatio: 1
  });
  const document = new Events();
  const container = Object.assign(new Events(), {
    clientWidth: 800, clientHeight: 600, children: [],
    appendChild(child) { this.children.push(child); }
  });
  const THREE = {
    WebGLRenderer: class {
      domElement = new Events();
      constructor() { renderers.push(this); }
      setClearColor() {}
      setPixelRatio(ratio) { this.pixelRatio = ratio; }
      setSize(width, height) { this.size = [width, height]; }
      render(scene, camera) { this.camera = camera; }
      dispose() { this.disposed = true; }
    },
    Scene: class extends Object3D { constructor() { super(); scenes.push(this); } },
    PerspectiveCamera: Object3D,
    AmbientLight: Object3D,
    PointLight: Object3D,
    Group: Object3D,
    Vector3: Vector,
    Clock: class { getDelta() { return 0.016; } },
    ConeGeometry: class {
      constructor(...parameters) { this.parameters = parameters; geometries.push(this); }
    },
    CurvePath: class {
      curves = [];
      add(curve) { this.curves.push(curve); }
    },
    LineCurve3: class {
      constructor(v1, v2) { Object.assign(this, { v1, v2 }); }
    },
    TubeGeometry: class {
      constructor(curve, segments, radius, radialSegments, closed) {
        Object.assign(this, { curve, segments, radius, radialSegments, closed });
        geometries.push(this);
      }
      dispose() { this.disposed = true; }
    },
    MeshBasicMaterial: class {
      constructor(options) { Object.assign(this, options); materials.push(this); }
    },
    Mesh: class extends Object3D {
      constructor(geometry, material) { super(); Object.assign(this, { geometry, material }); }
      rotateX(value) { this.rotationX = value; }
    }
  };
  const context = {
    THREE, window, document, URL,
    ResizeObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe(target) { this.target = target; }
    },
    GLTFLoader: class {
      async loadAsync(url) {
        loads++;
        assert.equal(url, new URL('../app/assets/maps/56_16.0.gltf', import.meta.url).href);
        if (loadError) throw loadError;
        return { scene: new Object3D() };
      }
    },
    PointerLockControls: class extends Events {
      isLocked = false;
      constructor(camera) { super(); this.camera = camera; controls.push(this); }
      lock() { this.isLocked = true; }
      unlock() { this.isLocked = false; this.emit('unlock'); }
    },
    requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); }
  };
  const createMap3D = vm.runInNewContext(`${source}\ncreateMap3D;`, context);
  return {
    createMap3D, container, controls, document, window, frames, scenes, observers,
    renderers, geometries, materials, get loads() { return loads; },
    tick() {
      const [id, callback] = frames.entries().next().value;
      frames.delete(id);
      callback();
    }
  };
}

const route = {
  segments: [
    { floor: 5, path: [{ x: 27, y: 56 }, { x: 27, y: 52 }] },
    { floor: 6, path: [{ x: 23, y: 37 }, { x: 4, y: 56 }] }
  ]
};

test('thin 3D routes preserve calibration and release replaced path geometries', async () => {
  const env = environment();
  const map = await env.createMap3D(env.container, () => {});
  const group = env.scenes[0].children.at(-1);
  map.setRoute(route);
  assert.equal(group.children.length, 5, 'two floor paths, one escalator path and two endpoints');
  const [floor5, floor6, escalator, start, end] = group.children;
  assert.deepEqual({ ...floor5.geometry.curve.curves[0].v1 }, { x: 27, y: -0.4, z: 56 });
  assert.deepEqual({ ...floor6.geometry.curve.curves[0].v1 }, { x: 23, y: 5.2, z: 37 });
  const slope = escalator.geometry.curve.curves;
  assert.equal(slope.length, 16);
  assert.deepEqual({ ...slope[0].v1 }, { x: 23, y: 5.2, z: 37 });
  assert.deepEqual({ ...slope[0].v2 }, { x: 23, y: 5.4, z: 38 });
  assert.ok(Math.abs(slope.at(-1).v1.x - 26.1) < 1e-10);
  assert.ok(Math.abs(slope.at(-1).v1.y + 0.2) < 1e-10);
  assert.equal(slope.at(-1).v1.z, 52);
  assert.deepEqual({ ...slope.at(-1).v2 }, { x: 27, y: -0.4, z: 52 });
  for (const path of [floor5, floor6, escalator]) {
    assert.equal(path.geometry.radius, 0.05);
    assert.equal(path.geometry.radialSegments, 6);
    assert.equal(path.material.color, 0x2f7a62);
  }
  assert.deepEqual(start.geometry.parameters, [0.12, 0.35, 3]);
  assert.equal(start.geometry, end.geometry);
  assert.equal(start.material.color, 0x1e5b47);
  assert.equal(end.material.color, 0xa74c38);
  assert.ok(Math.abs(start.position.y - (-0.4 + 0.32)) < 1e-10);
  const replaced = [floor5.geometry, floor6.geometry, escalator.geometry];
  const endpointGeometry = start.geometry;
  map.setRoute(route);
  assert.ok(replaced.every(geometry => geometry.disposed));
  assert.equal(group.children.length, 5);
  assert.equal(group.children.at(-1).geometry, endpointGeometry);
  assert.equal(env.materials.length, 3);
  const current = group.children.slice(0, 3).map(path => path.geometry);
  map.setRoute(null);
  assert.ok(current.every(geometry => geometry.disposed));
  assert.equal(endpointGeometry.disposed, undefined);
  assert.equal(group.children.length, 0);
});

test('reset view enters the route corridor, faces ahead and clears held movement', async () => {
  const env = environment();
  const positions = [];
  const map = await env.createMap3D(env.container, position => positions.push(position));
  const camera = env.controls[0].camera;
  map.setRoute(route);
  assert.deepEqual({ ...camera.position }, { x: 27, y: 0.6, z: 52 });
  assert.deepEqual(camera.target, [27, 0.6, 48]);
  map.setActive(true);
  map.setMovement('forward', true);
  env.tick();
  assert.ok(camera.position.z < 52);
  map.resetView();
  assert.deepEqual({ ...camera.position }, { x: 27, y: 0.6, z: 52 });
  assert.deepEqual(camera.target, [27, 0.6, 48]);
  assert.deepEqual({ ...positions.at(-1) }, { x: 27, y: 0.6, z: 52, floor: 5 });
  env.tick();
  assert.equal(camera.position.z, 52, 'reset releases the held screen control');
  assert.equal(env.frames.size, 1);
  const reverse = { segments: [
    { floor: 6, path: [{ x: 4, y: 56 }, { x: 23, y: 37 }] },
    { floor: 5, path: [{ x: 27, y: 52 }, { x: 27, y: 56 }] }
  ] };
  map.setRoute(reverse);
  assert.deepEqual({ ...camera.position }, { x: 23, y: 6.2, z: 37 });
  assert.deepEqual(camera.target, [42, 6.2, 18]);
  camera.position.set(20, 10, 20);
  map.resetView();
  assert.deepEqual({ ...camera.position }, { x: 23, y: 6.2, z: 37 });
  assert.equal(positions.at(-1).floor, 6);
  map.setRoute(null);
  map.resetView();
  assert.deepEqual({ ...camera.position }, { x: 30, y: 15, z: 36 });
  assert.deepEqual(camera.target, [27, -0.4, 56]);
  map.setActive(false);
});

test('single-point routes use the overview and escalator starts face the transfer', async () => {
  const env = environment();
  const map = await env.createMap3D(env.container, () => {});
  const camera = env.controls[0].camera;
  const group = env.scenes[0].children.at(-1);
  map.setRoute({ segments: [{ floor: 5, path: [{ x: 27, y: 56 }] }] });
  assert.equal(group.children.length, 2);
  assert.deepEqual(camera.target, [27, -0.4, 56]);
  camera.position.set(30, 8, 20);
  map.resetView();
  assert.deepEqual({ ...camera.position }, { x: 30, y: 15, z: 36 });
  map.setRoute({ segments: [
    { floor: 5, path: [{ x: 27, y: 52 }] },
    { floor: 6, path: [{ x: 23, y: 37 }, { x: 23, y: 36 }] }
  ] });
  assert.ok(Math.abs(camera.target[0] - 26.1) < 1e-10);
  assert.equal(camera.target[1], camera.position.y);
  assert.equal(camera.target[2], 52);
});

test('a classroom door route starts two path steps ahead while the origin marker stays calibrated', async () => {
  const env = environment();
  const map = await env.createMap3D(env.container, () => {});
  const camera = env.controls[0].camera;
  const path = [{ x: 16, y: 30 }, { x: 17, y: 30 }, { x: 18, y: 31 }, { x: 18, y: 32 }];
  map.setRoute({ segments: [{ floor: 6, path }] });
  assert.deepEqual({ ...camera.position }, { x: 18, y: 6.2, z: 31 });
  assert.deepEqual(camera.target, [18, 6.2, 32]);
  const group = env.scenes[0].children.at(-1);
  assert.deepEqual({ ...group.children.at(-2).position }, { x: 16, y: 5.2 + 0.32, z: 30 });
  assert.deepEqual({ ...group.children[0].geometry.curve.curves[0].v1 }, { x: 16, y: 5.2, z: 30 });
  camera.position.set(50, 10, 50);
  map.resetView();
  assert.deepEqual({ ...camera.position }, { x: 18, y: 6.2, z: 31 });
  assert.deepEqual(camera.target, [18, 6.2, 32]);
});

test('a same-point overview retains the route floor until camera movement begins', async () => {
  const env = environment();
  const positions = [];
  const map = await env.createMap3D(env.container, position => positions.push(position));
  const singleton = floor => ({ segments: [{ floor, path: [{ x: 27, y: 56 }] }] });
  map.setRoute(singleton(5));
  map.setActive(true);
  assert.equal(env.controls[0].camera.position.y, 15, 'the clear overview pose remains unchanged');
  assert.equal(positions.at(-1).floor, 5);
  for (let i = 0; i < 3; i++) {
    map.resetView();
    env.tick();
    assert.equal(positions.at(-1).floor, 5);
    assert.equal(env.frames.size, 1);
  }
  map.setMovement('forward', true);
  env.tick();
  assert.equal(positions.at(-1).floor, 6, 'movement resumes the physical camera-height floor');
  map.setMovement('forward', false);
  map.resetView();
  assert.equal(positions.at(-1).floor, 5);
  map.setRoute(singleton(6));
  assert.equal(positions.at(-1).floor, 6);
  map.setRoute(null);
  map.resetView();
  assert.equal(positions.at(-1).floor, 6, 'no-route overview uses its actual camera height');
  map.setActive(false);
  map.setRoute(singleton(5));
  map.resetView();
  map.setActive(true);
  assert.equal(positions.at(-1).floor, 5);
  assert.equal(env.frames.size, 1);
  assert.equal(env.loads, 1);
  assert.equal(env.container.children.length, 1);
  map.setActive(false);
});

test('repeated toggles keep one animation loop and unlock clears held keys', async () => {
  const env = environment();
  const positions = [];
  const map = await env.createMap3D(env.container, position => positions.push(position));
  map.setRoute(route);
  map.setActive(true);
  map.setActive(true);
  assert.equal(env.frames.size, 1);
  env.container.children[0].emit('click');
  env.document.emit('keydown', { code: 'KeyW', preventDefault() {} });
  env.tick();
  const camera = env.controls[0].camera;
  assert.ok(camera.position.z < 52);
  env.controls[0].unlock();
  env.controls[0].lock();
  const z = camera.position.z;
  env.tick();
  assert.equal(camera.position.z, z);
  map.setActive(false);
  assert.equal(env.frames.size, 0);
  assert.equal(env.controls[0].isLocked, false);
  map.setActive(true);
  assert.equal(env.frames.size, 1);
  assert.equal(env.loads, 1);
  assert.equal(env.container.children.length, 1);
  assert.equal(env.document.listeners.get('keydown').length, 1);
  assert.equal(positions.at(-1).floor, 5);
  camera.position.y = 5.2;
  env.tick();
  assert.equal(positions.at(-1).floor, 6);
  map.setActive(false);
});

test('model load failure rejects and releases its renderer before retry', async () => {
  const error = new Error('Model unavailable');
  const env = environment(error);
  await assert.rejects(env.createMap3D(env.container, () => {}), error);
  assert.equal(env.renderers[0].disposed, true);
  assert.equal(env.container.children.length, 0);
  assert.equal(env.frames.size, 0);
  assert.equal(env.document.listeners.size, 0);
});


test('touch and pen look do not request pointer lock and pitch stays bounded', async () => {
  const env = environment();
  const map = await env.createMap3D(env.container, () => {});
  map.setActive(true);
  const canvas = env.container.children[0];
  const camera = env.controls[0].camera;
  assert.equal(canvas.attributes.tabindex, '0');
  assert.match(canvas.attributes['aria-label'], /Drag to look/);
  assert.equal(camera.rotation.order, 'YXZ');
  canvas.emit('pointerdown', { pointerType: 'touch', pointerId: 1, clientX: 100, clientY: 80 });
  assert.equal(canvas.capturedPointer, 1);
  canvas.emit('pointerdown', { pointerType: 'touch', pointerId: 2, clientX: 30, clientY: 30 });
  canvas.emit('pointermove', { pointerId: 2, clientX: 80, clientY: 80 });
  assert.equal(camera.rotation.y, 0);
  canvas.emit('pointermove', { pointerId: 1, clientX: 140, clientY: 50 });
  assert.equal(camera.rotation.y, -0.08);
  assert.equal(camera.rotation.x, 0.06);
  canvas.emit('pointermove', { pointerId: 1, clientX: 140, clientY: -100000 });
  assert.equal(camera.rotation.x, Math.PI / 2 - 0.01);
  canvas.emit('click');
  assert.equal(env.controls[0].isLocked, false);
  canvas.emit('pointerup', { pointerId: 1 });
  canvas.emit('pointermove', { pointerId: 1, clientX: 300, clientY: 50 });
  assert.equal(camera.rotation.y, -0.08);
  canvas.emit('pointerdown', { pointerType: 'pen', pointerId: 3, clientX: 80, clientY: 40 });
  canvas.emit('pointermove', { pointerId: 3, clientX: 90, clientY: 40 });
  assert.equal(camera.rotation.y, -0.1);
  canvas.emit('pointercancel', { pointerId: 3 });
  canvas.emit('pointermove', { pointerId: 3, clientX: 400, clientY: 40 });
  assert.equal(camera.rotation.y, -0.1);
  map.setActive(false);
});

test('screen controls move all six directions without pointer lock and release cleanly', async () => {
  const env = environment();
  const map = await env.createMap3D(env.container, () => {});
  const camera = env.controls[0].camera;
  map.setMovement('forward', true);
  map.setActive(true);
  env.tick();
  assert.equal(camera.position.z, 36, 'inactive presses cannot stick');
  for (const [direction, axis, sign] of [
    ['forward', 'z', -1], ['back', 'z', 1], ['left', 'x', -1],
    ['right', 'x', 1], ['up', 'y', 1], ['down', 'y', -1]
  ]) {
    const before = camera.position[axis];
    map.setMovement(direction, true);
    env.tick();
    assert.ok((camera.position[axis] - before) * sign > 0, direction);
    map.setMovement(direction, false);
    const released = { ...camera.position };
    env.tick();
    assert.deepEqual({ ...camera.position }, released, `released ${direction}`);
  }
  assert.equal(env.controls[0].isLocked, false);
  map.setMovement('forward', true);
  env.window.emit('blur');
  const blurred = camera.position.z;
  env.tick();
  assert.equal(camera.position.z, blurred);
  map.setMovement('forward', true);
  env.container.children[0].emit('pointercancel', { pointerId: 1 });
  env.tick();
  assert.equal(camera.position.z, blurred);
  map.setMovement('forward', true);
  map.setActive(false);
  map.setActive(true);
  env.tick();
  assert.equal(camera.position.z, blurred);
  map.setMovement('constructor', true);
  env.tick();
  assert.equal(camera.position.z, blurred);
  map.setActive(false);
});

test('renderer follows container resize and ignores hidden dimensions', async () => {
  const env = environment();
  env.window.devicePixelRatio = 3;
  const map = await env.createMap3D(env.container, () => {});
  const renderer = env.renderers[0];
  assert.equal(renderer.pixelRatio, 2);
  assert.deepEqual(renderer.size, [800, 600]);
  assert.equal(env.observers.length, 1);
  assert.equal(env.observers[0].target, env.container);
  env.container.clientWidth = 355;
  env.container.clientHeight = 420;
  env.observers[0].callback();
  assert.deepEqual(renderer.size, [355, 420]);
  assert.equal(env.controls[0].camera.aspect, 355 / 420);
  env.container.clientWidth = 0;
  env.container.clientHeight = 0;
  env.observers[0].callback();
  assert.deepEqual(renderer.size, [355, 420]);
  env.container.clientWidth = 300;
  env.container.clientHeight = 600;
  map.setActive(true);
  assert.deepEqual(renderer.size, [300, 600]);
  assert.equal(env.frames.size, 1);
  map.setActive(false);
});
