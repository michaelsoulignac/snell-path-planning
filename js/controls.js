// Form controls

import { AIRSPEED } from './globals.js';

// Configures the airspeed slider and calls onChange(airspeed in km/h) whenever it moves.
export function setupSpeedSlider(input, output, onChange) {
    input.min = AIRSPEED.minKmh;   // bounds first, so the value is not clamped by old bounds
    input.max = AIRSPEED.maxKmh;
    input.step = AIRSPEED.stepKmh;
    input.value = AIRSPEED.defaultKmh;

    const showValue = () => {
        output.textContent = `${input.value} km/h`;
    };

    input.addEventListener('input', () => {
        showValue();
        onChange(Number(input.value));
    });

    showValue();
}