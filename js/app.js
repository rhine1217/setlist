import { $, closeAC, toast } from './utils.js';
import { state } from './state.js';
import { FILE_NAME, PLACES_API_KEY } from './config.js';
import { initAuth, signIn, signOut } from './auth.js';
import { doImport, closeImportModal } from './drive.js';
import { render, setRowClickHandler } from './render.js';
import { openModal, closeModal, setModalType, setModalStatus, submitModal } from './modal.js';
import { searchArtists, searchVenues, searchFestivals, initPlaces } from './autocomplete.js';
import {
  openEditSheet, closeEditSheet, setEditStatus, saveEdit,
  deleteFromEdit, fetchLineup, addLineupArtist, renderLineupChips,
} from './edit.js';

// ── Row click → edit sheet ────────────────────────────────────────────────────
setRowClickHandler(openEditSheet);

// ── Import modal ──────────────────────────────────────────────────────────────
$('btn-import').addEventListener('click', doImport);
$('btn-import-skip').addEventListener('click', closeImportModal);
$('import-backdrop').addEventListener('click', closeImportModal);

// ── Auth ──────────────────────────────────────────────────────────────────────
$('btn-signin').addEventListener('click', signIn);
$('btn-signout').addEventListener('click', signOut);

// ── Add modal ─────────────────────────────────────────────────────────────────
$('fab').addEventListener('click', openModal);
$('backdrop').addEventListener('click', closeModal);
$('btn-add').addEventListener('click', submitModal);

document.querySelectorAll('.type-btn').forEach(b =>
  b.addEventListener('click', () => setModalType(b.dataset.type))
);
document.querySelectorAll('#modal .s-btn').forEach(b =>
  b.addEventListener('click', () => setModalStatus(b.dataset.status))
);

$('artist-in').addEventListener('input', e =>
  searchArtists(e.target.value, { onPick: () => $('tour-in').focus() })
);
$('artist-in').addEventListener('blur', () => setTimeout(() => closeAC('artist-ac'), 160));

$('venue-in').addEventListener('input', e =>
  searchVenues(e.target.value, {
    nextId: state.modalType === 'show' ? 'date-in' : 'date-from-in',
  })
);
$('venue-in').addEventListener('blur', () => setTimeout(() => closeAC('venue-ac'), 160));

$('fest-in').addEventListener('input', e => searchFestivals(e.target.value));
$('fest-in').addEventListener('blur',  () => setTimeout(() => closeAC('fest-ac'), 160));

// Festival date-to auto-fill (add modal)
let prevDateFrom = '';
$('date-from-in').addEventListener('change', e => {
  const to = $('date-to-in');
  if (!to.value || to.value === prevDateFrom) to.value = e.target.value;
  prevDateFrom = e.target.value;
});

// Add modal Enter-key navigation
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

// ── Tab switching ─────────────────────────────────────────────────────────────
function updateTypePills() {
  const tab   = state.currentTab;
  const pills = $('type-pills');
  if (tab === 'all') {
    pills.style.display = 'none';
  } else {
    pills.style.display = '';
    const tf = state.typeFilters[tab] || 'all';
    document.querySelectorAll('.type-pill').forEach(p =>
      p.classList.toggle('on', p.dataset.type === tf)
    );
  }
}

document.querySelectorAll('.tab').forEach(t =>
  t.addEventListener('click', () => {
    state.currentTab = t.dataset.tab;
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t));
    updateTypePills();
    render();
  })
);

$('search').addEventListener('input', e => { state.query = e.target.value; render(); });

// ── Type filter pills ─────────────────────────────────────────────────────────
document.querySelectorAll('.type-pill').forEach(pill =>
  pill.addEventListener('click', () => {
    const tab = state.currentTab;
    if (tab === 'all') return;
    state.typeFilters[tab] = pill.dataset.type;
    document.querySelectorAll('.type-pill').forEach(p =>
      p.classList.toggle('on', p === pill)
    );
    render();
  })
);

// ── Edit sheet ────────────────────────────────────────────────────────────────
$('edit-backdrop').addEventListener('click', closeEditSheet);
$('btn-edit-save').addEventListener('click', saveEdit);
$('btn-edit-del').addEventListener('click', deleteFromEdit);

document.querySelectorAll('#edit-status-btns .s-btn').forEach(b =>
  b.addEventListener('click', () => setEditStatus(b.dataset.status))
);

$('edit-artist-in').addEventListener('input', e =>
  searchArtists(e.target.value, {
    inputId: 'edit-artist-in', acId: 'edit-artist-ac',
    onPick: () => $('edit-tour-in').focus(),
  })
);
$('edit-artist-in').addEventListener('blur', () => setTimeout(() => closeAC('edit-artist-ac'), 160));

$('edit-venue-in').addEventListener('input', e =>
  searchVenues(e.target.value, {
    inputId:        'edit-venue-in',
    acId:           'edit-venue-ac',
    cityInputId:    'edit-city-in',
    countryInputId: 'edit-country-in',
  })
);
$('edit-venue-in').addEventListener('blur', () => setTimeout(() => closeAC('edit-venue-ac'), 160));

$('edit-fest-in').addEventListener('input', e =>
  searchFestivals(e.target.value, { inputId: 'edit-fest-in', acId: 'edit-fest-ac' })
);
$('edit-fest-in').addEventListener('blur', () => setTimeout(() => closeAC('edit-fest-ac'), 160));

// Festival date-to auto-fill (edit modal)
let prevEditDateFrom = '';
$('edit-date-from-in').addEventListener('change', e => {
  const to = $('edit-date-to-in');
  if (!to.value || to.value === prevEditDateFrom) to.value = e.target.value;
  prevEditDateFrom = e.target.value;
});

// ── Lineup ────────────────────────────────────────────────────────────────────
$('btn-lineup-fetch').addEventListener('click', fetchLineup);

$('lineup-add-in').addEventListener('input', e =>
  searchArtists(e.target.value, {
    inputId: 'lineup-add-in', acId: 'lineup-add-ac',
    onPick: item => {
      addLineupArtist(item.value);
      $('lineup-add-in').value = '';
      closeAC('lineup-add-ac');
      renderLineupChips();
    },
  })
);
$('lineup-add-in').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const val = $('lineup-add-in').value.trim();
  if (val) { addLineupArtist(val); $('lineup-add-in').value = ''; renderLineupChips(); }
});
$('lineup-add-in').addEventListener('blur', () => setTimeout(() => closeAC('lineup-add-ac'), 160));

$('btn-lineup-add').addEventListener('click', () => {
  const val = $('lineup-add-in').value.trim();
  if (val) { addLineupArtist(val); $('lineup-add-in').value = ''; renderLineupChips(); }
});

// ── Dev mode badge ────────────────────────────────────────────────────────────
if (FILE_NAME !== 'setlist-data.json') {
  const badge = document.createElement('span');
  badge.className   = 'dev-badge';
  badge.textContent = 'DEV';
  $('hdr-right').prepend(badge);
}

// ── Bootstrap Google Identity Services ────────────────────────────────────────
const gisScript    = document.createElement('script');
gisScript.src      = 'https://accounts.google.com/gsi/client';
gisScript.onload   = () => initAuth();
gisScript.onerror  = () => toast('Failed to load Google auth. Check your connection.');
document.head.appendChild(gisScript);

// ── Bootstrap Google Maps / Places ────────────────────────────────────────────
if (PLACES_API_KEY && PLACES_API_KEY !== 'YOUR_PLACES_API_KEY') {
  window.initPlaces = initPlaces;
  const mapsScript   = document.createElement('script');
  mapsScript.src     = `https://maps.googleapis.com/maps/api/js?key=${PLACES_API_KEY}&loading=async&callback=initPlaces`;
  mapsScript.async   = true;
  mapsScript.onerror = () => console.warn('Places API failed to load — venue autocomplete unavailable.');
  document.head.appendChild(mapsScript);
}
