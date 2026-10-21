export function shiftedDate(now, digit) {
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) throw new RangeError('Offset must be one digit (0 for preview, 1–9 for performance).');
  return new Date(now + digit * 60_000);
}
// Recompute from elapsed time, rather than queued decrement callbacks: delayed
// frames and background/resume still land on the current real device time.
export function travelFrame(now, digit, elapsedMs = null, delaySeconds = 3, rewindSeconds = 4) {
  const ahead = shiftedDate(now, digit);
  if (digit === 0) return { date: ahead, phase: 'preview', remainingMs: 0 };
  if (elapsedMs === null) return { date: ahead, phase: 'ahead', remainingMs: digit * 60_000 };
  if (!Number.isFinite(delaySeconds) || delaySeconds < 0 || !Number.isFinite(rewindSeconds) || rewindSeconds <= 0) throw new RangeError('Invalid travel timing');
  const elapsed = Math.max(0, elapsedMs);
  if (elapsed < delaySeconds * 1000) return { date: ahead, phase: 'waiting', remainingMs: digit * 60_000 };
  const progress = Math.min(1, (elapsed - delaySeconds * 1000) / (rewindSeconds * 1000));
  const remainingMs = digit * 60_000 * (1 - progress);
  return { date: new Date(now + remainingMs), phase: progress < 1 ? 'rewinding' : 'real', remainingMs };
}
export function clockText(date, hour12 = false) {
  let hour = date.getHours();
  if (hour12) hour = hour % 12 || 12;
  return `${hour12 ? hour : String(hour).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
const weekdayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });
const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' });
export function dateText(date) {
  const weekday = weekdayFormat.format(date);
  const day = dayFormat.format(date);
  return `${weekday}, ${day}`;
}
