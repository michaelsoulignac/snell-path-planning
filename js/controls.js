// Form controls

/* Range slider with its value display.
   format(value) gives the text shown next to the label, onChange(value) is called whenever the user moves the slider.
   Returns functions to change the slider from the code. */
export function setupSlider(input, output, format, onChange) {
    const showValue = () => {
        output.textContent = format(Number(input.value));
    };

    input.addEventListener('input', () => {
        showValue();
        onChange(Number(input.value));
    });

    return {
        configure({ min, max, step, value }) {
            input.min = min;   // bounds first, so the value is not clamped by old bounds
            input.max = max;
            input.step = step;
            input.value = value;
            showValue();
        },
    };
}