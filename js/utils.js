export const $ = id => document.getElementById(id);

export function today() { return new Date().toISOString().slice(0, 10); }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function fmtDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${MONTHS[+m-1]} ${+d}, ${y}`;
}

export function fmtRange(from, to) {
  if (!to || from === to) return fmtDate(from);
  const [y1,m1,d1] = from.split('-'), [y2,m2,d2] = to.split('-');
  if (m1===m2 && y1===y2) return `${MONTHS[+m1-1]} ${+d1}–${+d2}, ${y1}`;
  return `${fmtDate(from)} – ${fmtDate(to)}`;
}

export function cap(s) {
  if (!s) return '';
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

export function esc(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let toastTimer;
export function toast(msg, ms = 2200) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), ms);
}

export function setSaving(v) { $('saving-dot').classList.toggle('on', v); }

export function showAC(acId, items, onSelect) {
  const ac = $(acId);
  if (!items.length) { ac.classList.remove('on'); return; }
  ac.innerHTML = items.map((it, i) => `
    <div class="ac-item" data-i="${i}">
      <div>${esc(it.primary)}</div>
      ${it.secondary ? `<div class="ac-sub">${esc(it.secondary)}</div>` : ''}
    </div>`).join('');
  ac.classList.add('on');
  ac.querySelectorAll('.ac-item').forEach((el, i) =>
    el.addEventListener('mousedown', ev => {
      ev.preventDefault();
      onSelect(items[i]);
      ac.classList.remove('on');
    })
  );
}

export function closeAC(id) { $(id)?.classList.remove('on'); }
