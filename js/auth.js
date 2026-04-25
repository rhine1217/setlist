import { CLIENT_ID, DRIVE_SCOPE } from './config.js';
import { state } from './state.js';
import { $ } from './utils.js';
import { loadDrive } from './drive.js';

export function initAuth() {
  state.tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: onToken,
    prompt: '',
  });

  const stored = _loadStoredToken();
  if (stored) {
    state.token = stored.access_token;
    state.tokenExpiry = stored.expires_at;
    showApp();
    loadDrive();
  } else {
    showSignIn();
  }
}

function _loadStoredToken() {
  try {
    const raw = localStorage.getItem('sl_token');
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p.expires_at > Date.now() + 30000) return p;
  } catch (_) {}
  return null;
}

export function onToken(resp) {
  if (resp.error) { console.warn('Auth error', resp.error); showSignIn(); return; }
  state.token = resp.access_token;
  state.tokenExpiry = Date.now() + (resp.expires_in - 60) * 1000;
  localStorage.setItem('sl_token', JSON.stringify({ access_token: state.token, expires_at: state.tokenExpiry }));
  showApp();
  loadDrive();
}

export function signIn() { state.tokenClient.requestAccessToken({ prompt: 'select_account' }); }

export function signOut() {
  if (state.token) google.accounts.oauth2.revoke(state.token, () => {});
  state.token = null; state.tokenExpiry = 0; state.fileId = null; state.setlist = [];
  localStorage.removeItem('sl_token');
  $('app').style.display = 'none';
  showSignIn();
}

export function showSignIn() {
  $('loading').style.display = 'none';
  $('signin').style.display  = 'flex';
  $('app').style.display     = 'none';
}

export function showApp() {
  $('loading').style.display = 'none';
  $('signin').style.display  = 'none';
  $('app').style.display     = 'flex';
}
