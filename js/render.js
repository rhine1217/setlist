import { state } from './state.js';
import { $, today, fmtDate, fmtRange, cap, esc } from './utils.js';
import { scheduleSave } from './drive.js';

// Populated during filtered() when a festival matches via lineup search
const lineupMatches = new Map();

// External row-click handler — set by app.js to avoid circular dep with edit.js
let onRowClick = null;
export function setRowClickHandler(fn) { onRowClick = fn; }

export function filtered() {
  lineupMatches.clear();
  const t = today();
  let items = [...state.setlist];

  if (state.query) {
    const q = state.query.toLowerCase();
    items = items.filter(e => {
      const direct = [e.artist, e.festival, e.venue, e.city, e.tour]
        .filter(Boolean).some(f => f.toLowerCase().includes(q));
      if (direct) return true;
      // Check lineup array — track matched artist for subtext
      const match = (e.lineup || []).find(a => a.toLowerCase().includes(q));
      if (match) { lineupMatches.set(e.id, match); return true; }
      return false;
    });
  }

  if (state.currentTab === 'upcoming') {
    items = items.filter(e =>
      e.date >= t &&
      (e.status === 'interested' || e.status === 'planned' || e.status === 'bought')
    );
    items.sort((a, b) => a.date.localeCompare(b.date));
  } else if (state.currentTab === 'attended') {
    items = items.filter(e => e.status === 'attended');
    items.sort((a, b) => b.date.localeCompare(a.date));
  } else {
    items.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Per-tab type filter (only on upcoming/attended)
  if (state.currentTab !== 'all') {
    const tf = state.typeFilters[state.currentTab] || 'all';
    if (tf !== 'all') items = items.filter(e => e.type === tf);
  }

  return items;
}

export function render() {
  const interested = state.setlist.filter(e => e.status === 'interested').length;
  const planned    = state.setlist.filter(e => e.status === 'planned').length;
  const bought     = state.setlist.filter(e => e.status === 'bought').length;
  const attended   = state.setlist.filter(e => e.status === 'attended').length;
  $('s-interested').textContent = interested;
  $('s-planned').textContent    = planned;
  $('s-bought').textContent     = bought;
  $('s-attended').textContent   = attended;
  $('hdr-count').textContent    = `${state.setlist.length} shows`;

  const items = filtered();
  const list  = $('list');

  if (!items.length) {
    const msgs = {
      upcoming: 'No upcoming shows.',
      attended: 'No attended shows yet.',
      all: state.setlist.length ? 'No results.' : 'Nothing here yet. Tap + to add a show.',
    };
    list.innerHTML = `<div class="empty">${msgs[state.currentTab]}</div>`;
    return;
  }

  list.innerHTML = items.map(rowHTML).join('');

  list.querySelectorAll('.pill').forEach(el =>
    el.addEventListener('click', ev => { ev.stopPropagation(); cycleStatus(el.dataset.id); })
  );
  list.querySelectorAll('.row').forEach(el =>
    el.addEventListener('click', () => onRowClick?.(el.dataset.id))
  );
}

export function rowHTML(e) {
  const isShow      = e.type === 'show';
  const title       = isShow ? cap(e.artist) : e.festival;
  const dateStr     = isShow ? fmtDate(e.date) : fmtRange(e.date, e.dateEnd);
  const pillLbl     = e.status === 'bought' ? 'Ticket ✓'
                    : e.status === 'interested' ? 'Interested'
                    : cap(e.status);
  const lineupMatch = lineupMatches.get(e.id);
  let subHTML = '';

  if (lineupMatch) {
    subHTML = `<div class="row-sub amber">${esc(lineupMatch)} in lineup · ${esc(e.venue || '')}</div>`;
  } else if (!isShow && e.lineup?.length) {
    const venueStr = e.venue ? ` · ${esc(e.venue)}` : '';
    subHTML = `<div class="row-sub">${e.lineup.length} artists${venueStr}</div>`;
  } else {
    const sub = [e.venue, e.city].filter(Boolean).join(' · ');
    if (sub) subHTML = `<div class="row-sub">${esc(sub)}</div>`;
  }

  return `
<div class="row ${esc(e.type)}" data-id="${esc(e.id)}">
  <div class="row-body">
    <div class="row-title">${esc(title)}</div>
    ${subHTML}
  </div>
  <div class="row-meta">
    <div class="row-date">${esc(dateStr)}</div>
    <button class="pill ${esc(e.status)}" data-id="${esc(e.id)}">${pillLbl}</button>
  </div>
</div>`;
}

export function cycleStatus(id) {
  const e = state.setlist.find(x => x.id === id);
  if (!e) return;
  const cycle = ['interested', 'planned', 'bought', 'attended'];
  e.status = cycle[(cycle.indexOf(e.status) + 1) % cycle.length];
  render(); scheduleSave();
}

export function deleteEntry(id) {
  state.setlist = state.setlist.filter(e => e.id !== id);
  render(); scheduleSave();
}

export function addEntry(e) {
  state.setlist.push(e); render(); scheduleSave();
}
