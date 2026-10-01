/* Physics of a drone crossing zones of uniform wind.
   Conventions: x = east (direction of travel), y = north, headings in radians.
   Heading e = (cos t, sin t), ground velocity g = v e + c, w = v + c.e
   Along the path, lambda = sin(t) / w is the same in every zone (Snell-like invariant). */

import { SCENE, STILL_AIR, WINDS } from './globals.js';
import { rad } from './util.js';

export const toWindVector = ({ speedKmh, dirDeg }) => ({ cx: speedKmh * Math.cos(rad(dirDeg)), cy: speedKmh * Math.sin(rad(dirDeg)) });

const { zoneWidthKm, halfHeightKm } = SCENE;
const windVectors = WINDS.map(toWindVector);

/* Heading in a zone of wind c for a given lambda: sin(t - phi) = lambda v / R.
   Only the arcsine branch can be admissible. Returns null if no admissible heading exists
   (no solution, or the drone cannot move forward: gx <= 0 or w <= 0). */
export function headingFromLambda(wind, v, lambda) {
    const A = 1 - lambda * wind.cy, B = lambda * wind.cx, R = Math.hypot(A, B), phi = Math.atan2(B, A);
    const s = lambda * v / R;

    if (Math.abs(s) >= 1) {
        return null;
    }

    const t = phi + Math.asin(s);
    const gx = v * Math.cos(t) + wind.cx, w = v + wind.cx * Math.cos(t) + wind.cy * Math.sin(t);

    return gx > 0 && w > 0 ? t : null;
}

// Vertical shift across a zone of width dx, flown at heading t.
export const verticalShift = (wind, v, t, dx) => dx * (v * Math.sin(t) + wind.cy) / (v * Math.cos(t) + wind.cx);

/* Accessibility sector: directions of the ground track reachable from a point, around the wind direction alpha.
   c < v: the whole plane (half-angle pi, i.e. 360 degrees).
   c = v: the half-plane delimited by the line normal to the wind (half-angle pi / 2).
   c > v: a sector of half-angle asin(v / c), which tends to pi / 2 when c tends to v. */
export function accessibilitySector(wind, v) {
    const c = Math.hypot(wind.cx, wind.cy), alpha = Math.atan2(wind.cy, wind.cx);
    const half = c < v ? Math.PI : Math.asin(v / c);

    return { lo: alpha - half, hi: alpha + half };
}

// The drone travels from left to right. Legs: still air, zone 1 ... zone n, still air.
const still = { cx: 0, cy: 0 };
export const legs = [
    { wind: still, dx: STILL_AIR.entryKm },
    ...windVectors.map(wind => ({ wind, dx: zoneWidthKm })),
    { wind: still, dx: STILL_AIR.exitKm },
];

// Abscissas (km) of the leg boundaries, from the start (left of the first zone) to the end (right of the last zone).
export const xs = [-STILL_AIR.entryKm];
legs.forEach(leg => {
    xs.push(xs[xs.length - 1] + leg.dx);
});

/* Waypoint ordinates and heading of each leg, derived from the invariant lambda.
   ok is false if a leg cannot be flown, or if the path leaves the frontiers. */
export function propagate(v, lambda) {
    const ys = [0], headings = [];
    let ok = true;

    for (const leg of legs) {
        const t = headingFromLambda(leg.wind, v, lambda);

        if (t === null) {
            ok = false;
            break;
        }

        headings.push(t);
        ys.push(ys[ys.length - 1] + verticalShift(leg.wind, v, t, leg.dx));
    }

    if (ys.some(y => Math.abs(y) > halfHeightKm)) {
        ok = false;
    }

    return { ys, headings, ok };
}