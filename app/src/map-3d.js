import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export async function createMap3D(container, onPosition) {
  const renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xeeeeee);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  camera.rotation.order = 'YXZ';
  const modelUrl = new URL('../assets/maps/56_16.0.gltf', import.meta.url);
  let model;
  try {
    model = await new GLTFLoader().loadAsync(modelUrl.href);
  } catch (error) {
    renderer.dispose();
    throw error;
  }
  model.scene.position.set(0, -0.5, 0);
  scene.add(model.scene, new THREE.AmbientLight(0x707070, 1));
  const light = new THREE.PointLight(0xffffff, 1, 100);
  light.position.set(0, 50, 0);
  scene.add(light);
  renderer.domElement.setAttribute('aria-label', '3D campus map. Drag to look around, or click to use mouse look and WASD.');
  renderer.domElement.setAttribute('tabindex', '0');
  container.appendChild(renderer.domElement);

  const controls = new PointerLockControls(camera, renderer.domElement);
  const clock = new THREE.Clock();
  const velocity = new THREE.Vector3();
  const keys = new Set();
  const screenKeys = new Set();
  const directions = { forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', up: 'ControlLeft', down: 'ShiftLeft' };
  const movementKeys = new Set([
    'ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA',
    'ArrowRight', 'KeyD', 'ControlLeft', 'ShiftLeft'
  ]);
  const routeGroup = new THREE.Group();
  const cone = new THREE.ConeGeometry(0.12, 0.35, 3);
  const pathMaterial = new THREE.MeshBasicMaterial({ color: 0x2f7a62 });
  const green = new THREE.MeshBasicMaterial({ color: 0x1e5b47 });
  const red = new THREE.MeshBasicMaterial({ color: 0xa74c38 });
  const stairs = [];
  let stairX = 23;
  let stairY = 5.4;
  // Preserve the measured escalator slope in the original model.
  for (let z = 38; z < 53; z++) {
    if (z === 41 || z >= 50) stairY -= 0.2;
    else if (z > 40) stairY -= 0.6;
    if (z >= 41) stairX += 0.2;
    if (z === 52) stairX += 0.7;
    stairs.push(new THREE.Vector3(stairX, stairY, z));
  }
  scene.add(routeGroup);
  let active = false;
  let frameId;
  let drag = null;
  let pointerType = 'mouse';
  let currentRoute = null;
  let overviewFloor = null;

  function resetKeys() {
    keys.clear();
    screenKeys.clear();
    drag = null;
    velocity.set(0, 0, 0);
  }

  function resetCamera() {
    resetKeys();
    camera.position.set(30, 15, 36);
    camera.lookAt(27, -0.4, 56);
  }

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function notifyPosition() {
    const { x, y, z } = camera.position;
    onPosition({ x, y, z, floor: overviewFloor ?? (y >= 5.2 ? 6 : 5) });
  }

  function frame() {
    if (!active) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    if (controls.isLocked || screenKeys.size) {
      velocity.x *= 1 - 10 * delta;
      velocity.z *= 1 - 10 * delta;
      const held = key => keys.has(key) || screenKeys.has(key);
      velocity.x += (Number(held('KeyD') || held('ArrowRight'))
        - Number(held('KeyA') || held('ArrowLeft'))) * 100 * delta;
      velocity.z += (Number(held('KeyS') || held('ArrowDown'))
        - Number(held('KeyW') || held('ArrowUp'))) * 100 * delta;
      const vertical = Number(held('ControlLeft')) - Number(held('ShiftLeft'));
      // Keep the calibrated vertical speed stable when a frame takes over 10 ms.
      velocity.y += (vertical - velocity.y) * Math.min(1, 100 * delta);
      if (velocity.x || velocity.y || velocity.z) overviewFloor = null;
      camera.translateX(velocity.x * delta);
      camera.translateY(velocity.y * delta);
      camera.translateZ(velocity.z * delta);
      const { x, y, z } = camera.position;
      if (x < 1 || x > 55.8 || z < 1 || z > 89 || y < -9 || y > 18) {
        resetCamera();
      }
    }
    notifyPosition();
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(frame);
  }

  renderer.domElement.addEventListener('pointerdown', event => {
    pointerType = event.pointerType;
    if (!active || pointerType === 'mouse' || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    renderer.domElement.setPointerCapture(event.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (!active || !drag || event.pointerId !== drag.id) return;
    camera.rotation.y -= (event.clientX - drag.x) * 0.002;
    camera.rotation.x = Math.max(-Math.PI / 2 + 0.01,
      Math.min(Math.PI / 2 - 0.01, camera.rotation.x - (event.clientY - drag.y) * 0.002));
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  const stopLook = event => {
    if (drag?.id === event.pointerId) drag = null;
  };
  renderer.domElement.addEventListener('pointerup', stopLook);
  renderer.domElement.addEventListener('lostpointercapture', stopLook);
  renderer.domElement.addEventListener('pointercancel', resetKeys);
  renderer.domElement.addEventListener('click', () => {
    if (active && pointerType === 'mouse') controls.lock();
  });
  controls.addEventListener('unlock', resetKeys);
  window.addEventListener('blur', resetKeys);
  new ResizeObserver(resize).observe(container);
  document.addEventListener('keydown', event => {
    if (active && controls.isLocked && movementKeys.has(event.code)) {
      event.preventDefault();
      keys.add(event.code);
    }
  });
  document.addEventListener('keyup', event => keys.delete(event.code));
  resetCamera();
  resize();

  function addPath(points) {
    if (points.length < 2) return;
    const curve = new THREE.CurvePath();
    for (let i = 1; i < points.length; i++) {
      curve.add(new THREE.LineCurve3(points[i - 1], points[i]));
    }
    const geometry = new THREE.TubeGeometry(curve, points.length * 4, 0.05, 6, false);
    routeGroup.add(new THREE.Mesh(geometry, pathMaterial));
  }

  function addMarker(material, point, floor) {
    const marker = new THREE.Mesh(cone, material);
    marker.position.set(point.x, (floor === 5 ? -0.4 : 5.2) + 0.32, point.y);
    marker.rotateX(Math.PI);
    routeGroup.add(marker);
  }

  function resetView() {
    resetKeys();
    overviewFloor = null;
    if (currentRoute) {
      const first = currentRoute.segments[0];
      // Door coordinates can sit inside model walls; enter the corridor before looking ahead.
      const index = Math.min(2, first.path.length - 1);
      const point = first.path[index];
      const different = other => other.x !== point.x || other.y !== point.y;
      const next = first.path.slice(index + 1).find(different);
      const previous = first.path.slice(0, index).reverse().find(different);
      const transfer = first.floor === 5 ? stairs.at(-1) : stairs[0];
      const target = next ? { x: next.x, z: next.y }
        : previous ? { x: point.x * 2 - previous.x, z: point.y * 2 - previous.y }
          : currentRoute.segments.length > 1 ? transfer : null;
      if (target) {
        const eyeHeight = (first.floor === 5 ? -0.4 : 5.2) + 1;
        camera.position.set(point.x, eyeHeight, point.y);
        camera.lookAt(target.x, eyeHeight, target.z);
      } else {
        resetCamera();
        // An overview keeps the same-point route's floor until the user starts moving.
        overviewFloor = first.floor;
      }
    } else {
      resetCamera();
    }
    if (active) notifyPosition();
  }

  return {
    setMovement(direction, pressed) {
      if (!active || !Object.hasOwn(directions, direction)) return;
      if (pressed) screenKeys.add(directions[direction]);
      else screenKeys.delete(directions[direction]);
      if (!screenKeys.size && !controls.isLocked) velocity.set(0, 0, 0);
    },
    setActive(value) {
      if (active === value) return;
      active = value;
      if (active) {
        resize();
        clock.getDelta();
        notifyPosition();
        frameId = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(frameId);
        controls.unlock();
        resetKeys();
      }
    },
    setRoute(route) {
      for (const object of routeGroup.children) {
        if (object.geometry !== cone) object.geometry.dispose();
      }
      routeGroup.clear();
      currentRoute = route;
      overviewFloor = null;
      if (!route) return;
      const segments = route.segments;
      const first = segments[0];
      const last = segments.at(-1);
      for (const segment of segments) {
        const height = segment.floor === 5 ? -0.4 : 5.2;
        addPath(segment.path.map(point => new THREE.Vector3(point.x, height, point.y)));
      }
      if (first.floor !== last.floor) {
        addPath([
          new THREE.Vector3(23, 5.2, 37),
          ...stairs,
          new THREE.Vector3(27, -0.4, 52)
        ]);
      }
      addMarker(green, first.path[0], first.floor);
      addMarker(red, last.path.at(-1), last.floor);
      resetView();
    },
    resetView
  };
}
