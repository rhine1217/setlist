import { state } from './state.js';
import { $, toast, closeAC, cap, esc } from './utils.js';
import { scheduleSave } from './drive.js';
import { render, deleteEntry } from './render.js';

const MB_UA = 'Setlist/1.0 (rhine1217@gmail.com)';

// ── Open / close ──────────────────────────────────────────────────────────────

export function openEditSheet(id) {
  const e = state.setlist.find(x => x.id === id);
  if (!e) return;
  state.editId     = id;
  state.editLineup = [...(e.lineup || [])];

  const isAttended = e.status === 'attended';
  const isFest     = e.type === 'festival';

  $('edit-attended-label').style.display = isAttended ? '' : 'none';
  $('edit-show-fields').style.display    = isFest ? 'none' : '';
  $('edit-fest-fields').style.display    = isFest ? '' : 'none';
  $('edit-date-show-fg').style.display   = isFest ? 'none' : '';
  $('edit-date-fest-fg').style.display   = isFest ? '' : 'none';
  $('edit-status-fg').style.display      = isAttended ? 'none' : '';
  $('edit-lineup-section').style.display = isFest ? '' : 'none';

  // Populate fields
  if (isFest) {
    $('edit-fest-in').value      = e.festival || '';
    $('edit-date-from-in').value = e.date || '';
    $('edit-date-to-in').value   = e.dateEnd || e.date || '';
  } else {
    $('edit-artist-in').value = e.artist ? cap(e.artist) : '';
    $('edit-tour-in').value   = e.tour || '';
    $('edit-date-in').value   = e.date || '';
  }
  $('edit-venue-in').value   = e.venue   || '';
  $('edit-city-in').value    = e.city    || '';
  $('edit-country-in').value = e.country || '';

  if (!isAttended) setEditStatus(e.status || 'planned');

  renderLineupChips();
  _hideMBSection();
  $('lineup-add-in').value = '';

  $('edit-backdrop').classList.add('on');
  $('edit-modal').classList.add('on');
  setTimeout(() => (isFest ? $('edit-fest-in') : $('edit-artist-in')).focus(), 320);
}

export function closeEditSheet() {
  $('edit-backdrop').classList.remove('on');
  $('edit-modal').classList.remove('on');
  closeAC('edit-artist-ac');
  closeAC('edit-venue-ac');
  closeAC('edit-fest-ac');
  closeAC('lineup-add-ac');
  _hideMBSection();
  state.editId     = null;
  state.editLineup = [];
}

// ── Status ────────────────────────────────────────────────────────────────────

export function setEditStatus(s) {
  state.modalStatus = s;
  document.querySelectorAll('#edit-status-btns .s-btn').forEach(b => {
    b.className = 's-btn';
    if (b.dataset.status === s) b.classList.add(`on-${s}`);
  });
}

// ── Save / delete ─────────────────────────────────────────────────────────────

export function saveEdit() {
  const id = state.editId;
  if (!id) return;
  const idx = state.setlist.findIndex(x => x.id === id);
  if (idx === -1) return;

  const e       = state.setlist[idx];
  const venue   = $('edit-venue-in').value.trim()   || undefined;
  const city    = $('edit-city-in').value.trim()    || undefined;
  const country = $('edit-country-in').value.trim() || undefined;
  const lineup  = state.editLineup.length ? [...state.editLineup] : undefined;

  if (e.type === 'show') {
    const artist = $('edit-artist-in').value.trim();
    const date   = $('edit-date-in').value;
    if (!artist) { toast('Artist is required.'); $('edit-artist-in').focus(); return; }
    if (!date)   { toast('Date is required.');   $('edit-date-in').focus();   return; }
    const tour = $('edit-tour-in').value.trim() || undefined;
    state.setlist[idx] = _clean({
      ...e, artist: artist.toLowerCase(), tour, venue, city, country, date,
      ...(e.status !== 'attended' ? { status: state.modalStatus } : {}),
    });
  } else {
    const festival = $('edit-fest-in').value.trim();
    const dateFrom = $('edit-date-from-in').value;
    const dateTo   = $('edit-date-to-in').value;
    if (!festival) { toast('Festival name is required.'); $('edit-fest-in').focus();      return; }
    if (!dateFrom) { toast('Start date is required.');    $('edit-date-from-in').focus(); return; }
    const dateEnd = (dateTo && dateTo !== dateFrom) ? dateTo : undefined;
    state.setlist[idx] = _clean({
      ...e, festival, venue, city, country, date: dateFrom, dateEnd, lineup,
      ...(e.status !== 'attended' ? { status: state.modalStatus } : {}),
    });
  }

  render(); scheduleSave();
  closeEditSheet();
  toast('Saved.');
}

export function deleteFromEdit() {
  const id = state.editId;
  if (!id) return;
  const e = state.setlist.find(x => x.id === id);
  if (!e) return;
  const name = e.type === 'show' ? cap(e.artist) : e.festival;
  const msg  = e.status === 'attended'
    ? `This will permanently delete "${name}". Are you sure?`
    : `Delete "${name}"?`;
  if (!confirm(msg)) return;
  deleteEntry(id);
  closeEditSheet();
}

// ── Lineup chips ──────────────────────────────────────────────────────────────

export function renderLineupChips() {
  const n = state.editLineup.length;
  $('lineup-label').textContent = `LINEUP · ${n} ARTIST${n !== 1 ? 'S' : ''}`;
  $('lineup-chips').innerHTML = state.editLineup.map(name => `
    <div class="chip">
      <span>${esc(name)}</span>
      <button class="chip-x" data-name="${esc(name)}" aria-label="Remove ${esc(name)}">×</button>
    </div>`).join('');
  $('lineup-chips').querySelectorAll('.chip-x').forEach(btn =>
    btn.addEventListener('click', () => removeLineupArtist(btn.dataset.name))
  );
}

export function addLineupArtist(name) {
  name = (name || '').trim();
  if (!name || state.editLineup.includes(name)) return;
  state.editLineup.push(name);
  renderLineupChips();
}

function removeLineupArtist(name) {
  state.editLineup = state.editLineup.filter(n => n !== name);
  renderLineupChips();
}

// ── MusicBrainz lineup fetch ──────────────────────────────────────────────────

export async function fetchLineup() {
  const festName = $('edit-fest-in').value.trim();
  const dateFld  = $('edit-date-from-in').value;
  if (!festName) { toast('Enter a festival name first.'); return; }
  if (!dateFld)  { toast('Enter a start date first.'); return; }
  const year = dateFld.slice(0, 4);

  const btn = $('btn-lineup-fetch');
  btn.disabled = true;
  btn.textContent = 'Searching…';
  _hideMBSection();

  try {
    const url = `https://musicbrainz.org/ws/2/event/?query=event:${encodeURIComponent(festName)}+begin:${year}&fmt=json&limit=5`;
    const r   = await fetch(url, { headers: { 'User-Agent': MB_UA } });
    const d   = await r.json();
    const events = d.events || [];

    if (!events.length) {
      toast('No MusicBrainz events found for this festival + year.');
      return;
    }

    const ev = events[0];
    $('lineup-mb-section').style.display = '';
    $('lineup-mb-event').innerHTML =
      `<strong>${esc(ev.name)}</strong> · ${esc(ev['life-span']?.begin || year)}<br>` +
      `<span style="color:var(--dim);font-size:10px">Confirm this is the right event</span>`;

    $('lineup-mb-actions').innerHTML = `
      <button id="btn-mb-confirm" class="mb-action-btn">Fetch artists →</button>
      <button id="btn-mb-cancel"  class="mb-action-btn muted">✕</button>`;
    $('btn-mb-cancel').addEventListener('click', _hideMBSection);
    $('btn-mb-confirm').addEventListener('click', () => _fetchArtistsForEvent(ev.id, ev.name));

  } catch (err) {
    console.warn('MusicBrainz search failed:', err);
    toast('MusicBrainz search failed. Add artists manually.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span style="color:var(--amber)">●</span> Fetch from MusicBrainz';
  }
}

async function _fetchArtistsForEvent(mbid, eventName) {
  const confirmBtn = $('btn-mb-confirm');
  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Fetching…'; }

  try {
    await new Promise(r => setTimeout(r, 1000)); // respect 1 req/sec rate limit
    const r = await fetch(`https://musicbrainz.org/ws/2/event/${mbid}?inc=artist-rels&fmt=json`,
      { headers: { 'User-Agent': MB_UA } });
    const d = await r.json();

    const TYPES = ['performer', 'headliner', 'support act', 'member of band'];
    const artists = [...new Set(
      (d.relations || [])
        .filter(rel => TYPES.includes(rel.type))
        .map(rel => rel.artist?.name)
        .filter(Boolean)
    )];

    if (!artists.length) {
      toast('No artist relations found. Add manually.');
      _hideMBSection();
      return;
    }

    const inLineup = new Set(state.editLineup);
    let selected   = new Set(artists.filter(a => inLineup.has(a)));

    const renderChips = (filter = '') => {
      const fl      = filter.toLowerCase();
      const visible = fl ? artists.filter(a => a.toLowerCase().includes(fl)) : artists;
      $('lineup-mb-chips').innerHTML = visible.map(name => `
        <button class="mb-chip ${selected.has(name) ? 'selected' : ''}" data-name="${esc(name)}">
          ${esc(name)}
        </button>`).join('');
      $('lineup-mb-chips').querySelectorAll('.mb-chip').forEach(btn =>
        btn.addEventListener('click', () => {
          const n = btn.dataset.name;
          if (selected.has(n)) selected.delete(n); else selected.add(n);
          renderChips(filter);
          renderActions();
        })
      );
    };

    const renderActions = () => {
      const nSel = selected.size;
      $('lineup-mb-actions').innerHTML = `
        <button id="btn-mb-add-sel" class="mb-action-btn">Add ${nSel} selected</button>
        <button id="btn-mb-add-all" class="mb-action-btn amber">Add all ${artists.length}</button>`;
      $('btn-mb-add-sel').addEventListener('click', () => {
        selected.forEach(n => addLineupArtist(n));
        _hideMBSection();
        toast(`Added ${selected.size} artists.`);
      });
      $('btn-mb-add-all').addEventListener('click', () => {
        artists.forEach(n => addLineupArtist(n));
        _hideMBSection();
        toast(`Added ${artists.length} artists.`);
      });
    };

    $('lineup-mb-event').innerHTML = `<strong>${esc(eventName)}</strong> · ${artists.length} artists found`;

    if (artists.length >= 50) {
      $('lineup-mb-filter').style.display = '';
      $('lineup-mb-filter').addEventListener('input', e => renderChips(e.target.value));
    }

    renderChips();
    renderActions();

  } catch (err) {
    console.warn('MusicBrainz artist fetch failed:', err);
    toast('Failed to fetch artists. Add manually.');
    _hideMBSection();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _hideMBSection() {
  $('lineup-mb-section').style.display = 'none';
  $('lineup-mb-event').innerHTML       = '';
  $('lineup-mb-chips').innerHTML       = '';
  $('lineup-mb-actions').innerHTML     = '';
  $('lineup-mb-filter').style.display  = 'none';
  $('lineup-mb-filter').value          = '';
}

function _clean(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
