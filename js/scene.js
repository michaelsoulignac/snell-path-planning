// Rendering of the main scene (SVG)

import { SCENE, TARGET, WINDS } from './globals.js';
import { rad, coord, formatNumber } from './util.js';
import { accessibilitySector, legs, xs } from './drone.js';


/* ---------- Low-level SVG tags builders ---------- */

// Arrow from (x1, y1) to (x2, y2), in pixels.
export function arrow(x1, y1, x2, y2, className, headSize = 10) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);

    if (length < 2) {
        return '';   // too short (in pixels) to draw an arrowhead
    }

    const ux = dx / length;
    const uy = dy / length;
    const h = Math.min(headSize, length * 0.6);   // the head never takes more than 60% of the arrow

    // Base of the arrowhead, and its half-width offset
    const bx = x2 - ux * h;
    const by = y2 - uy * h;
    const px = -uy * h * 0.5;
    const py = ux * h * 0.5;

    return `<line x1="${coord(x1)}" y1="${coord(y1)}" x2="${coord(bx)}" y2="${coord(by)}" class="${className}"/>`
        + `<polygon points="${coord(x2)},${coord(y2)} ${coord(bx + px)},${coord(by + py)} ${coord(bx - px)},${coord(by - py)}" class="${className}"/>`;
}

// Filled sector from an apex (pixels), between two directions (radians, y pointing up), clipped by clipId.
export function sectorPolygon({ apexX, apexY, lo, hi, className, clipId, radius = 900 }) {
    const steps = Math.max(2, Math.ceil((hi - lo) / (Math.PI / 12)));   // one vertex every 15 degrees at most
    let points = `${coord(apexX)},${coord(apexY)}`;

    for (let i = 0; i <= steps; i++) {
        const angle = lo + (hi - lo) * i / steps;
        points += ` ${coord(apexX + radius * Math.cos(angle))},${coord(apexY - radius * Math.sin(angle))}`;
    }

    return `<polygon class="${className}" clip-path="url(#${clipId})" points="${points}"/>`;
}


/* ---------- Geometry ---------- */

const { zoneWidthKm, halfHeightKm, viewWidthPx, margin, tickStepKm, speedArrowPx, speedArrowRefKmh } = SCENE;
const zoneCount = WINDS.length;

// Scene scale: the horizontal extent is the wind zones, side by side.
const plotWidth = viewWidthPx - margin.left - margin.right;
export const pxPerKm = plotWidth / (zoneCount * zoneWidthKm);
const plotHeight = 2 * halfHeightKm * pxPerKm;
const zoneWidthPx = zoneWidthKm * pxPerKm;
const viewHeight = margin.top + plotHeight + margin.bottom;
const originY = margin.top + plotHeight / 2;              // pixel ordinate of y = 0

// Length of the arrow of a speed, wind or drone: logarithmic scale (no maximum), so the same speed always gives the same length.
const arrowLength = speedKmh => speedArrowPx * Math.log(1 + speedKmh / speedArrowRefKmh);

const toX = km => margin.left + km * pxPerKm;
const toY = km => originY - km * pxPerKm;                 // the y axis points up, the SVG one points down

/* ---------- Drawing ---------- */

// Clip paths: the whole plot, and one per zone (to cut the accessibility sectors at the frontiers).
function drawDefs() {
    let markup = `<defs><clipPath id="plot"><rect x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}"/></clipPath>`;

    for (let k = 0; k < zoneCount; k++) {
        markup += `<clipPath id="zone-${k}"><rect x="${coord(toX(k * zoneWidthKm))}" y="${margin.top}" width="${coord(zoneWidthPx)}" height="${plotHeight}"/></clipPath>`;
    }

    return markup + '</defs>';
}

// Horizontal grid lines, plot border and the frontiers between zones.
function drawGrid() {
    let markup = '';

    for (let y = -halfHeightKm; y <= halfHeightKm; y += tickStepKm) {
        markup += `<line class="${y === 0 ? 'axis0' : 'grid'}" x1="${margin.left}" x2="${margin.left + plotWidth}" y1="${coord(toY(y))}" y2="${coord(toY(y))}"/>`
            + `<text class="tick" x="${margin.left - 8}" y="${coord(toY(y) + 4)}" text-anchor="end">${y > 0 ? '+' : y < 0 ? '−' : ''}${Math.abs(y)}</text>`;
    }

    markup += `<text class="tick" x="${margin.left - 8}" y="${margin.top - 8}" text-anchor="end">km</text>`
        + `<rect class="plot-border" x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}"/>`;

    for (let k = 0; k <= zoneCount; k++) {
        markup += `<line class="frontier" x1="${coord(toX(k * zoneWidthKm))}" x2="${coord(toX(k * zoneWidthKm))}" y1="${margin.top}" y2="${margin.top + plotHeight}"/>`;
    }

    return markup;
}

// Accessibility sector of every zone, starting from the waypoint where the path enters it (the start, for the first zone).
function drawAccessibilitySectors(ys, airspeed) {
    let markup = '';

    for (let k = 0; k < legs.length; k++) {
        const sector = accessibilitySector(legs[k].wind, airspeed);

        markup += sectorPolygon({
            apexX: toX(xs[k]), apexY: toY(ys[k]),
            lo: sector.lo, hi: sector.hi,
            className: 'accessible', clipId: `zone-${k}`,
        });
    }

    return markup;
}

// Wind arrow and title of every zone.
function drawZones() {
    let markup = '';
    const arrowY = margin.top + 60;

    WINDS.forEach((wind, k) => {
        const centerX = toX(k * zoneWidthKm) + zoneWidthPx / 2;
        const half = arrowLength(wind.speedKmh) / 2;
        const ux = Math.cos(rad(wind.dirDeg));
        const uy = -Math.sin(rad(wind.dirDeg));   // unit vector in pixels (y flipped)

        markup += arrow(centerX - ux * half, arrowY - uy * half, centerX + ux * half, arrowY + uy * half, 'wind-arrow', 12)
            + `<text class="zone-title" x="${coord(centerX)}" y="${margin.top - 12}">Zone ${k + 1}</text>`;
    });

    return markup;
}

// Ground track through the waypoints (xs[i], ys[i]).
function drawPath(ys, headings) {
    const legLines = ys.slice(1).map((y, k) =>
        `<line class="leg${headings[k] === null ? ' bad' : ''}" x1="${coord(toX(xs[k]))}" y1="${coord(toY(ys[k]))}" x2="${coord(toX(xs[k + 1]))}" y2="${coord(toY(y))}"/>`);

    return `<g class="path">${legLines.join('')}</g>`;
}

const drawWaypoint = (x, y, className = 'waypoint', radius = 5) =>
    `<circle class="${className}" cx="${coord(toX(x))}" cy="${coord(toY(y))}" r="${radius}"/>`;

// Message at the bottom of the scene: [kind, text], where kind is '' | 'ok' | 'bad'.
function bannerFor({ hit, reachable, miss }) {
    if (hit) {
        return ['ok', 'Target reached'];
    }

    if (!reachable) {
        return ['bad', 'Target out of reach at this airspeed'];
    }

    return ['', `Missed by ${formatNumber(Math.abs(miss), 1)} km, too ${miss > 0 ? 'high' : 'low'}`];
}

export function drawScene(sceneElement, shot, { airspeed, targetY }) {
    const { ys, headings, hit } = shot;
    const end = xs.length - 1;
    const startX = toX(xs[0]);
    const startY = toY(ys[0]);

    let markup = drawDefs() + drawAccessibilitySectors(ys, airspeed) + drawZones() + drawGrid();

    markup += `<g clip-path="url(#plot)">${drawPath(ys, headings)}</g>`;

    // Heading of each leg, drawn from the waypoint where the leg starts (the pixel y axis points down).
    for (let k = 0; k < headings.length; k++) {
        if (headings[k] === null) {
            continue;   // this leg cannot be flown
        }

        const x = toX(xs[k]);
        const y = toY(ys[k]);
        const t = headings[k];
        const len = arrowLength(airspeed);

        markup += arrow(x, y, x + len * Math.cos(t), y - len * Math.sin(t), 'heading-arrow', 11);
    }

    for (let k = 1; k < end; k++) {
        markup += drawWaypoint(xs[k], ys[k]);
    }

    markup += drawWaypoint(xs[end], ys[end], 'endpoint', 5.5)
        + drawWaypoint(xs[0], ys[0], 'start-point', 6)
        + `<text class="label halo" x="${coord(startX)}" y="${coord(startY + 26)}" text-anchor="middle">start</text>`;

    // Target: a dot in a circle, which is filled when the drone reaches it
    const targetX = toX(xs[end]);
    const targetPy = toY(targetY);

    markup += `<circle class="target${hit ? ' hit' : ''}" cx="${coord(targetX)}" cy="${coord(targetPy)}" r="${TARGET.radiusPx}"/>`
        + (hit ? '' : `<circle class="target-dot" cx="${coord(targetX)}" cy="${coord(targetPy)}" r="2.5"/>`)
        + `<text class="label halo" x="${coord(targetX + 16)}" y="${coord(targetPy + 5)}">target</text>`;

    const [kind, text] = bannerFor(shot);

    markup += `<text class="banner halo ${kind}" x="${margin.left + plotWidth / 2}" y="${margin.top + plotHeight - 16}">${text}</text>`;

    sceneElement.setAttribute('viewBox', `0 0 ${viewWidthPx} ${coord(viewHeight)}`);
    sceneElement.innerHTML = markup;
}