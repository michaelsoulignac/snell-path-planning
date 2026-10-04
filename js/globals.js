// Configuration file
// Distances in km, speeds in km/h, angles in degrees.

/* Wind of each zone, from left to right on screen.
   dirDeg is measured from the horizontal, counterclockwise (0 = east, 90 = north). */
export const WINDS = [
    { speedKmh: 50, dirDeg: 60 },
    { speedKmh: 75, dirDeg: 15 },
    { speedKmh: 70, dirDeg: -30 },
    { speedKmh: 55, dirDeg: -75 },
];

export const AIRSPEED = { minKmh: 20, maxKmh: 200, stepKmh: 1, defaultKmh: 50 };   // range of the airspeed slider

export const SCENE = {
    zoneWidthKm: 10,
    halfHeightKm: 10,         // half-height of every frontier
    viewWidthPx: 960,         // the scale (pixels per km) follows from this width and the horizontal extent
    margin: { left: 60, right: 60, top: 34, bottom: 34 },
    tickStepKm: 5,
    speedArrowPx: 120,        // length of the arrows of the wind and of the drone: speedArrowPx * ln(1 + speed / speedArrowRefKmh)
    speedArrowRefKmh: 80,
};

// Target and initial heading
export const TARGET = {
    radiusPx: 10,             // size of the target, also the tolerance for "target reached"
    rangeKm: 9,               // the target ordinate slider goes from -range to +range
    defaultKm: 4,
    headingStepDeg: 0.1,
    visibleMarginKm: 0.5,     // initial headings are limited to arrivals this far inside the frame
    solveToleranceKm: 0.02,   // the bisection stops when the drone ends this close to the target
    maxSolveShots: 40,
    solveStepDelayMs: 400,    // pause between two shots of the animated bisection
    maxGhostShots: 10,        // previous shots kept on screen as faint traces during the animation
};