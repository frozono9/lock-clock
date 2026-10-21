// Use the same clock markup in the app and in the visual reference fixture.
export function renderClock(element, text) {
  if (element.getAttribute('aria-label') === text) return;
  const [hours, minutes] = text.split(':');
  const digits = document.createElement('span');
  digits.className = 'time-digits';
  digits.setAttribute('aria-hidden', 'true');
  for (const [name, value] of [['hours', hours], ['colon', ':'], ['minutes', minutes]]) {
    const run = document.createElement('span');
    run.className = `time-${name}`;
    run.textContent = value;
    digits.append(run);
  }
  element.replaceChildren(digits);
  element.setAttribute('aria-label', text);
}
