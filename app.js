import { shiftedDate, clockText, dateText } from './clock.js';
import { renderClock } from './clock-display.js';
import { storedAsset } from './local-assets.js';
import { restoreFont, importFont, removeFont } from './local-font.js';
const $ = id => document.getElementById(id);
const defaults = { version: 2, position: 13.584518, size: 25.641026, datePosition: 10.505529, font: 'serif', colour: '#ffffff', showDate: true, hour12: false };
let appearance = { ...defaults };
try {
  const saved = JSON.parse(localStorage.getItem('clock-appearance') || '{}');
  // Upgrade unchanged v1 defaults while preserving deliberately adjusted values.
  if (saved.version !== defaults.version) {
    for (const [key, oldValue] of Object.entries({ position: 13.7, size: 26, datePosition: 10.5 })) {
      if (saved[key] === oldValue) delete saved[key];
    }
  }
  appearance = { ...defaults, ...saved, version: defaults.version };
} catch {}
let digit = null, activeDigit = 0, showing = false, timer, holdTimer, press, wakeLock, customURL;
const scene = $('scene');
let fontRestoreFailed = false;
function saveAppearance() { try { localStorage.setItem('clock-appearance', JSON.stringify(appearance)); } catch { $('image-status').textContent = 'Settings could not be saved on this device.'; } }
function applyAppearance() {
  scene.style.setProperty('--clock-top', `${appearance.position}%`);
  scene.style.setProperty('--clock-size', `${appearance.size}cqw`);
  scene.style.setProperty('--date-top', `${appearance.datePosition}%`);
  scene.style.setProperty('--clock-colour', appearance.colour);
  scene.dataset.font = appearance.font;
  $('lock-date').hidden = !appearance.showDate;
  for (const [id, key] of [['position','position'],['size','size'],['date-position','datePosition']]) {
    $(id).value = appearance[key];
    $(`${id}-value`).value = `${Number(appearance[key]).toFixed(2)}%`;
  }
  $('font').value = appearance.font; $('colour').value = appearance.colour;
  $('show-date').checked = appearance.showDate; $('hour12').checked = appearance.hour12;
}
function render() {
  const date = shiftedDate(Date.now(), activeDigit);
  renderClock($('lock-time'), clockText(date, appearance.hour12));
  $('lock-date').textContent = dateText(date);
}
async function keepAwake() { if (showing && !document.hidden) { try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {} } }
async function start(value) {
  // The fullscreen request must occur synchronously inside the tap gesture.
  if (!window.CLOCK_NATIVE && !matchMedia('(display-mode: standalone)').matches && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  // Load the chosen wallpaper and font before revealing the lock screen.
  await backgroundReady;
  await fontReady;
  if (appearance.font === 'serif' && fontRestoreFailed) {
    stop();
    $('settings').hidden = false;
    $('settings-toggle').setAttribute('aria-expanded', 'true');
    $('font-file').focus();
    return;
  }
  await Promise.all([...scene.querySelectorAll('img')].map(img => img.decode().catch(() => {})));
  await document.fonts.ready;
  activeDigit = value; showing = true;
  press = null;
  scene.dataset.phase = value > 0 ? 'ahead' : 'preview';
  $('settings').hidden = true; $('settings-toggle').setAttribute('aria-expanded', 'false');
  $('setup').hidden = true; $('lock-screen').hidden = false;
  applyAppearance(); render(); clearInterval(timer); timer = setInterval(render, 200);
  keepAwake();
}
function stop() {
  showing = false; press = null; clearInterval(timer); clearTimeout(holdTimer);
  $('setup').hidden = false; $('lock-screen').hidden = true;
  wakeLock?.release().catch(() => {}); wakeLock = null;
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}
function choose(value) {
  digit = value; $('digit').value = value; $('perform').disabled = false;
  document.querySelectorAll('[data-digit]').forEach(button => { const selected = Number(button.dataset.digit) === value; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
}
document.querySelectorAll('[data-digit]').forEach(button => button.addEventListener('click', () => choose(Number(button.dataset.digit))));
$('perform').addEventListener('click', () => { if (digit !== null) start(digit); });
$('preview').addEventListener('click', () => start(0));
$('settings-toggle').addEventListener('click', () => { $('settings').hidden = false; $('settings-toggle').setAttribute('aria-expanded','true'); $('close-settings').focus(); });
$('close-settings').addEventListener('click', () => { $('settings').hidden = true; $('settings-toggle').setAttribute('aria-expanded','false'); $('settings-toggle').focus(); });
for (const [id,key] of [['position','position'],['size','size'],['date-position','datePosition'],['font','font'],['colour','colour'],['show-date','showDate'],['hour12','hour12']]) $(id).addEventListener('input', event => {
  appearance[key] = event.target.type === 'checkbox' ? event.target.checked : event.target.type === 'range' ? Number(event.target.value) : event.target.value;
  saveAppearance(); applyAppearance();
});
function imageStore(mode, value) { return storedAsset('wallpaper', mode, value); }
async function useImage(blob) {
  const url = URL.createObjectURL(blob); const probe = new Image();
  try { probe.src = url; await probe.decode(); } catch { URL.revokeObjectURL(url); throw new Error('Cannot read this image. Try a JPEG or PNG.'); }
  if (customURL) URL.revokeObjectURL(customURL); customURL = url;
  $('wallpaper').src = url;
  $('wallpaper-preview').src = url;
}
$('background-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try { await useImage(file); await imageStore('put',file); $('image-status').textContent = 'Wallpaper saved on this device.'; }
  catch (error) { $('image-status').textContent = error.message || 'Could not save wallpaper.'; }
  finally { event.target.value = ''; }
});
$('default-background').addEventListener('click', async () => {
  try { await imageStore('delete'); if (customURL) URL.revokeObjectURL(customURL); customURL = null; $('wallpaper').src = './assets/mountain-wallpaper.png'; $('wallpaper-preview').src = './assets/mountain-wallpaper.png'; $('image-status').textContent = 'Mountain wallpaper restored.'; } catch { $('image-status').textContent = 'Could not reset stored wallpaper.'; }
});
$('reset-reference').addEventListener('click', () => { appearance = { ...defaults }; saveAppearance(); applyAppearance(); $('image-status').textContent = 'Reference typography restored.'; });
$('font-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  $('font-status').textContent = 'Loading font…';
  try {
    await fontReady;
    const name = await importFont(file, scene);
    fontRestoreFailed = false;
    appearance.font = 'serif'; saveAppearance(); applyAppearance();
    $('font-status').textContent = `${name} loaded from file · saved offline on this device.`;
  } catch {
    $('font-status').textContent = 'Could not load or save that font. The previous font has been kept. Try a valid TTF, OTF, WOFF or WOFF2 file.';
  } finally { event.target.value = ''; }
});
$('remove-font').addEventListener('click', async () => {
  try {
    await fontReady;
    await removeFont(scene);
    fontRestoreFailed = false;
    $('font-status').textContent = 'Using the device’s serif font. Import NewYork.ttf to use a specific font file.';
  } catch { $('font-status').textContent = 'Could not remove the saved font. Please try again.'; }
});
$('lock-screen').addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || !showing) return;
  press = { id: event.pointerId, x: event.clientX, y: event.clientY, started: performance.now(), moved: false };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  clearTimeout(holdTimer);
  holdTimer = setTimeout(stop, 1000);
});
$('lock-screen').addEventListener('pointermove', event => {
  if (press?.id === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 15) {
    press.moved = true;
    clearTimeout(holdTimer);
  }
});
$('lock-screen').addEventListener('pointerup', event => {
  clearTimeout(holdTimer);
  const released = press;
  press = null;
  if (!showing || !released || released.id !== event.pointerId || released.moved || performance.now() - released.started > 600) return;
  // One trigger per presentation: start ahead, then jump back to real time.
  if (activeDigit > 0) {
    activeDigit = 0;
    scene.dataset.phase = 'real';
    render();
  }
});
for (const name of ['pointercancel','lostpointercapture']) $('lock-screen').addEventListener(name, () => {
  clearTimeout(holdTimer); press = null;
});
$('lock-screen').addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { stop(); $('settings').hidden = true; }
  if (showing || !$('settings').hidden || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
  if (/^[1-9]$/.test(event.key)) choose(Number(event.key));
  if (event.key === 'Enter' && digit !== null) start(digit);
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && showing) { render(); keepAwake(); } });
applyAppearance();
const backgroundReady = imageStore('get').then(blob => { if (blob) return useImage(blob); }).catch(() => {});
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
$('ios-status-note').hidden = !isIOS || !!window.CLOCK_NATIVE;
const fontReady = restoreFont(scene).then(name => {
  if (name) $('font-status').textContent = `${name} loaded from file · saved offline on this device.`;
}).catch(() => {
  fontRestoreFailed = true;
  $('font-status').textContent = 'Saved font could not be restored. Reimport it or choose “Use device font instead” before performing.';
});
if (window.CLOCK_NATIVE) {
  $('offline-status').textContent = 'Offline · stored on this iPhone';
  document.querySelector('a[href="./update.html"]').hidden = true;
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(() => { $('offline-status').textContent = 'Ready offline · saved on this device'; }).catch(() => { $('offline-status').textContent = 'Offline setup failed. Reopen online to retry.'; });
} else $('offline-status').textContent = 'Offline mode requires HTTPS or localhost.';
