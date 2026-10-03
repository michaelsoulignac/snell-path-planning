/* Physics of a drone crossing zones of uniform wind.
   Conventions: x = east (direction of travel), y = north, headings in radians.
   Heading e = (cos t, sin t), ground velocity g = v e + c, w = v + c.e
   Along the path, lambda = sin(t) / w is the same in every zone (Snell-like invariant). */

import { SCENE, WINDS } from './globals.js';
import { rad } from './util.js';

export const toWindVector = ({ speedKmh, dirDeg }) => ({ cx: speedKmh * Math.cos(rad(dirDeg)), cy: speedKmh * Math.sin(rad(dirDeg)) });

const { zoneWidthKm, halfHeightKm } = SCENE;
const zoneCount = WINDS.length;
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

// Invariant lambda for a heading t in a zone of wind c.
export const lambdaOf = (wind, v, t) => Math.sin(t) / (v + wind.cx * Math.cos(t) + wind.cy * Math.sin(t));

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

/* The start and the target are in the middle of the first and last zones.
   Legs: start, frontier 1 ... frontier n-1, target. Each one is flown in the wind of its zone. */
export const xs = [
    zoneWidthKm / 2,
    ...Array.from({ length: zoneCount - 1 }, (_, k) => (k + 1) * zoneWidthKm),
    zoneCount * zoneWidthKm - zoneWidthKm / 2,
];

export const legs = windVectors.map((wind, k) => ({ wind, dx: xs[k + 1] - xs[k] }));

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

/* ---------- Usable headings ---------- */

/* Guards on the usable headings: w must stay above GUARD_W * v (the travel time diverges at the edge
   of the accessibility sector), and gx above GUARD_G * v (the drone must progress eastward). */
const GUARD_W = 0.03;
const GUARD_G = 0.02;

function isUsableHeading(wind, v, t) {
    const gx = v * Math.cos(t) + wind.cx, w = v + wind.cx * Math.cos(t) + wind.cy * Math.sin(t);

    return gx > GUARD_G * v && w > GUARD_W * v;
}

// Finds the edge of the usable headings between a bad and a good heading.
function bisectEdge(wind, v, bad, good) {
    for (let i = 0; i < 45; i++) {
        const mid = (bad + good) / 2;

        if (isUsableHeading(wind, v, mid)) {
            good = mid;
        } else {
            bad = mid;
        }
    }

    return good;
}

/* Arc of usable headings in a zone. On it, lambda(t) is strictly increasing,
   so lambda ranges over an interval [lambdaLo, lambdaHi]. */
export function usableArc(wind, v) {
    const N = 1440, step = 2 * Math.PI / N;
    const angle = j => -Math.PI + (j + 0.5) * step;
    const ok = Array.from({ length: N }, (_, j) => isUsableHeading(wind, v, angle(j)));
    let bestStart = 0, bestLength = 0;

    // Longest cyclic run of usable headings
    for (let j = 0; j < N; j++) {
        if (ok[j] && !ok[(j - 1 + N) % N]) {
            let length = 0;

            while (ok[(j + length) % N] && length < N) {
                length++;
            }

            if (length > bestLength) {
                bestLength = length;
                bestStart = j;
            }
        }
    }

    const lo0 = angle(bestStart), hi0 = lo0 + (bestLength - 1) * step;
    const lo = bisectEdge(wind, v, lo0 - step, lo0), hi = bisectEdge(wind, v, hi0 + step, hi0);

    return { lambdaLo: lambdaOf(wind, v, lo), lambdaHi: lambdaOf(wind, v, hi) };
}