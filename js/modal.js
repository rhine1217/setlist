import { state } from './state.js';
import { $, today, toast, closeAC } from './utils.js';
import { addEntry } from './render.js';

export function openModal() {
  resetModal();
  $('backdrop').classList.add('on');
  $('modal').classList.add('on');
  setTimeout(() => {
    (state.modalType === 'show' ? $('artist-in') : $('fest-in')).focus();
  }, 320);
}

export function closeModal() {
  $('backdrop').classList.remove('on');
  $('modal').classList.remove('on');
  closeAC('artist-ac');
  closeAC('venue-ac');
  closeAC('fest-ac');
}

export function resetModal() {
  ['artist-in','tour-in','fest-in','venue-in','city-in','date-from-in','date-to-in','notes-in']
    .forEach(id => { $(id).value = ''; });
  $('date-to-in').removeAttribute('min');
  _resetDateList();
  state.storedCity = ''; state.storedCountry = '';
  $('date-to-in').classList.remove('error');
  $('date-to-err').textContent = '';
  setModalStatus('interested');
  setModalType('show');
  closeAC('artist-ac'); closeAC('venue-ac'); closeAC('fest-ac');
  if (state.PlacesLib) state.placesToken = new state.PlacesLib.AutocompleteSessionToken();
}

function _resetDateList() {
  const list = $('multi-date-list');
  list.innerHTML = '';
  _appendDateRow(list);
}

function _appendDateRow(list) {
  const row = document.createElement('div');
  row.className = 'multi-date-row';

  const inp = document.createElement('input');
  inp.className = 'fi multi-date-in';
  inp.type = 'date';
  inp.addEventListener('change', e => {
    const val = e.target.value;
    if (!val) return;
    if (parseInt(val.split('-')[0], 10) < 1900) return;
    setModalStatus(val < today() ? 'attended' : 'interested');
  });

  const btn = document.createElement('button');
  btn.className = 'btn-date-remove';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Remove date');
  btn.textContent = '×';
  btn.style.display = 'none';
  btn.addEventListener('click', () => {
    row.remove();
    _updateRemoveBtns();
  });

  row.appendChild(inp);
  row.appendChild(btn);
  list.appendChild(row);
  _updateRemoveBtns();
  return inp;
}

function _updateRemoveBtns() {
  const rows = $('multi-date-list').querySelectorAll('.multi-date-row');
  rows.forEach(r => {
    r.querySelector('.btn-date-remove').style.display = rows.length > 1 ? '' : 'none';
  });
}

export function addDateRow() {
  const inp = _appendDateRow($('multi-date-list'));
  inp.focus();
}

export function setModalType(type) {
  state.modalType = type;
  document.querySelectorAll('#modal .type-btn').forEach(b =>
    b.classList.toggle('on', b.dataset.type === type)
  );
  $('show-fields').style.display  = type === 'show' ? '' : 'none';
  $('fest-fields').style.display  = type === 'festival' ? '' : 'none';
  $('date-show-fg').style.display = type === 'show' ? '' : 'none';
  $('date-fest-fg').style.display = type === 'festival' ? '' : 'none';
}

export function setModalStatus(s) {
  state.modalStatus = s;
  document.querySelectorAll('#modal .s-btn').forEach(b => {
    b.className = 's-btn';
    if (b.dataset.status === s) b.classList.add(`on-${s}`);
  });
}

export function submitModal() {
  const venue = $('venue-in').value.trim();
  const city  = $('city-in').value.trim() || state.storedCity;
  const notes = $('notes-in').value.trim() || undefined;

  if (state.modalType === 'show') {
    const artist = $('artist-in').value.trim();
    if (!artist) { toast('Artist is required.'); $('artist-in').focus(); return; }
    const dates = Array.from($('multi-date-list').querySelectorAll('.multi-date-in'))
      .map(inp => inp.value).filter(Boolean);
    if (!dates.length) { toast('At least one date is required.'); return; }
    const tour = $('tour-in').value.trim();
    dates.forEach(date => {
      addEntry({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        type: 'show',
        artist: artist.toLowerCase(),
        ...(tour  ? { tour  } : {}),
        ...(venue ? { venue } : {}),
        ...(city  ? { city  } : {}),
        ...(state.storedCountry ? { country: state.storedCountry } : {}),
        date, status: state.modalStatus, source: 'manual',
        ...(notes ? { notes } : {}),
      });
    });
  } else {
    const festival = $('fest-in').value.trim();
    const dateFrom = $('date-from-in').value;
    const dateTo   = $('date-to-in').value;
    if (!festival) { toast('Festival name is required.'); $('fest-in').focus(); return; }
    if (!dateFrom) { toast('Start date is required.'); $('date-from-in').focus(); return; }
    if (dateTo && dateTo < dateFrom) {
      $('date-to-in').classList.add('error');
      $('date-to-err').textContent = "End date can't be before start date";
      $('date-to-in').focus();
      return;
    }
    addEntry({
      id: Date.now().toString(),
      type: 'festival', festival,
      ...(venue ? { venue } : {}),
      ...(city  ? { city  } : {}),
      ...(state.storedCountry ? { country: state.storedCountry } : {}),
      date: dateFrom,
      ...(dateTo && dateTo !== dateFrom ? { dateEnd: dateTo } : {}),
      status: state.modalStatus, source: 'manual',
      ...(notes ? { notes } : {}),
    });
  }

  closeModal();
}
