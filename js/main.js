// Entry point

import { AIRSPEED, SCENE, TARGET } from './globals.js';
import { buildModel } from './drone.js';
import { bisectionShots, evaluateShot, launchLimits } from './planner.js';
import { drawScene, pxPerKm } from './scene.js';
import { setupSlider } from './controls.js';
import { clamp, deg, formatSigned, rad } from './util.js';

const $ = id => document.getElementById(id);
const sceneElement = $('scene');
const solveButton = $('solve');
const animateInput = $('animate');
const toleranceKm = TARGET.radiusPx / pxPerKm;   // the drone reaches the target when it ends inside its circle

// What the page displays: set by the controls
const state = { airspeed: AIRSPEED.defaultKmh, theta: 0, targetY: TARGET.defaultKm, ghosts: [] };   // ghosts: paths of the previous shots
let model;    // everything that depends on the airspeed: usable headings of the zones, saturation of the frontiers
let limits;   // initial headings offered (range) and final ordinates they allow (reach), at the current airspeed
let timer = null;   // next shot of the animated bisection

function render() {
    const shot = evaluateShot(model, state.theta, state.targetY, limits.reach, toleranceKm);

    solveButton.disabled = !shot.reachable;   // nothing to solve when the target is out of reach
    drawScene(sceneElement, shot, state);
}

// Stops the animation, if any, and removes the traces of the shots.
function stopSolving() {
    clearTimeout(timer);
    timer = null;
    state.ghosts = [];
}

const headingSlider = setupSlider($('theta'), $('thetaOut'), value => `${formatSigned(value)}°`, value => {
    stopSolving();
    state.theta = rad(value);
    render();
});

const speedSlider = setupSlider($('speed'), $('speedOut'), value => `${value} km/h`, value => {
    stopSolving();
    state.airspeed = value;
    refreshLimits();
    render();
});

const targetSlider = setupSlider($('target'), $('targetOut'), value => `${formatSigned(value)} km`, value => {
    stopSolving();
    state.targetY = value;
    render();
});

/* Finds the initial heading that reaches the target, by bisection. The button is disabled if there is no solution.
   Animated: one shot at a time, the previous ones stay as faint traces. Otherwise, all the shots at once. */
function solve() {
    stopSolving();

    const shots = bisectionShots(model, limits, state.targetY, { toleranceKm: TARGET.solveToleranceKm, maxShots: TARGET.maxSolveShots });

    if (!animateInput.checked) {
        for (const shot of shots) {
            state.theta = shot.theta;
        }

        headingSlider.setValue(deg(state.theta));
        render();

        return;
    }

    let previous = null;

    const nextShot = () => {
        const { value, done } = shots.next();

        if (done) {
            timer = null;
            return;
        }

        if (previous) {
            state.ghosts = [...state.ghosts, previous].slice(-TARGET.maxGhostShots);
        }

        previous = value.ys;
        state.theta = value.theta;
        headingSlider.setValue(deg(state.theta));
        render();
        timer = setTimeout(nextShot, TARGET.solveStepDelayMs);
    };

    nextShot();
}

// Everything that depends on the airspeed: the headings offered by the slider, and the targets that can be reached.
function refreshLimits() {
    model = buildModel(state.airspeed);

    const { range } = limits = launchLimits(model, SCENE.halfHeightKm - TARGET.visibleMarginKm);

    // Slider bounds: the range, rounded inwards to the slider step
    const scale = 1 / TARGET.headingStepDeg;
    const lo = Math.ceil(deg(range.lo) * scale) / scale;
    const hi = Math.floor(deg(range.hi) * scale) / scale;

    state.theta = clamp(state.theta, range.lo, range.hi);
    headingSlider.configure({
        min: lo < hi ? lo : deg(range.lo),
        max: lo < hi ? hi : deg(range.hi),
        step: TARGET.headingStepDeg,
        value: deg(state.theta),
    });
}

solveButton.addEventListener('click', solve);

speedSlider.configure({ min: AIRSPEED.minKmh, max: AIRSPEED.maxKmh, step: AIRSPEED.stepKmh, value: AIRSPEED.defaultKmh });
targetSlider.configure({ min: -TARGET.rangeKm, max: TARGET.rangeKm, step: 0.1, value: TARGET.defaultKm });
refreshLimits();
render();