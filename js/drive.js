import { FILE_NAME } from './config.js';
import { state } from './state.js';
import { $, toast, setSaving } from './utils.js';
import { render } from './render.js';
import { showSignIn } from './auth.js';

export async function driveReq(method, url, body, ct) {
  const h = { Authorization: `Bearer ${state.token}` };
  if (ct) h['Content-Type'] = ct;
  const r = await fetch(url, { method, headers: h, body });
  if (r.status === 401) { localStorage.removeItem('sl_token'); showSignIn(); throw new Error('401'); }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r;
}

export function multipart(meta, content) {
  const b = 'SL_BOUNDARY_7f3e9a1b';
  const body =
    `--${b}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${b}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${b}--`;
  return { body, ct: `multipart/related; boundary="${b}"` };
}

export async function findOrCreate() {
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const r = await driveReq('GET',
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, null, null);
  const d = await r.json();
  if (d.files?.length) { state.fileId = d.files[0].id; return true; }

  const { body, ct } = multipart({ name: FILE_NAME, mimeType: 'application/json' }, '[]');
  const cr = await driveReq('POST',
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    body, ct);
  const cd = await cr.json();
  state.fileId = cd.id;
  return false;
}

export async function loadDrive() {
  $('loading').style.display = 'flex';
  try {
    const exists = await findOrCreate();
    if (exists) {
      const r = await driveReq('GET',
        `https://www.googleapis.com/drive/v3/files/${state.fileId}?alt=media`, null, null);
      const d = await r.json();
      state.setlist = Array.isArray(d) ? d : [];
    } else {
      state.setlist = [];
    }
    render();
    if (state.setlist.length === 0) openImportModal();
  } catch (e) {
    if (e.message !== '401') toast('Failed to load data from Drive.');
  } finally {
    $('loading').style.display = 'none';
  }
}

export function openImportModal() {
  $('import-backdrop').classList.add('on');
  $('import-modal').classList.add('on');
}

export function closeImportModal() {
  $('import-backdrop').classList.remove('on');
  $('import-modal').classList.remove('on');
}

export function doImport() {
  const raw = $('import-text').value.trim();
  if (!raw) { toast('Paste your JSON first.'); return; }
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('Not an array');
    state.setlist = data;
    render();
    scheduleSave();
    closeImportModal();
    toast(`Imported ${data.length} entries.`);
  } catch (_) {
    toast('Invalid JSON — check your file and try again.');
  }
}

export async function saveDrive() {
  if (!state.fileId || !state.token) return;
  setSaving(true);
  try {
    const content = JSON.stringify(state.setlist, null, 2);
    const { body, ct } = multipart({ name: FILE_NAME }, content);
    await driveReq('PATCH',
      `https://www.googleapis.com/upload/drive/v3/files/${state.fileId}?uploadType=multipart`,
      body, ct);
  } catch (e) {
    if (e.message !== '401') toast('Save failed — check your connection.');
  } finally {
    setSaving(false);
  }
}

export function scheduleSave() {
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(saveDrive, 1000);
}
