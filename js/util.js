// Utility functions

export const rad = degrees => (degrees * Math.PI) / 180;
export const deg = radians => (radians * 180) / Math.PI;
export const clamp = (x, min, max) => Math.min(Math.max(x, min), max);
export const last = array => array[array.length - 1];

export const coord = x => x.toFixed(1);   // SVG coordinates: one decimal is enough

// Numbers for the interface
export const formatNumber = (x, digits = 1) =>
    x.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const formatSigned = (x, digits = 1) => (x >= 0 ? '+' : '−') + formatNumber(Math.abs(x), digits);