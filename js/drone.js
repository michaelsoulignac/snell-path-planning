/* Physics of a drone crossing zones of uniform wind.
   Conventions: x = east (direction of travel), y = north, headings in radians.
   Heading e = (cos t, sin t), ground velocity g = v e + c, w = v + c.e
   Along the path, lambda = sin(t) / w is the same in every zone (Snell-like invariant),
   except across a saturated frontier. */

import { SCENE, WINDS } from './globals.js';
import { TWO_PI, bisect, clamp, last, rad } from './util.js';

export const toWindVector = ({ speedKmh, dirDeg }) => ({ cx: speedKmh * Math.cos(rad(dirDeg)), cy: speedKmh * Math.sin(rad(dirDeg)) });

const { zoneWidthKm, halfHeightKm } = SCENE;
const zoneCount = WINDS.length;
const windVectors = WINDS.map(toWindVector);

// Invariant lambda for a heading t in a zone of wind c.
export const lambdaOf = (wind, v, t) => Math.sin(t) / (v + wind.cx * Math.cos(t) + wind.cy * Math.sin(t));

// Vertical shift across a zone of width dx, flown at heading t.
export const verticalShift = (wind, v, t, dx) => dx * (v * Math.sin(t) + wind.cy) / (v * Math.cos(t) + wind.cx);

/* Accessibility sector: directions of the ground track reachable from a point, around the wind direction alpha.
   c < v: the whole plane (half-angle pi, i.e. 360 degrees).
   c = v: the half-plane delimited by the line normal to the wind (half-angle pi / 2).
   c > v: a sector of half-angle asin(v / c), which tends to pi / 2 when c tends to v. */
export function accessibilitySector(wind, v) {
    const c = Math.hypot(wind.cx, wind.cy);
    const alpha = Math.atan2(wind.cy, wind.cx);
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

/* ---------- Usable headings ---------- */

/* Guards on the usable headings: w must stay above GUARD_W * v (the travel time diverges at the edge
   of the accessibility sector), and gx above GUARD_G * v (the drone must progress eastward). */
const GUARD_W = 0.03;
const GUARD_G = 0.02;

function isUsableHeading(wind, v, t) {
    const gx = v * Math.cos(t) + wind.cx;
    const w = v + wind.cx * Math.cos(t) + wind.cy * Math.sin(t);

    return gx > GUARD_G * v && w > GUARD_W * v;
}

/* Arc [lo, hi] of usable headings in a zone. On it, lambda(t) is strictly increasing,
   so lambda ranges over an interval [lambdaLo, lambdaHi]. */
export function usableArc(wind, v) {
    const N = 1440;   // sampling of the circle of headings: 0.25 degree
    const step = TWO_PI / N;
    const angle = j => -Math.PI + (j + 0.5) * step;
    const ok = Array.from({ length: N }, (_, j) => isUsableHeading(wind, v, angle(j)));
    let bestStart = 0;
    let bestLength = 0;

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

    const lo0 = angle(bestStart);
    const hi0 = lo0 + (bestLength - 1) * step;

    // The edges lie between the last unusable sample and the first usable one
    const isUsable = t => isUsableHeading(wind, v, t);
    const lo = bisect(isUsable, lo0 - step, lo0);
    const hi = bisect(isUsable, hi0 + step, hi0);

    return { lo, hi, lambdaLo: lambdaOf(wind, v, lo), lambdaHi: lambdaOf(wind, v, hi) };
}

/* ---------- Model of the flight at a given airspeed ---------- */

/* Heading in a zone of wind c for a given lambda: sin(t - phi) = lambda v / R.
   Only the arcsine branch can be admissible. Beyond the usable arc, lambda is clamped to its edge. */
export function headingFromLambda(wind, v, arc, lambda) {
    const clamped = clamp(lambda, arc.lambdaLo, arc.lambdaHi);
    const A = 1 - clamped * wind.cy;
    const B = clamped * wind.cx;
    const R = Math.hypot(A, B);
    const phi = Math.atan2(B, A);

    return phi + Math.asin(clamp(clamped * v / R, -1, 1));
}

function shiftAt(model, k, lambda) {
    const { wind, dx } = legs[k];

    return verticalShift(wind, model.airspeed, headingFromLambda(wind, model.airspeed, model.arcs[k], lambda), dx);
}

/* Ordinates of the waypoints [start, end of leg 0, ..., end of leg lastLeg] for a given lambda.
   Frontiers have a finite length (+-bound). Once a frontier saturates, the path upstream of it is frozen
   at the lambda where it exactly reaches the end of the frontier (precomputed in the model). */
export function chainAt(model, lastLeg, lambda) {
    let ys = [0];

    for (let k = 0; k <= lastLeg; k++) {
        if (k < legs.length - 1) {
            const above = model.saturatedAbove[k];
            const below = model.saturatedBelow[k];

            if (above && lambda >= above.lambda) {
                ys = above.ys;
                continue;
            }

            if (below && lambda <= below.lambda) {
                ys = below.ys;
                continue;
            }
        }

        ys = ys.concat([last(ys) + shiftAt(model, k, lambda)]);
    }

    return ys;
}

/* Saturation lambdas, computed frontier by frontier (each one is a monotone scalar root).
   saturatedAbove[k] / saturatedBelow[k]: lambda from which (resp. up to which) frontier k saturates, and the frozen path upstream.
   The frontiers are processed in order, so a saturation upstream is taken into account by the next ones. */
function calibrate(model) {
    const { bound, lambdaLo, lambdaHi } = model;

    for (let k = 0; k < legs.length - 1; k++) {
        // Ordinate at the end of leg k, if this frontier did not saturate
        const ordinateAt = lambda => last(chainAt(model, k - 1, lambda)) + shiftAt(model, k, lambda);
        const freeze = (lambda, ordinate) => ({ lambda, ys: chainAt(model, k - 1, lambda).concat([ordinate]) });

        if (ordinateAt(lambdaHi) >= bound) {
            const lambda = ordinateAt(lambdaLo) >= bound ? lambdaLo : bisect(l => ordinateAt(l) >= bound, lambdaLo, lambdaHi);
            model.saturatedAbove[k] = freeze(lambda, bound);
        }

        if (ordinateAt(lambdaLo) <= -bound) {
            const lambda = ordinateAt(lambdaHi) <= -bound ? lambdaHi : bisect(l => ordinateAt(l) > -bound, lambdaLo, lambdaHi);
            model.saturatedBelow[k] = freeze(lambda, -bound);
        }
    }
}

/* Everything that depends on the airspeed: the usable arc of every zone, and the saturation of the frontiers.
   The lambda range is the union of the ranges of the zones: in a zone where lambda is out of range, the heading stays at the edge. */
export function buildModel(airspeed) {
    const arcs = legs.map(leg => usableArc(leg.wind, airspeed));
    const model = {
        airspeed,
        arcs,
        bound: halfHeightKm,
        saturatedAbove: [],
        saturatedBelow: [],
        lambdaLo: Math.min(...arcs.map(arc => arc.lambdaLo)),
        lambdaHi: Math.max(...arcs.map(arc => arc.lambdaHi)),
    };

    calibrate(model);

    return model;
}

/* ---------- Path actually flown ---------- */

/* Tolerances of the exact travel time:
   - DISCRIMINANT_EPS: relative. At the edge of the accessibility sector the discriminant is 0, and rounding can make it slightly negative.
   - DENOMINATOR_EPS: the denominator must be positive (a drone that does not move forward never arrives), and it is a divisor. */
const DISCRIMINANT_EPS = 1e-9;
const DENOMINATOR_EPS = 1e-12;

// Exact travel time of a displacement (dx, dy) in wind c: d^2 / (d.c + sqrt(delta)), or Infinity if impossible.
function exactTravelTime(v, wind, dx, dy) {
    const d2 = dx * dx + dy * dy;
    const dc = dx * wind.cx + dy * wind.cy;
    const cross = wind.cx * dy - wind.cy * dx;
    const delta = v * v * d2 - cross * cross;

    if (delta < -DISCRIMINANT_EPS * v * v * d2) {
        return Infinity;
    }

    const den = dc + Math.sqrt(Math.max(delta, 0));

    return den > DENOMINATOR_EPS ? d2 / den : Infinity;
}

// Heading actually flown along a leg with vertical shift dy (null if the leg is impossible).
function legHeading(leg, v, dy) {
    const tau = exactTravelTime(v, leg.wind, leg.dx, dy);

    if (!isFinite(tau)) {
        return null;
    }

    return Math.atan2((dy / tau - leg.wind.cy) / v, (leg.dx / tau - leg.wind.cx) / v);
}

// Heading actually flown along each leg of the path (null for a leg that cannot be flown).
export function describePath(v, ys) {
    return {
        ys,
        headings: legs.map((leg, k) => legHeading(leg, v, ys[k + 1] - ys[k])),
    };
}