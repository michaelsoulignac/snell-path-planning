/* Path planner: finds the initial heading that makes the drone reach a target.
   The final ordinate of the path increases with the initial heading, so a bisection on this heading solves the problem. */

import { chainAt, describePath, lambdaOf, legs } from './drone.js';
import { bisect, last } from './util.js';

// Ordinates of the waypoints of the path launched with heading theta0 (relative to the air) in the first zone: it fixes lambda for the whole path.
const shoot = (model, theta0) => chainAt(model, legs.length - 1, lambdaOf(legs[0].wind, model.airspeed, theta0));

const finalOrdinate = (model, theta0) => last(shoot(model, theta0));

// Initial headings whose final ordinate stays within [-yMax, yMax].
function visibleHeadingRange(model, yMax) {
    const full = { lo: model.arcs[0].lo, hi: model.arcs[0].hi };
    const finalAt = theta => finalOrdinate(model, theta);
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

/* What the drone can do with this model:
   range: the initial headings offered (final ordinate within the frame),
   reach: the final ordinates they allow. */
export function launchLimits(model, yMax) {
    const range = visibleHeadingRange(model, yMax);

    return { range, reach: { lo: finalOrdinate(model, range.lo), hi: finalOrdinate(model, range.hi) } };
}

/* Successive shots of a bisection on the initial heading, until the final ordinate is within toleranceKm of the target.
   range: initial headings of the search. The final ordinate increases with the initial heading. */
export function* bisectionShots(model, range, targetY, { toleranceKm, maxShots }) {
    let { lo, hi } = range;

    for (let i = 0; i < maxShots; i++) {
        const theta = (lo + hi) / 2, miss = finalOrdinate(model, theta) - targetY;

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
export function evaluateShot(model, theta0, targetY, reach, toleranceKm) {
    const path = describePath(model.airspeed, shoot(model, theta0));
    const miss = last(path.ys) - targetY;
    const feasible = path.headings.every(heading => heading !== null);

    return {
        ...path,
        feasible,
        miss,
        hit: feasible && Math.abs(miss) <= toleranceKm,
        reachable: targetY >= reach.lo - toleranceKm && targetY <= reach.hi + toleranceKm,
    };
}