import { state } from './state.js';
import { $, showAC, closeAC } from './utils.js';

const MB_UA = 'Setlist/1.0 (rhine1217@gmail.com)';

const FEST_ALIASES = {
  'glasto':        'Glastonbury Festival',
  'primavera':     'Primavera Sound',
  'coachella':     'Coachella',
  'outside lands': 'Outside Lands',
  'reading':       'Reading Festival',
  'leeds':         'Leeds Festival',
};

// Artist search — opts lets edit sheet reuse with different element IDs
export async function searchArtists(q, opts = {}) {
  const { inputId = 'artist-in', acId = 'artist-ac', onPick = null } = opts;
  if (q.length < 2) { closeAC(acId); return; }
  clearTimeout(state.mbTimer);
  state.mbTimer = setTimeout(async () => {
    try {
      const url = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(q)}&fmt=json&limit=6`;
      const r = await fetch(url, { headers: { 'User-Agent': MB_UA } });
      const d = await r.json();
      showAC(acId, (d.artists || []).slice(0, 6).map(a => ({
        primary:   a.name,
        secondary: [a.disambiguation, a['begin-area']?.name].filter(Boolean).join(' · '),
        value:     a.name,
      })), item => {
        $(inputId).value = item.value;
        if (onPick) onPick(item);
      });
    } catch (_) {}
  }, 280);
}

// Festival alias + existing-data autocomplete
export function searchFestivals(q, opts = {}) {
  const { inputId = 'fest-in', acId = 'fest-ac', onPick = null } = opts;
  if (q.length < 2) { closeAC(acId); return; }
  const lq = q.toLowerCase();
  const suggestions = [];

  for (const [key, val] of Object.entries(FEST_ALIASES)) {
    if (key.startsWith(lq)) {
      suggestions.push({ primary: val, secondary: `alias: ${key}`, value: val });
    }
  }

  const seen = new Set(suggestions.map(s => s.value));
  for (const e of state.setlist) {
    if (e.type === 'festival' && e.festival && !seen.has(e.festival)) {
      if (e.festival.toLowerCase().includes(lq)) {
        seen.add(e.festival);
        suggestions.push({ primary: e.festival, secondary: '', value: e.festival });
      }
    }
  }

  if (!suggestions.length) { closeAC(acId); return; }
  showAC(acId, suggestions.slice(0, 8), item => {
    $(inputId).value = item.value;
    if (onPick) onPick(item);
  });
}

export async function initPlaces() {
  try {
    state.PlacesLib   = await google.maps.importLibrary('places');
    state.placesToken = new state.PlacesLib.AutocompleteSessionToken();
  } catch (e) {
    console.warn('Places init failed:', e);
  }
}

// Venue search — opts lets edit sheet reuse with different element IDs and storage keys
export function searchVenues(q, opts = {}) {
  const {
    inputId        = 'venue-in',
    acId           = 'venue-ac',
    cityInputId    = 'city-in',
    countryInputId = null,
    cityKey        = 'storedCity',
    countryKey     = 'storedCountry',
    nextId         = null,
    onFill         = null,
  } = opts;

  if (q.length < 2) { closeAC(acId); return; }
  if (!state.PlacesLib) { closeAC(acId); return; }
  clearTimeout(state.venueTimer);
  state.venueTimer = setTimeout(async () => {
    try {
      const { suggestions } = await state.PlacesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: q,
        sessionToken: state.placesToken,
      });
      showAC(acId, suggestions.map(s => ({
        primary:    s.placePrediction.mainText.toString(),
        secondary:  s.placePrediction.secondaryText.toString(),
        value:      s.placePrediction.mainText.toString(),
        prediction: s.placePrediction,
      })), async item => {
        $(inputId).value = item.value;
        if (item.prediction) {
          await fillPlace(item.prediction, { cityInputId, countryInputId, cityKey, countryKey });
        }
        if (onFill) onFill();
        else if (nextId) $(nextId)?.focus();
      });
    } catch (e) {
      console.warn('Venue search failed:', e);
      closeAC(acId);
    }
  }, 280);
}

export async function fillPlace(prediction, opts = {}) {
  const {
    cityInputId    = 'city-in',
    countryInputId = null,
    cityKey        = 'storedCity',
    countryKey     = 'storedCountry',
  } = opts;
  try {
    const place = prediction.toPlace();
    await place.fetchFields({ fields: ['addressComponents'] });
    let city = '', stateName = '', country = '';
    for (const c of place.addressComponents || []) {
      if (c.types.includes('locality'))                    city      = c.longText;
      if (c.types.includes('administrative_area_level_1')) stateName = c.shortText;
      if (c.types.includes('country'))                     country   = c.longText;
    }
    const cityStr = city ? (stateName ? `${city}, ${stateName}` : city) : stateName;
    $(cityInputId).value = cityStr;
    state[cityKey]       = cityStr;
    state[countryKey]    = country;
    if (countryInputId) $(countryInputId).value = country;
    if (state.PlacesLib) state.placesToken = new state.PlacesLib.AutocompleteSessionToken();
  } catch (e) {
    console.warn('Place details failed:', e);
  }
}
