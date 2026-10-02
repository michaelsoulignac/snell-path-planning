// Rendering of the main scene (SVG)

import { SCENE, STILL_AIR, WINDS } from './globals.js';
import { rad, coord } from './util.js';
import { accessibilitySector } from './drone.js';
import { legs, xs } from './drone.js';


/* ---------- Low-level SVG tags builders ---------- */

// Arrow from (x1, y1) to (x2, y2), in pixels.
export function arrow(x1, y1, x2, y2, className, headSize = 10) {
    const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy);

    if (length < 2) {
        return '';
    }

    const ux = dx / length, uy = dy / length, h = Math.min(headSize, length * 0.6);
    const bx = x2 - ux * h, by = y2 - uy * h, px = -uy * h * 0.5, py = ux * h * 0.5;   // base of the arrowhead and its half-width offset

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

const { zoneWidthKm, halfHeightKm, viewWidthPx, margin, tickStepKm, windArrowPxPerKmh } = SCENE;
const zoneCount = WINDS.length;

// Scene scale: the horizontal extent covers the zones, the still-air regions and their padding.
const leftKm = STILL_AIR.entryKm + STILL_AIR.sidePaddingKm, rightKm = STILL_AIR.exitKm + STILL_AIR.sidePaddingKm;
const plotWidth = viewWidthPx - margin.left - margin.right;
const pxPerKm = plotWidth / (leftKm + zoneCount * zoneWidthKm + rightKm);
const plotHeight = 2 * halfHeightKm * pxPerKm;
const zoneWidthPx = zoneWidthKm * pxPerKm;
const viewHeight = margin.top + plotHeight + margin.bottom;
const originY = margin.top + plotHeight / 2;              // pixel ordinate of y = 0

const toX = km => margin.left + (km + leftKm) * pxPerKm;
const toY = km => originY - km * pxPerKm;                 // the y axis points up, the SVG one points down

/* ---------- Drawing ---------- */

// Clip paths: the whole plot, and one per leg (to cut the accessibility sectors at the frontiers).
function drawDefs() {
    let markup = `<defs><clipPath id="plot"><rect x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}"/></clipPath>`;

    for (let k = 0; k < legs.length; k++) {
        // The first and last legs extend to the border of the plot: in still air, the drone can also go backwards.
        const left = k === 0 ? margin.left : toX(xs[k]);
        const right = k === legs.length - 1 ? margin.left + plotWidth : toX(xs[k + 1]);

        markup += `<clipPath id="leg-${k}"><rect x="${coord(left)}" y="${margin.top}" width="${coord(right - left)}" height="${plotHeight}"/></clipPath>`;
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

// Accessibility sector of every leg (still-air regions included), starting from the waypoint where the path enters it.
function drawAccessibilitySectors(ys, airspeed) {
    let markup = '';

    for (let k = 0; k < legs.length; k++) {
        if (k >= ys.length) {
            break;   // the path stops before this leg
        }

        const sector = accessibilitySector(legs[k].wind, airspeed);

        markup += sectorPolygon({
            apexX: toX(xs[k]), apexY: toY(ys[k]),
            lo: sector.lo, hi: sector.hi,
            className: 'accessible', clipId: `leg-${k}`,
        });
    }

    return markup;
}

// Wind arrow and labels of every zone.
function drawZones(airspeed) {
    let markup = '';
    const arrowY = margin.top + 60;

    WINDS.forEach((wind, k) => {
        const centerX = toX(k * zoneWidthKm) + zoneWidthPx / 2;
        const half = Math.min(wind.speedKmh * windArrowPxPerKmh, zoneWidthPx * 0.4);   // the arrow stays inside its zone
        const ux = Math.cos(rad(wind.dirDeg)), uy = -Math.sin(rad(wind.dirDeg));       // unit vector in pixels (y flipped)

        markup += arrow(centerX - ux * half, arrowY - uy * half, centerX + ux * half, arrowY + uy * half, 'wind-arrow', 12)
            + `<text class="zone-title" x="${coord(centerX)}" y="24">Zone ${k + 1}</text>`
            + `<text class="zone-sub" x="${coord(centerX)}" y="40">wind ${wind.speedKmh} km/h, c/v = ${(wind.speedKmh / airspeed).toFixed(2)}</text>`;
    });

    return markup;
}

// Ground track through the waypoints (xs[i], ys[i]).
function drawPath(ys) {
    const legLines = ys.slice(1).map((y, k) =>
        `<line class="leg" x1="${coord(toX(xs[k]))}" y1="${coord(toY(ys[k]))}" x2="${coord(toX(xs[k + 1]))}" y2="${coord(toY(y))}"/>`);

    return `<g class="path">${legLines.join('')}</g>`;
}

const drawWaypoint = (x, y, className = 'waypoint', radius = 5) =>
    `<circle class="${className}" cx="${coord(toX(x))}" cy="${coord(toY(y))}" r="${radius}"/>`;

export function drawScene(sceneElement, { ys, headings, ok }, airspeed) {
    const startX = toX(xs[0]), startY = toY(ys[0]);

    let markup = drawDefs() + drawAccessibilitySectors(ys, airspeed) + drawZones(airspeed) + drawGrid();

    markup += `<g clip-path="url(#plot)">${drawPath(ys)}</g>`;

    // Heading of each leg, drawn from the waypoint where the leg starts (the pixel y axis points down).
    for (let k = 0; k < headings.length; k++) {
        const x = toX(xs[k]), y = toY(ys[k]), t = headings[k], len = SCENE.headingArrowPx;

        markup += arrow(x, y, x + len * Math.cos(t), y - len * Math.sin(t), 'heading-arrow', 11);
    }

    for (let k = 1; k < ys.length - 1; k++) {
        markup += drawWaypoint(xs[k], ys[k]);
    }

    if (ys.length === xs.length) {
        markup += drawWaypoint(xs[xs.length - 1], ys[ys.length - 1], 'endpoint', 6);
    }

    markup += drawWaypoint(xs[0], ys[0], 'start-point', 6)
        + `<text class="label halo" x="${coord(startX)}" y="${coord(startY + 26)}" text-anchor="middle">start</text>`;

    if (!ok) {
        markup += `<text class="banner halo" x="${margin.left + plotWidth / 2}" y="${margin.top + plotHeight - 16}">No path: at this speed, the wind pushes the drone beyond the frontiers.</text>`;
    }

    sceneElement.setAttribute('viewBox', `0 0 ${viewWidthPx} ${coord(viewHeight)}`);
    sceneElement.innerHTML = markup;
}