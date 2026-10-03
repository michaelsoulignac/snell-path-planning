/* Path planner: finds the initial heading that makes the drone reach a target.
   The final ordinate of the path increases with the initial heading, so a bisection on this heading solves the problem. */

import { headingFromLambda, lambdaOf, legs, propagate, usableArc } from './drone.js';
import { last } from './util.js';

// Path launched with heading theta0 (relative to the air) in the first zone: it fixes lambda for the whole path.
const shoot = (v, theta0) => propagate(v, lambdaOf(legs[0].wind, v, theta0));

const finalOrdinate = (v, theta0) => last(shoot(v, theta0).ys);

/* Initial headings whose lambda is usable in every zone: lambda must lie in the intersection of the intervals of the zones.
   The final ordinate increases with the initial heading over this range. */
function initialHeadingRange(v) {
    const arcs = legs.map(leg => usableArc(leg.wind, v));
    const lambdaLo = Math.max(...arcs.map(arc => arc.lambdaLo));
    const lambdaHi = Math.min(...arcs.map(arc => arc.lambdaHi));

    if (lambdaLo >= lambdaHi) {
        return { lo: 0, hi: 0 };   // no lambda is usable everywhere: there is no path
    }

    return {
        lo: headingFromLambda(legs[0].wind, v, lambdaLo),
        hi: headingFromLambda(legs[0].wind, v, lambdaHi),
    };
}

// Smallest heading of [lo, hi] for which test is true (test is false at lo and true at hi, and monotone).
function bisect(test, lo, hi) {
    for (let i = 0; i < 50; i++) {
        const mid = (lo + hi) / 2;

        if (test(mid)) {
            hi = mid;
        } else {
            lo = mid;
        }
    }

    return hi;
}

// Initial headings whose final ordinate stays within [-yMax, yMax].
function visibleHeadingRange(v, yMax) {
    const full = initialHeadingRange(v);
    const finalAt = theta => finalOrdinate(v, theta);
    let { lo, hi } = full;

    if (finalAt(lo) < -yMax) {
        if (finalAt(hi) < -yMax) {
            return full;
        }

        lo = bisect(theta => finalAt(theta) >= -yMax, lo, hi);
    }

    if (finalAt(hi) > yMax) {
        if (finalAt(lo) > yMax) {
            return full;
        }

        hi = bisect(theta => finalAt(theta) > yMax, lo, hi);
    }

    return lo < hi ? { lo, hi } : full;
}

/* What the drone can do at a given airspeed:
   range: the initial headings offered (final ordinate within the frame),
   reach: the final ordinates they allow. */
export function launchLimits(v, yMax) {
    const range = visibleHeadingRange(v, yMax);

    return { range, reach: { lo: finalOrdinate(v, range.lo), hi: finalOrdinate(v, range.hi) } };
}

/* Successive shots of a bisection on the initial heading, until the final ordinate is within toleranceKm of the target.
   range: initial headings of the search. The final ordinate increases with the initial heading. */
export function* bisectionShots(v, range, targetY, { toleranceKm, maxShots }) {
    let { lo, hi } = range;

    for (let i = 0; i < maxShots; i++) {
        const theta = (lo + hi) / 2, miss = finalOrdinate(v, theta) - targetY;

        yield { theta, miss };

        if (Math.abs(miss) < toleranceKm || hi - lo < 1e-9) {
            return;
        }

        if (miss < 0) {
            lo = theta;
        } else {
            hi = theta;
        }
    }
}

// Path launched with heading theta0, compared to the target: miss > 0 when the drone arrives above it.
export function evaluateShot(v, theta0, targetY, reach, toleranceKm) {
    const shot = shoot(v, theta0);
    const miss = last(shot.ys) - targetY;

    return {
        ...shot,
        miss,
        hit: Math.abs(miss) <= toleranceKm,
        reachable: targetY >= reach.lo - toleranceKm && targetY <= reach.hi + toleranceKm,
    };
}