export function shiftedDate(now, digit) {
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) throw new RangeError('Offset must be one digit (0 for preview, 1–9 for performance).');
  return new Date(now + digit * 60_000);
}
export function clockText(date, hour12 = false) {
  let hour = date.getHours();
  if (hour12) hour = hour % 12 || 12;
  return `${hour12 ? hour : String(hour).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
export function dateText(date) {
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);
  const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' }).format(date);
  return `${weekday}, ${day}`;
}
