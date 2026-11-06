const COLUMNS = 57;
const ROWS = 93;
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 1800;
const MAX_ZOOM = 8;
const ROUTE_COLOR = '#1e5b47';
const DESTINATION_COLOR = '#a74c38';

export function createMap2D(container, minimapContainer) {
    let floor = 5;
    let route = null;
    let position = null;
    let minimap = false;
    let canvas;
    let ready = false;
    let sketch;
    let routeFitted = false;
    const view = { zoom: 1, x: 0, y: 0 };
    const pointers = new Map();
    const images = {};

    function size() {
        const host = minimap ? minimapContainer : container;
        const width = Math.floor(host.clientWidth);
        const height = Math.floor(host.clientHeight);
        return width > 0 && height > 0 ? { width, height } : null;
    }

    function mapRect(width, height) {
        const inset = minimap ? 8 : 24;
        const scale = Math.min(Math.max(1, width - inset * 2) / MAP_WIDTH,
            Math.max(1, height - inset * 2) / MAP_HEIGHT) * (minimap ? 1 : view.zoom);
        const mapWidth = MAP_WIDTH * scale;
        const mapHeight = MAP_HEIGHT * scale;
        return {
            x: (width - mapWidth) / 2 + (minimap ? 0 : view.x),
            y: (height - mapHeight) / 2 + (minimap ? 0 : view.y),
            width: mapWidth,
            height: mapHeight
        };
    }

    function constrainPan() {
        // Route framing can leave blank space to keep endpoints clear of map controls.
        if (!ready || minimap || routeFitted) return;
        const rect = mapRect(sketch.width, sketch.height);
        const maxX = Math.max(0, (rect.width - sketch.width) / 2);
        const maxY = Math.max(0, (rect.height - sketch.height) / 2);
        view.x = Math.max(-maxX, Math.min(maxX, view.x));
        view.y = Math.max(-maxY, Math.min(maxY, view.y));
    }

    function redraw() {
        if (!ready) return;
        constrainPan();
        sketch.redraw();
    }

    function reframeRoute() {
        if (!routeFitted || !ready || !sketch || minimap) return;
        const path = route?.segments.find(segment => segment.floor === floor)?.path;
        if (!path?.length) {
            routeFitted = false;
            view.zoom = 1;
            view.x = 0;
            view.y = 0;
            return;
        }
        const xs = path.map(point => (point.x + 0.5) * MAP_WIDTH / COLUMNS);
        const ys = path.map(point => (point.y + 0.5) * MAP_HEIGHT / ROWS);
        const left = Math.min(...xs);
        const right = Math.max(...xs);
        const top = Math.min(...ys);
        const bottom = Math.max(...ys);
        const paddingX = Math.min(96, sketch.width / 4);
        const paddingTop = Math.min(88, sketch.height / 4);
        const paddingBottom = Math.min(96, sketch.height / 2, Math.max(76, sketch.height / 4));
        const baseScale = Math.min(Math.max(1, sketch.width - 48) / MAP_WIDTH,
            Math.max(1, sketch.height - 48) / MAP_HEIGHT);
        // Keep surrounding rooms visible and leave the lower map controls clear.
        const scale = Math.max(baseScale, Math.min(baseScale * MAX_ZOOM,
            (sketch.width - paddingX * 2) / Math.max(240, right - left),
            (sketch.height - paddingTop - paddingBottom) / Math.max(360, bottom - top)));
        view.zoom = scale / baseScale;
        view.x = (MAP_WIDTH / 2 - (left + right) / 2) * scale;
        view.y = (paddingTop - paddingBottom) / 2 + (MAP_HEIGHT / 2 - (top + bottom) / 2) * scale;
    }

    function fitRoute() {
        if (minimap || !route?.segments.some(segment => segment.floor === floor && segment.path.length)) return false;
        routeFitted = true;
        reframeRoute();
        redraw();
        return true;
    }

    function resize() {
        if (!ready || !sketch) return;
        const next = size();
        if (!next) return;
        if (sketch.width !== next.width || sketch.height !== next.height) {
            sketch.resizeCanvas(next.width, next.height, true);
        }
        reframeRoute();
        redraw();
    }

    function zoomAt(value, anchor) {
        const zoom = Math.max(1, Math.min(MAX_ZOOM, value));
        if (ready) {
            const before = mapRect(sketch.width, sketch.height);
            const x = (anchor.x - before.x) / before.width;
            const y = (anchor.y - before.y) / before.height;
            view.zoom = zoom;
            const after = mapRect(sketch.width, sketch.height);
            view.x += anchor.x - (after.x + x * after.width);
            view.y += anchor.y - (after.y + y * after.height);
        } else {
            view.zoom = zoom;
        }
    }

    function zoom(direction) {
        if (minimap) return;
        routeFitted = false;
        zoomAt(view.zoom * (direction > 0 ? 1.25 : 1 / 1.25),
            { x: sketch?.width / 2, y: sketch?.height / 2 });
        redraw();
    }

    function fit() {
        if (minimap) return;
        routeFitted = false;
        view.zoom = 1;
        view.x = 0;
        view.y = 0;
        redraw();
    }

    function point(event) {
        const bounds = canvas.elt.getBoundingClientRect();
        return {
            x: (event.clientX - bounds.left) * sketch.width / bounds.width,
            y: (event.clientY - bounds.top) * sketch.height / bounds.height
        };
    }

    function pinch() {
        const [a, b] = pointers.values();
        return {
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2,
            distance: Math.hypot(a.x - b.x, a.y - b.y)
        };
    }

    function updateCanvasLabel() {
        canvas.elt.setAttribute('tabindex', minimap ? '-1' : '0');
        canvas.elt.setAttribute('aria-label', minimap
            ? `Floor ${floor} minimap and 3D camera position`
            : `Floor ${floor} plan and navigation route. Use arrow keys to pan, plus or minus to zoom, and 0 to fit.`);
    }

    sketch = new window.p5(p => {
        p.preload = () => {
            images[5] = p.loadImage(new URL('../assets/maps/5floor_done_75.png', import.meta.url).href);
            images[6] = p.loadImage(new URL('../assets/maps/6floor_done_75.png', import.meta.url).href);
        };
        p.setup = () => {
            const initial = size();
            canvas = p.createCanvas(initial?.width ?? 1, initial?.height ?? 1);
            canvas.parent(minimap ? minimapContainer : container);
            canvas.elt.style.touchAction = 'none';
            canvas.elt.setAttribute('role', 'img');
            updateCanvasLabel();
            canvas.elt.addEventListener('wheel', event => {
                if (minimap || event.ctrlKey || event.metaKey || !event.deltaY) return;
                event.preventDefault();
                routeFitted = false;
                zoomAt(view.zoom * Math.exp(-event.deltaY * 0.0015), point(event));
                redraw();
            }, { passive: false });
            canvas.elt.addEventListener('pointerdown', event => {
                if (minimap || pointers.size === 2 || (event.pointerType === 'mouse' && event.button !== 0)) return;
                event.preventDefault();
                canvas.elt.focus({ preventScroll: true });
                canvas.elt.setPointerCapture(event.pointerId);
                pointers.set(event.pointerId, point(event));
            });
            canvas.elt.addEventListener('pointermove', event => {
                if (minimap || !pointers.has(event.pointerId)) return;
                routeFitted = false;
                const before = pointers.size === 2 ? pinch() : pointers.get(event.pointerId);
                pointers.set(event.pointerId, point(event));
                const after = pointers.size === 2 ? pinch() : pointers.get(event.pointerId);
                if (pointers.size === 2 && before.distance > 0) {
                    zoomAt(view.zoom * after.distance / before.distance, before);
                }
                view.x += after.x - before.x;
                view.y += after.y - before.y;
                redraw();
            });
            const release = event => {
                pointers.delete(event.pointerId);
                if (canvas.elt.hasPointerCapture(event.pointerId)) canvas.elt.releasePointerCapture(event.pointerId);
            };
            canvas.elt.addEventListener('pointerup', release);
            canvas.elt.addEventListener('pointercancel', release);
            canvas.elt.addEventListener('lostpointercapture', event => pointers.delete(event.pointerId));
            canvas.elt.addEventListener('keydown', event => {
                if (minimap || event.ctrlKey || event.metaKey || event.altKey) return;
                const movement = { ArrowLeft: [48, 0], ArrowRight: [-48, 0], ArrowUp: [0, 48], ArrowDown: [0, -48] }[event.key];
                if (movement) {
                    routeFitted = false;
                    view.x += movement[0];
                    view.y += movement[1];
                    redraw();
                } else if (event.key === '+' || event.key === '=') zoom(1);
                else if (event.key === '-' || event.key === '_') zoom(-1);
                else if (event.key === '0' || event.key === 'Home') fit();
                else return;
                event.preventDefault();
            });
            p.textFont('system-ui');
            p.noLoop();
            ready = true;
            reframeRoute();
            const observer = new ResizeObserver(resize);
            observer.observe(container);
            observer.observe(minimapContainer);
        };
        p.draw = () => {
            p.clear();
            const rect = mapRect(p.width, p.height);
            p.image(images[floor], rect.x, rect.y, rect.width, rect.height);
            const w = rect.width / COLUMNS;
            const h = rect.height / ROWS;
            const segment = route?.segments.find(segment => segment.floor === floor);
            if (segment?.path.length) {
                p.noFill();
                const lineWidth = minimap ? 2 : Math.max(2.5, Math.min(5, w / 4));
                for (const [color, width] of [['#ffffff', lineWidth + 3], [ROUTE_COLOR, lineWidth]]) {
                    p.stroke(color);
                    p.strokeWeight(width);
                    p.beginShape();
                    for (const point of segment.path) {
                        p.vertex(rect.x + (point.x + 0.5) * w, rect.y + (point.y + 0.5) * h);
                    }
                    p.endShape();
                }
                const startsRoute = segment === route.segments[0];
                const endsRoute = segment === route.segments.at(-1);
                const connectedFloor = route.segments.find(other => other !== segment)?.floor;
                for (const [point, label, color, transfer] of [
                    [segment.path[0], startsRoute ? 'A' : `${connectedFloor}F`, ROUTE_COLOR, !startsRoute],
                    [segment.path.at(-1), endsRoute ? 'B' : `${connectedFloor}F`, DESTINATION_COLOR, !endsRoute]
                ]) {
                    const x = rect.x + (point.x + 0.5) * w;
                    const y = rect.y + (point.y + 0.5) * h;
                    const diameter = minimap ? 10 : 24;
                    p.stroke(transfer ? ROUTE_COLOR : '#ffffff');
                    p.strokeWeight(minimap ? 1.5 : 2.5);
                    p.fill(transfer ? '#ffffff' : color);
                    if (label === 'A') p.ellipse(x, y, diameter, diameter);
                    else p.rect(x - diameter / 2, y - diameter / 2, diameter, diameter, minimap ? 2 : 5);
                    if (!minimap) {
                        p.noStroke();
                        p.fill(transfer ? ROUTE_COLOR : '#ffffff');
                        p.textAlign(p.CENTER, p.CENTER);
                        p.textSize(transfer ? 11 : 12);
                        p.text(label, x, y);
                    }
                }
            }
            if (minimap && position) {
                p.stroke('#ffffff');
                p.strokeWeight(2);
                p.fill('#c97825');
                p.ellipse(rect.x + position.x * w, rect.y + position.z * h, 8, 8);
            }
        };
    }, container);

    return {
        setFloor(value) {
            floor = value;
            reframeRoute();
            if (ready) updateCanvasLabel();
            redraw();
        },
        setRoute(value) { route = value; reframeRoute(); redraw(); },
        setPosition(value) {
            position = value;
            floor = value.floor;
            if (minimap) {
                if (ready) updateCanvasLabel();
                redraw();
            }
        },
        setMinimap(active) {
            minimap = active;
            pointers.clear();
            if (ready) {
                canvas.parent(active ? minimapContainer : container);
                updateCanvasLabel();
                resize();
            }
        },
        zoom,
        fit,
        fitRoute
    };
}
