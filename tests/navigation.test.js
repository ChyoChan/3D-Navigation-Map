import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { DESTINATIONS, findRoute } from '../app/src/navigation.js';

const archive = new URL('../archive/PKPD_Group_5/007_%20Project%20Deliverable/3D-Navigation-Map/', import.meta.url);
const inputs = {};
const noop = () => {};
const original = vm.createContext({
  console: { log: noop }, window: {},
  document: { getElementById: id => inputs[id] ??= { style: {}, addEventListener: noop } },
  dist: (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2),
  width: 1000, height: 1800,
  ...Object.fromEntries(['clear', 'image', 'noLoop', 'loop', 'noFill', 'stroke',
    'strokeWeight', 'beginShape', 'vertex', 'endShape', 'fill', 'noStroke', 'ellipse']
    .map(name => [name, noop])),
});
vm.runInContext(readFileSync(new URL('Node.js', archive), 'utf8'), original);
vm.runInContext(readFileSync(new URL('aStar_diagonal_final_path_only.js', archive), 'utf8'), original);
const originalDestinations = JSON.parse(vm.runInContext('JSON.stringify(roomSet)', original));

const walkable = new Map([5, 6].map(floor => {
  const cells = new Set();
  for (let x = 0; x < 57; x++) {
    for (let y = 0; y < 93; y++) {
      const node = new original.Node(x, y);
      node[floor === 5 ? 'fiveFloor' : 'sixFloor']();
      if (!node.obstacles) cells.add(`${x},${y}`);
    }
  }
  return [floor, cells];
}));

function originalPath(floor, from, to) {
  original.baselineFloor = floor;
  original.baselineFrom = [from.x, from.y];
  original.baselineTo = [to.x, to.y];
  inputs.start_input = { value: 'baselineFrom' };
  inputs.end_input = { value: 'baselineTo' };
  return JSON.parse(vm.runInContext(`
    roomSet.baselineFrom = baselineFrom;
    roomSet.baselineTo = baselineTo;
    current_floor = baselineFloor + 'f';
    displayPath = false;
    reset();
    for (let attempt = 0; attempt < 5301 && !displayPath; attempt++) draw();
    JSON.stringify(path.map(({ x, y }) => ({ x, y })).reverse());
  `, original));
}

function destinationFloor(label, selectedFloor) {
  const suffix = / · ([56])F$/.exec(label);
  return suffix ? Number(suffix[1]) : Number(label[0]) || selectedFloor;
}

function point(label, floor) {
  const name = label.split(' · ')[0];
  const [x, y] = originalDestinations[name === 'Escalator' ? `${floor}Escalator` : name];
  return { x, y };
}

test('keeps the original floor geometry and calibrated representative paths', () => {
  assert.equal(walkable.get(5).size, 219);
  assert.equal(walkable.get(6).size, 237);
  for (const [from, to, floor] of [
    ['501', '508', 5], ['502', '510', 5], ['506', 'Female Toilet', 5],
    ['601', 'Elevator', 6], ['611', '603', 6], ['602', '608', 6],
    ['Escalator', 'Male Toilet', 5], ['Escalator', 'Male Toilet', 6],
    ['501', '601', 5], ['609', '509', 6], ['611', '611', 6],
  ]) {
    const route = findRoute(from, to, floor);
    for (const segment of route.segments) {
      assert.deepEqual(segment.path, originalPath(segment.floor, segment.path[0], segment.path.at(-1)),
        `${from} → ${to}, floor ${segment.floor}`);
    }
  }
});

test('every classroom and facility pair has valid floor segments in both floor contexts', () => {
  for (const selectedFloor of [5, 6]) {
    for (const from of Object.keys(DESTINATIONS)) {
      for (const to of Object.keys(DESTINATIONS)) {
        const fromFloor = destinationFloor(from, selectedFloor);
        const toFloor = destinationFloor(to, selectedFloor);
        const route = findRoute(from, to, selectedFloor);
        assert.ok(route, `${from} → ${to}, selected floor ${selectedFloor}`);
        assert.deepEqual(route.segments.map(segment => segment.floor),
          fromFloor === toFloor ? [fromFloor] : [fromFloor, toFloor]);
        assert.deepEqual(route.segments[0].path[0], point(from, fromFloor));
        assert.deepEqual(route.segments.at(-1).path.at(-1), point(to, toFloor));
        if (fromFloor !== toFloor) {
          assert.deepEqual(route.segments[0].path.at(-1), point('Escalator', fromFloor));
          assert.deepEqual(route.segments[1].path[0], point('Escalator', toFloor));
        }
        for (const { floor, path } of route.segments) {
          assert.ok(path.length);
          for (let i = 0; i < path.length; i++) {
            const { x, y } = path[i];
            assert.ok(walkable.get(floor).has(`${x},${y}`), `blocked cell ${x},${y} on ${floor}`);
            if (i > 0) {
              const dx = Math.abs(x - path[i - 1].x);
              const dy = Math.abs(y - path[i - 1].y);
              assert.equal(Math.max(dx, dy), 1);
            }
          }
        }
      }
    }
  }
});

test('rejects unknown, inherited, malformed destinations and invalid floors', () => {
  for (const invalid of ['', 'constructor', '__proto__', 'toString', '5Escalator', '6Escalator',
    '511', '612', '501 ', ' 501', 'elevator', 'Elevator · 7F', 'Elevator · 5',
    'Elevator · 5f', 'Elevator - 5F', '501 · 5F', 'constructor · 5F', 501, null, undefined, {}, ['501']]) {
    assert.equal(findRoute(invalid, '501'), null);
    assert.equal(findRoute('501', invalid), null);
  }
  for (const floor of [0, 4, 7, '5', null, NaN, Infinity, {}]) {
    assert.equal(findRoute('501', '601', floor), null);
  }
});

test('same destination returns one point and repeated searches share no mutable state', () => {
  const first = findRoute('501', '611');
  const expected = structuredClone(first);
  first.segments[0].path[0].x = -1;
  findRoute('611', '501');
  assert.deepEqual(findRoute('501', '611'), expected);
  for (const floor of [5, 6]) {
    for (const label of Object.keys(DESTINATIONS)) {
      const route = findRoute(label, label, floor);
      const actualFloor = destinationFloor(label, floor);
      assert.deepEqual(route.segments, [{ floor: actualFloor, path: [point(label, actualFloor)] }]);
    }
  }
});

test('suggests every facility on an explicit floor with its calibrated coordinates', () => {
  const facilities = ['Accessible Toilet', 'Female Toilet', 'Male Toilet', 'Elevator', 'Escalator'];
  assert.equal(Object.keys(DESTINATIONS).length, 31);
  assert.equal(Object.keys(DESTINATIONS).filter(name => /^\d{3}$/.test(name)).length, 21);
  for (const name of facilities) {
    assert.equal(Object.hasOwn(DESTINATIONS, name), false, `${name} must name a floor in the UI`);
    for (const floor of [5, 6]) {
      const label = `${name} · ${floor}F`;
      const expected = point(label, floor);
      assert.deepEqual(DESTINATIONS[label], [expected.x, expected.y]);
    }
  }
});

test('explicit facility floors stay fixed regardless of the displayed floor', () => {
  for (const selectedFloor of [5, 6]) {
    const sameFloor = findRoute('611', 'Elevator · 6F', selectedFloor);
    assert.equal(sameFloor.from, '611');
    assert.equal(sameFloor.to, 'Elevator · 6F');
    assert.deepEqual(sameFloor.segments.map(segment => segment.floor), [6]);
    assert.deepEqual(sameFloor.segments[0].path.at(-1), { x: 10, y: 52 });
    for (const [from, to, floors] of [
      ['Female Toilet · 5F', 'Elevator · 6F', [5, 6]],
      ['Elevator · 6F', 'Female Toilet · 5F', [6, 5]],
      ['Escalator · 5F', '611', [5, 6]],
      ['611', 'Escalator · 5F', [6, 5]],
    ]) {
      const route = findRoute(from, to, selectedFloor);
      assert.equal(route.from, from);
      assert.equal(route.to, to);
      assert.deepEqual(route.segments.map(segment => segment.floor), floors);
      assert.deepEqual(route.segments[0].path[0], point(from, floors[0]));
      assert.deepEqual(route.segments.at(-1).path.at(-1), point(to, floors.at(-1)));
    }
  }
});

test('existing generic facility callers retain their selected-floor semantics', () => {
  for (const floor of [5, 6]) {
    for (const name of ['Accessible Toilet', 'Female Toilet', 'Male Toilet', 'Elevator', 'Escalator']) {
      assert.deepEqual(findRoute('611', name, floor).segments,
        findRoute('611', `${name} · ${floor}F`, floor).segments);
      assert.deepEqual(findRoute(name, '501', floor).segments,
        findRoute(`${name} · ${floor}F`, '501', floor).segments);
    }
  }
});
