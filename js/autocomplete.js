import { state } from './state.js';
import { $, showAC, closeAC } from './utils.js';

export async function searchArtists(q) {
  if (q.length < 2) { closeAC('artist-ac'); return; }
  clearTimeout(state.mbTimer);
  state.mbTimer = setTimeout(async () => {
    try {
      const url = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(q)}&fmt=json&limit=6`;
      const r = await fetch(url, { headers: { 'User-Agent': 'Setlist/1.0 (rhine1217@gmail.com)' } });
      const d = await r.json();
      showAC('artist-ac', (d.artists || []).slice(0, 6).map(a => ({
        primary: a.name,
        secondary: [a.disambiguation, a['begin-area']?.name].filter(Boolean).join(' · '),
        value: a.name,
      })), item => {
        $('artist-in').value = item.value;
        $('tour-in').focus();
      });
    } catch (_) {}
  }, 280);
}

export async function initPlaces() {
  try {
    state.PlacesLib = await google.maps.importLibrary('places');
    state.placesToken = new state.PlacesLib.AutocompleteSessionToken();
  } catch (e) {
    console.warn('Places init failed:', e);
  }
}

export function searchVenues(q) {
  if (q.length < 2) { closeAC('venue-ac'); return; }
  if (!state.PlacesLib) { closeAC('venue-ac'); return; }
  clearTimeout(state.venueTimer);
  state.venueTimer = setTimeout(async () => {
    try {
      const { suggestions } = await state.PlacesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: q,
        sessionToken: state.placesToken,
      });
      showAC('venue-ac', suggestions.map(s => ({
        primary:    s.placePrediction.mainText.toString(),
        secondary:  s.placePrediction.secondaryText.toString(),
        value:      s.placePrediction.mainText.toString(),
        prediction: s.placePrediction,
      })), async item => {
        $('venue-in').value = item.value;
        if (item.prediction) await fillPlace(item.prediction);
        const next = state.modalType === 'show' ? $('date-in') : $('date-from-in');
        next?.focus();
      });
    } catch (e) {
      console.warn('Venue search failed:', e);
      closeAC('venue-ac');
    }
  }, 280);
}

export async function fillPlace(prediction) {
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
    $('city-in').value = cityStr;
    state.storedCity    = cityStr;
    state.storedCountry = country;
    state.placesToken = new state.PlacesLib.AutocompleteSessionToken();
  } catch (e) {
    console.warn('Place details failed:', e);
  }
}
