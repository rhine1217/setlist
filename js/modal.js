import { state } from './state.js';
import { $, toast, closeAC } from './utils.js';
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
}

export function resetModal() {
  ['artist-in','tour-in','fest-in','venue-in','city-in','date-in','date-from-in','date-to-in']
    .forEach(id => { $(id).value = ''; });
  state.storedCity = ''; state.storedCountry = '';
  setModalStatus('planned');
  setModalType('show');
  closeAC('artist-ac'); closeAC('venue-ac');
  if (state.PlacesLib) state.placesToken = new state.PlacesLib.AutocompleteSessionToken();
}

export function setModalType(type) {
  state.modalType = type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('on', b.dataset.type === type));
  $('show-fields').style.display  = type === 'show' ? '' : 'none';
  $('fest-fields').style.display  = type === 'festival' ? '' : 'none';
  $('date-show-fg').style.display = type === 'show' ? '' : 'none';
  $('date-fest-fg').style.display = type === 'festival' ? '' : 'none';
}

export function setModalStatus(s) {
  state.modalStatus = s;
  document.querySelectorAll('.s-btn').forEach(b => {
    b.className = 's-btn';
    if (b.dataset.status === s) b.classList.add(`on-${s}`);
  });
}

export function submitModal() {
  const venue = $('venue-in').value.trim();
  const city  = $('city-in').value.trim() || state.storedCity;
  const id    = Date.now().toString();

  if (state.modalType === 'show') {
    const artist = $('artist-in').value.trim();
    const date   = $('date-in').value;
    if (!artist) { toast('Artist is required.'); $('artist-in').focus(); return; }
    if (!date)   { toast('Date is required.'); $('date-in').focus(); return; }
    const tour = $('tour-in').value.trim();
    addEntry({
      id, type: 'show',
      artist: artist.toLowerCase(),
      ...(tour ? { tour } : {}),
      ...(venue ? { venue } : {}),
      ...(city ? { city } : {}),
      ...(state.storedCountry ? { country: state.storedCountry } : {}),
      date, status: state.modalStatus, source: 'manual'
    });
  } else {
    const festival = $('fest-in').value.trim();
    const dateFrom = $('date-from-in').value;
    if (!festival) { toast('Festival name is required.'); $('fest-in').focus(); return; }
    if (!dateFrom) { toast('Start date is required.'); $('date-from-in').focus(); return; }
    const dateTo = $('date-to-in').value;
    addEntry({
      id, type: 'festival', festival,
      ...(venue ? { venue } : {}),
      ...(city ? { city } : {}),
      ...(state.storedCountry ? { country: state.storedCountry } : {}),
      date: dateFrom,
      ...(dateTo ? { dateEnd: dateTo } : {}),
      status: state.modalStatus, source: 'manual'
    });
  }

  closeModal();
}
