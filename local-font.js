import { storedAsset } from './local-assets.js';
const FAMILY = 'Clock Imported Serif';
const KEY = 'clock-font';
let activeFace;

async function decodeFont(file) {
  if (!file?.size) throw new Error('Choose a TTF, OTF, WOFF or WOFF2 font file.');
  const face = new FontFace(FAMILY, await file.arrayBuffer(), { style: 'normal', weight: '400 1000' });
  await face.load();
  return face;
}

function activate(face, scene) {
  document.fonts.add(face);
  if (activeFace) document.fonts.delete(activeFace);
  activeFace = face;
  scene.dataset.importedFont = '';
}

export async function restoreFont(scene) {
  const file = await storedAsset(KEY, 'get');
  if (!file) return null;
  activate(await decodeFont(file), scene);
  return file.name || 'Imported clock font';
}

export async function importFont(file, scene) {
  // Decode first: a broken font must not replace a working saved font.
  const face = await decodeFont(file);
  await storedAsset(KEY, 'put', file);
  activate(face, scene);
  return file.name || 'Imported clock font';
}

export async function removeFont(scene) {
  await storedAsset(KEY, 'delete');
  if (activeFace) document.fonts.delete(activeFace);
  activeFace = null;
  delete scene.dataset.importedFont;
}
