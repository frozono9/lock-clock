import { shiftedDate, clockText, dateText } from './clock.js';
const $ = id => document.getElementById(id);
const defaults = { position: 13.7, size: 26, datePosition: 10.5, font: 'serif', colour: '#ffffff', showDate: true, hour12: false };
let appearance = { ...defaults };
try { appearance = { ...defaults, ...JSON.parse(localStorage.getItem('clock-appearance') || '{}') }; } catch {}
let digit = null, direction = 1, activeDigit = 0, showing = false, timer, holdTimer, holdPoint, wakeLock, customURL;
const scene = $('scene');
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
    $(`${id}-value`).value = `${appearance[key]}${id === 'size' ? '%' : '%'}`;
  }
  $('font').value = appearance.font; $('colour').value = appearance.colour;
  $('show-date').checked = appearance.showDate; $('hour12').checked = appearance.hour12;
}
function render() {
  const date = shiftedDate(Date.now(), activeDigit, direction);
  $('lock-time').textContent = clockText(date, appearance.hour12);
  $('lock-date').textContent = dateText(date);
}
async function keepAwake() { if (showing && !document.hidden) { try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {} } }
function start(value) {
  activeDigit = value; showing = true;
  $('settings').hidden = true; $('settings-toggle').setAttribute('aria-expanded', 'false');
  $('setup').hidden = true; $('lock-screen').hidden = false;
  applyAppearance(); render(); clearInterval(timer); timer = setInterval(render, 200);
  // Safari installed web apps use standalone mode; other browsers can enter fullscreen here.
  if (!matchMedia('(display-mode: standalone)').matches && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  keepAwake();
}
function stop() {
  showing = false; clearInterval(timer); clearTimeout(holdTimer);
  $('setup').hidden = false; $('lock-screen').hidden = true;
  wakeLock?.release().catch(() => {}); wakeLock = null;
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}
function choose(value) {
  digit = value; $('digit').value = value; $('perform').disabled = false;
  document.querySelectorAll('[data-digit]').forEach(button => { const selected = Number(button.dataset.digit) === value; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
}
document.querySelectorAll('[data-digit]').forEach(button => button.addEventListener('click', () => choose(Number(button.dataset.digit))));
for (const [id, sign] of [['forward',1],['backward',-1]]) $(id).addEventListener('click', () => { direction = sign; $('forward').setAttribute('aria-pressed', String(sign === 1)); $('backward').setAttribute('aria-pressed', String(sign === -1)); });
$('perform').addEventListener('click', () => { if (digit !== null) start(digit); });
$('real-time').addEventListener('click', () => start(0));
$('preview').addEventListener('click', () => start(0));
$('settings-toggle').addEventListener('click', () => { $('settings').hidden = false; $('settings-toggle').setAttribute('aria-expanded','true'); $('close-settings').focus(); });
$('close-settings').addEventListener('click', () => { $('settings').hidden = true; $('settings-toggle').setAttribute('aria-expanded','false'); $('settings-toggle').focus(); });
for (const [id,key] of [['position','position'],['size','size'],['date-position','datePosition'],['font','font'],['colour','colour'],['show-date','showDate'],['hour12','hour12']]) $(id).addEventListener('input', event => {
  appearance[key] = event.target.type === 'checkbox' ? event.target.checked : event.target.type === 'range' ? Number(event.target.value) : event.target.value;
  saveAppearance(); applyAppearance();
});
// IndexedDB stores the original imported blob, including when the app is offline.
function imageDB() { return new Promise((resolve,reject) => { const request = indexedDB.open('clock-local',1); request.onupgradeneeded = () => request.result.createObjectStore('images'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
async function imageStore(mode, value) {
  const db = await imageDB();
  return new Promise((resolve,reject) => {
    const tx = db.transaction('images', mode === 'get' ? 'readonly' : 'readwrite'); const store = tx.objectStore('images');
    const request = mode === 'get' ? store.get('background') : mode === 'delete' ? store.delete('background') : store.put(value,'background');
    tx.oncomplete = () => { resolve(request.result); db.close(); }; tx.onerror = tx.onabort = () => { reject(tx.error); db.close(); };
  });
}
async function useImage(blob) {
  const url = URL.createObjectURL(blob); const probe = new Image();
  try { probe.src = url; await probe.decode(); } catch { URL.revokeObjectURL(url); throw new Error('Cannot read this image. Try a JPEG or PNG.'); }
  if (customURL) URL.revokeObjectURL(customURL); customURL = url;
  $('wallpaper').src = url;
  const ratio = probe.naturalWidth / probe.naturalHeight;
  scene.style.width = `max(100vw, ${ratio * 100}dvh)`;
  scene.style.height = `max(100dvh, ${100 / ratio}vw)`;
}
$('background-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try { await useImage(file); await imageStore('put',file); $('image-status').textContent = 'Background saved on this device.'; }
  catch (error) { $('image-status').textContent = error.message || 'Could not save background.'; }
});
$('default-background').addEventListener('click', async () => {
  try { await imageStore('delete'); if (customURL) URL.revokeObjectURL(customURL); customURL = null; $('wallpaper').src = './assets/lock-background.png'; scene.style.width = ''; scene.style.height = ''; $('image-status').textContent = 'Included lock screen restored.'; } catch { $('image-status').textContent = 'Could not reset stored background.'; }
});
$('lock-screen').addEventListener('pointerdown', event => { if (!event.isPrimary) return; holdPoint = [event.clientX,event.clientY]; clearTimeout(holdTimer); holdTimer = setTimeout(stop, 1000); });
$('lock-screen').addEventListener('pointermove', event => { if (holdPoint && Math.hypot(event.clientX - holdPoint[0], event.clientY - holdPoint[1]) > 15) clearTimeout(holdTimer); });
for (const name of ['pointerup','pointercancel','contextmenu']) $('lock-screen').addEventListener(name, event => { clearTimeout(holdTimer); if (name === 'contextmenu') event.preventDefault(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { stop(); $('settings').hidden = true; }
  if (showing || !$('settings').hidden || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
  if (/^[1-9]$/.test(event.key)) choose(Number(event.key));
  if (event.key === 'Enter' && digit !== null) start(digit);
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && showing) { render(); keepAwake(); } });
applyAppearance();
imageStore('get').then(blob => { if (blob) return useImage(blob); }).catch(() => {});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(() => { $('offline-status').textContent = 'Ready offline · saved on this device'; }).catch(() => { $('offline-status').textContent = 'Offline setup failed. Reopen online to retry.'; });
} else $('offline-status').textContent = 'Offline mode requires HTTPS or localhost.';
