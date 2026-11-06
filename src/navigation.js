const ESCALATORS = { 5: [27, 52], 6: [23, 37] };
const FACILITIES = {
  'Accessible Toilet': [17, 37], 'Female Toilet': [17, 34],
  'Male Toilet': [17, 40], 'Elevator': [10, 52], 'Escalator': [23, 37],
};

export const DESTINATIONS = {
  '501': [27, 56], '502': [40, 66], '503': [40, 47],
  '504': [40, 39], '505': [46, 32], '506': [36, 32],
  '507': [23, 32], '508': [16, 12], '509': [16, 20],
  '510': [16, 30], '601': [4, 56], '602': [27, 56],
  '603': [40, 66], '604': [40, 47], '605': [40, 39],
  '606': [46, 32], '607': [36, 32], '608': [23, 32],
  '609': [16, 12], '610': [16, 20], '611': [16, 30],
  ...Object.fromEntries([5, 6].flatMap(floor => Object.entries(FACILITIES).map(([name, point]) => [
    `${name} · ${floor}F`, name === 'Escalator' ? ESCALATORS[floor] : point,
  ]))),
};

const NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1], [-1, -1], [1, -1], [-1, 1], [1, 1]];

function isWalkable(x, y, floor) {
  if (x < 0 || x >= 57 || y < 0 || y >= 93) return false;
  return (x === 18 && y >= 12)
    || ((x === 16 || x === 17) && [12, 20, 30].includes(y))
    || (x >= 18 && x <= 46 && y === 34)
    || ([23, 36, 46].includes(x) && y >= 32 && y <= 34)
    || (x === 38 && y >= 35)
    || ((x === 39 || x === 40) && [39, 47, 66].includes(y))
    || (x >= 18 && x <= 38 && y === 55)
    || (x === 17 && [34, 37, 40].includes(y))
    || (x >= 10 && x <= 18 && y === 52)
    || (floor === 5 && x === 27 && y >= 52 && y <= 56)
    || (floor === 6 && (
      (x === 23 && (y === 35 || y === 36))
      || (x === 27 && y === 56)
      || ((x === 23 || x === 24) && y === 37)
      || (x >= 4 && x <= 18 && y === 55)
      || (x === 4 && y === 56)
      || (x === 10 && (y === 53 || y === 54))
    ));
}

function findPath(from, to, floor) {
  const start = { x: from[0], y: from[1], g: 0, f: 0 };
  const open = [start];
  const visited = new Set();
  const nodes = new Map([[start.y * 57 + start.x, start]]);

  while (open.length) {
    let lowest = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[lowest].f) lowest = i;
    }
    const current = open.splice(lowest, 1)[0];
    if (current.x === to[0] && current.y === to[1]) {
      const path = [];
      for (let node = current; node; node = node.previous) {
        path.push({ x: node.x, y: node.y });
      }
      return path.reverse();
    }
    visited.add(current);

    // Keep the original diagonal movement and neighbor order for calibrated routes.
    for (const [dx, dy] of NEIGHBORS) {
      const x = current.x + dx;
      const y = current.y + dy;
      if (!isWalkable(x, y, floor)) continue;
      const key = y * 57 + x;
      let neighbor = nodes.get(key);
      if (!neighbor) {
        neighbor = { x, y, g: Infinity, f: Infinity };
        nodes.set(key, neighbor);
      }
      if (visited.has(neighbor)) continue;
      const cost = current.g + Math.sqrt(dx * dx + dy * dy);
      if (cost >= neighbor.g) continue;
      neighbor.g = cost;
      neighbor.f = cost + Math.sqrt((x - to[0]) ** 2 + (y - to[1]) ** 2);
      neighbor.previous = current;
      if (!open.includes(neighbor)) open.push(neighbor);
    }
  }
  return null;
}

function resolveDestination(name, selectedFloor) {
  if (typeof name !== 'string') return null;
  if (Object.hasOwn(DESTINATIONS, name)) {
    return { floor: Number(name[0]) || Number(name.at(-2)), point: DESTINATIONS[name] };
  }
  // Retain generic facility names for existing callers; UI suggestions always name a floor.
  if (Object.hasOwn(FACILITIES, name)) {
    return { floor: selectedFloor, point: name === 'Escalator' ? ESCALATORS[selectedFloor] : FACILITIES[name] };
  }
  return null;
}

export function findRoute(from, to, selectedFloor = 5) {
  if (selectedFloor !== 5 && selectedFloor !== 6) return null;
  const start = resolveDestination(from, selectedFloor);
  const end = resolveDestination(to, selectedFloor);
  if (!start || !end) return null;

  const segments = start.floor === end.floor
    ? [{ floor: start.floor, path: findPath(start.point, end.point, start.floor) }]
    : [
      { floor: start.floor, path: findPath(start.point, ESCALATORS[start.floor], start.floor) },
      { floor: end.floor, path: findPath(ESCALATORS[end.floor], end.point, end.floor) },
    ];
  return segments.every(segment => segment.path) ? { from, to, segments } : null;
}
