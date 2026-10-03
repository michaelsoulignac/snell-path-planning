// Utility functions

export const TWO_PI = 2 * Math.PI;
export const rad = degrees => (degrees * Math.PI) / 180;
export const deg = radians => (radians * 180) / Math.PI;
export const clamp = (x, min, max) => Math.min(Math.max(x, min), max);
export const last = array => array[array.length - 1];

export const coord = x => x.toFixed(1);   // SVG coordinates: one decimal is enough

// Numbers for the interface
export const formatNumber = (x, digits = 1) =>
    x.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const formatSigned = (x, digits = 1) => (x >= 0 ? '+' : '−') + formatNumber(Math.abs(x), digits);

/* Bisection: the value of [lo, hi] where test switches from false (at lo) to true (at hi), test being monotone.
   Returns the true side. lo may be greater than hi. */
const BISECTION_STEPS = 60;   // the interval is divided by 2^60, far below the precision of a double

export function bisect(test, lo, hi) {
    for (let i = 0; i < BISECTION_STEPS; i++) {
        const mid = (lo + hi) / 2;

        if (test(mid)) {
            hi = mid;
        } else {
            lo = mid;
        }
    }

    return hi;
}