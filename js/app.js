import { $, closeAC, toast } from './utils.js';
import { state } from './state.js';
import { PLACES_API_KEY } from './config.js';
import { initAuth, signIn, signOut } from './auth.js';
import { doImport, closeImportModal } from './drive.js';
import { render } from './render.js';
import { openModal, closeModal, setModalType, setModalStatus, submitModal } from './modal.js';
import { searchArtists, searchVenues, initPlaces } from './autocomplete.js';

$('btn-import').addEventListener('click', doImport);
$('btn-import-skip').addEventListener('click', closeImportModal);
$('import-backdrop').addEventListener('click', closeImportModal);
$('btn-signin').addEventListener('click', signIn);
$('btn-signout').addEventListener('click', signOut);
$('fab').addEventListener('click', openModal);
$('backdrop').addEventListener('click', closeModal);
$('btn-add').addEventListener('click', submitModal);

document.querySelectorAll('.tab').forEach(t =>
  t.addEventListener('click', () => {
    state.currentTab = t.dataset.tab;
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t));
    render();
  })
);

$('search').addEventListener('input', e => { state.query = e.target.value; render(); });

document.querySelectorAll('.type-btn').forEach(b =>
  b.addEventListener('click', () => setModalType(b.dataset.type))
);

document.querySelectorAll('.s-btn').forEach(b =>
  b.addEventListener('click', () => setModalStatus(b.dataset.status))
);

$('artist-in').addEventListener('input', e => searchArtists(e.target.value));
$('artist-in').addEventListener('blur',  () => setTimeout(() => closeAC('artist-ac'), 160));

$('venue-in').addEventListener('input', e => searchVenues(e.target.value));
$('venue-in').addEventListener('blur',  () => setTimeout(() => closeAC('venue-ac'), 160));

const FIELDS = {
  show:     ['artist-in', 'tour-in', 'venue-in', 'city-in', 'date-in'],
  festival: ['fest-in', 'venue-in', 'city-in', 'date-from-in', 'date-to-in'],
};
$('modal').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const fields = FIELDS[state.modalType];
  const idx    = fields.indexOf(document.activeElement?.id);
  if (idx === -1) return;
  e.preventDefault();
  if (idx < fields.length - 1) $(fields[idx + 1]).focus();
  else submitModal();
});

// Bootstrap Google Identity Services
const gisScript = document.createElement('script');
gisScript.src    = 'https://accounts.google.com/gsi/client';
gisScript.onload = () => initAuth();
gisScript.onerror = () => toast('Failed to load Google auth. Check your connection.');
document.head.appendChild(gisScript);

// Bootstrap Google Maps / Places
if (PLACES_API_KEY && PLACES_API_KEY !== 'YOUR_PLACES_API_KEY') {
  window.initPlaces = initPlaces;
  const mapsScript  = document.createElement('script');
  mapsScript.src    = `https://maps.googleapis.com/maps/api/js?key=${PLACES_API_KEY}&loading=async&callback=initPlaces`;
  mapsScript.async  = true;
  mapsScript.onerror = () => console.warn('Places API failed to load — venue autocomplete unavailable.');
  document.head.appendChild(mapsScript);
}
