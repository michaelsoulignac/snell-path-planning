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
export const LAMBDA = 0;                                                           // Snell-like invariant, shared by all zones

export const SCENE = {
    zoneWidthKm: 10,
    halfHeightKm: 10,         // half-height of every frontier
    viewWidthPx: 960,         // the scale (pixels per km) follows from this width and the horizontal extent
    headingArrowPx: 46,
    margin: { left: 60, right: 60, top: 46, bottom: 34 },
    tickStepKm: 5,
    windArrowPxPerKmh: 0.55,  // half-length of the wind arrow per km/h of wind (capped so that it fits in the zone)
};

// Still-air regions before the first zone and after the last one.
export const STILL_AIR = { entryKm: 4, exitKm: 3, sidePaddingKm: 1 };