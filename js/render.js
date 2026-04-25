import { state } from './state.js';
import { $, today, fmtDate, fmtRange, cap, esc } from './utils.js';
import { scheduleSave } from './drive.js';

export function filtered() {
  const t = today();
  let items = [...state.setlist];

  if (state.query) {
    const q = state.query.toLowerCase();
    items = items.filter(e =>
      [e.artist, e.festival, e.venue, e.city, e.tour]
        .filter(Boolean).some(f => f.toLowerCase().includes(q))
    );
  }

  if (state.currentTab === 'upcoming') {
    items = items.filter(e => e.date >= t && (e.status === 'planned' || e.status === 'bought'));
    items.sort((a, b) => a.date.localeCompare(b.date));
  } else if (state.currentTab === 'attended') {
    items = items.filter(e => e.status === 'attended');
    items.sort((a, b) => b.date.localeCompare(a.date));
  } else {
    items.sort((a, b) => b.date.localeCompare(a.date));
  }

  return items;
}

export function render() {
  const planned  = state.setlist.filter(e => e.status === 'planned').length;
  const bought   = state.setlist.filter(e => e.status === 'bought').length;
  const attended = state.setlist.filter(e => e.status === 'attended').length;
  $('s-planned').textContent  = planned;
  $('s-bought').textContent   = bought;
  $('s-attended').textContent = attended;
  $('hdr-count').textContent  = `${state.setlist.length} shows`;

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
  list.querySelectorAll('.btn-del').forEach(el =>
    el.addEventListener('click', ev => { ev.stopPropagation(); deleteEntry(el.dataset.id); })
  );
  list.querySelectorAll('.row').forEach(initSwipe);
}

export function rowHTML(e) {
  const isShow  = e.type === 'show';
  const title   = isShow ? cap(e.artist) : e.festival;
  const sub     = [e.venue, e.city].filter(Boolean).join(' · ');
  const dateStr = isShow ? fmtDate(e.date) : fmtRange(e.date, e.dateEnd);
  const pillLbl = e.status === 'bought' ? 'Ticket ✓' : cap(e.status);

  return `
<div class="row-wrap">
  <div class="del-reveal" id="dr-${e.id}">×</div>
  <div class="row ${esc(e.type)}" data-id="${esc(e.id)}">
    <div class="row-body">
      <div class="row-title">${esc(title)}</div>
      ${sub ? `<div class="row-sub">${esc(sub)}</div>` : ''}
    </div>
    <div class="row-meta">
      <div class="row-date">${esc(dateStr)}</div>
      <button class="pill ${esc(e.status)}" data-id="${esc(e.id)}">${pillLbl}</button>
    </div>
    <button class="btn-del" data-id="${esc(e.id)}" aria-label="Delete">×</button>
  </div>
</div>`;
}

export function initSwipe(row) {
  let sx = 0, dx = 0, active = false;
  const id  = row.dataset.id;
  const rev = $('dr-' + id);
  const THRESH = 80;

  row.addEventListener('touchstart', e => {
    sx = e.touches[0].clientX; active = true;
    row.style.transition = 'none';
  }, { passive: true });

  row.addEventListener('touchmove', e => {
    if (!active) return;
    dx = e.touches[0].clientX - sx;
    if (dx < 0) {
      row.style.transform = `translateX(${dx}px)`;
      if (rev) rev.style.opacity = Math.min(1, Math.abs(dx) / THRESH);
    }
  }, { passive: true });

  row.addEventListener('touchend', () => {
    if (!active) return; active = false;
    row.style.transition = 'transform .2s';
    if (dx < -THRESH) {
      row.style.transform = 'translateX(-100%)';
      setTimeout(() => deleteEntry(id), 200);
    } else {
      row.style.transform = 'translateX(0)';
      if (rev) rev.style.opacity = 0;
    }
    dx = 0;
  });
}

export function cycleStatus(id) {
  const e = state.setlist.find(x => x.id === id);
  if (!e) return;
  const cycle = ['planned', 'bought', 'attended'];
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
