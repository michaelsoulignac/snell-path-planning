// Entry point

import { AIRSPEED, LAMBDA } from './globals.js';
import { propagate } from './drone.js';
import { drawScene } from './scene.js';
import { setupSpeedSlider } from './controls.js';

const sceneElement = document.getElementById('scene');

function render(airspeed) {
    drawScene(sceneElement, propagate(airspeed, LAMBDA), airspeed);
}

setupSpeedSlider(document.getElementById('speed'), document.getElementById('speedOut'), render);
render(AIRSPEED.defaultKmh);