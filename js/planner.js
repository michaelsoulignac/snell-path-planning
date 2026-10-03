/* Path planner: finds the initial heading that makes the drone reach a target.
   The final ordinate of the path increases with the initial heading, so a bisection on this heading solves the problem. */

import { chainAt, describePath, headingFromLambda, lambdaOf, legs } from './drone.js';
import { bisect, last } from './util.js';

// Below this heading interval (radians), the bisection cannot improve the heading any more: it is at the precision of the final ordinate.
const MIN_HEADING_INTERVAL = 1e-9;

// Ordinates of the waypoints of the path launched with heading theta0 (relative to the air) in the first zone: it fixes lambda for the whole path.
const shoot = (model, theta0) => chainAt(model, legs.length - 1, lambdaOf(legs[0].wind, model.airspeed, theta0));

const finalOrdinate = (model, theta0) => last(shoot(model, theta0));

/* Initial headings that do not saturate any frontier.
   Beyond the lambda of a saturated frontier, the initial heading would only move the headings downstream of it,
   which the user does not control. The initial headings are limited by the strongest constraint:
   the smallest lambda among the frontiers saturated above, the largest among those saturated below. */
function saturationHeadingRange(model) {
    let lambdaLo = model.arcs[0].lambdaLo;
    let lambdaHi = model.arcs[0].lambdaHi;

    for (const saturation of model.saturatedBelow) {
        if (saturation) {
            lambdaLo = Math.max(lambdaLo, saturation.lambda);
        }
    }

    for (const saturation of model.saturatedAbove) {
        if (saturation) {
            lambdaHi = Math.min(lambdaHi, saturation.lambda);
        }
    }

    // If constraints from both sides overlap, no heading avoids saturation: a single heading is kept
    const lambdaMid = (lambdaLo + lambdaHi) / 2;

    if (lambdaLo > lambdaHi) {
        lambdaLo = lambdaMid;
        lambdaHi = lambdaMid;
    }

    return {
        lo: headingFromLambda(legs[0].wind, model.airspeed, model.arcs[0], lambdaLo),
        hi: headingFromLambda(legs[0].wind, model.airspeed, model.arcs[0], lambdaHi),
    };
}

// Among the headings that do not saturate, those whose final ordinate stays within [-yMax, yMax].
function visibleHeadingRange(model, yMax) {
    const full = saturationHeadingRange(model);
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
   range: the initial headings offered,
   reach: the final ordinates they allow. */
export function launchLimits(model, yMax) {
    const range = visibleHeadingRange(model, yMax);

    return { range, reach: { lo: finalOrdinate(model, range.lo), hi: finalOrdinate(model, range.hi) } };
}

/* A target can be reached if the drone can end inside its circle: the reach is widened by the tolerance (the radius of the circle).
   This is the only criterion for "there is a solution", for the message and for Solve. */
export const isReachable = (reach, targetY, toleranceKm) => targetY >= reach.lo - toleranceKm && targetY <= reach.hi + toleranceKm;

/* Successive shots of a bisection on the initial heading, until the final ordinate is within toleranceKm of the target.
   The search stays within the initial headings offered (limits.range), where the final ordinate increases with the heading. */
export function* bisectionShots(model, limits, targetY, { toleranceKm, maxShots }) {
    const { range, reach } = limits;

    // A target only reachable thanks to the tolerance of its circle is aimed at with the extreme heading
    if (targetY > reach.hi || targetY < reach.lo) {
        const theta = targetY > reach.hi ? range.hi : range.lo;

        yield { theta, miss: finalOrdinate(model, theta) - targetY };

        return;
    }

    let { lo, hi } = range;

    for (let i = 0; i < maxShots; i++) {
        const theta = (lo + hi) / 2;
        const miss = finalOrdinate(model, theta) - targetY;

        yield { theta, miss };

        if (Math.abs(miss) < toleranceKm || hi - lo < MIN_HEADING_INTERVAL) {
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
        reachable: isReachable(reach, targetY, toleranceKm),
    };
}