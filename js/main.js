// Entry point

import { AIRSPEED, SCENE, TARGET } from './globals.js';
import { evaluateShot, launchLimits } from './drone.js';
import { drawScene, pxPerKm } from './scene.js';
import { setupSlider } from './controls.js';
import { clamp, deg, formatSigned, rad } from './util.js';

const $ = id => document.getElementById(id);
const sceneElement = $('scene');
const toleranceKm = TARGET.radiusPx / pxPerKm;   // the drone reaches the target when it ends inside its circle

// What the page displays: set by the controls
const state = { airspeed: AIRSPEED.defaultKmh, theta: 0, targetY: TARGET.defaultKm };
let limits;   // initial headings offered (range) and final ordinates they allow (reach), at the current airspeed

function render() {
    drawScene(sceneElement, evaluateShot(state.airspeed, state.theta, state.targetY, limits.reach, toleranceKm), state);
}

const headingSlider = setupSlider($('theta'), $('thetaOut'), value => `${formatSigned(value)}°`, value => {
    state.theta = rad(value);
    render();
});

const speedSlider = setupSlider($('speed'), $('speedOut'), value => `${value} km/h`, value => {
    state.airspeed = value;
    refreshLimits();
    render();
});

const targetSlider = setupSlider($('target'), $('targetOut'), value => `${formatSigned(value)} km`, value => {
    state.targetY = value;
    render();
});

// Everything that depends on the airspeed: the headings offered by the slider, and the targets that can be reached.
function refreshLimits() {
    const { range } = limits = launchLimits(state.airspeed, SCENE.halfHeightKm - TARGET.visibleMarginKm);

    // Slider bounds: the range, rounded inwards to the slider step
    const scale = 1 / TARGET.headingStepDeg;
    const lo = Math.ceil(deg(range.lo) * scale) / scale, hi = Math.floor(deg(range.hi) * scale) / scale;

    state.theta = clamp(state.theta, range.lo, range.hi);
    headingSlider.configure({
        min: lo < hi ? lo : deg(range.lo),
        max: lo < hi ? hi : deg(range.hi),
        step: TARGET.headingStepDeg,
        value: deg(state.theta),
    });
}

speedSlider.configure({ min: AIRSPEED.minKmh, max: AIRSPEED.maxKmh, step: AIRSPEED.stepKmh, value: AIRSPEED.defaultKmh });
targetSlider.configure({ min: -TARGET.rangeKm, max: TARGET.rangeKm, step: 0.1, value: TARGET.defaultKm });
refreshLimits();
render();