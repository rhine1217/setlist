# SETLIST — Project Specification (v2)

> A lightweight personal concert tracking app. Hosted on GitHub Pages, data stored in Google Drive as a single JSON file.

---

## Overview

SETLIST is a mobile-first web app for tracking concerts and festivals — past, planned, and attended. It was born out of frustration with Last.fm's abandoned events feature and is designed to be the simplest possible tool that does one thing well.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Hosting | GitHub Pages | Free, no server, deploys on push |
| Storage | Google Drive (single JSON file) | No database, works across devices, user owns data |
| Auth | Google Identity Services (GIS) OAuth 2.0 | Persistent login via refresh token in localStorage |
| Artist autocomplete | MusicBrainz API (free, no key) | Good artist data, no cost |
| Venue autocomplete | Google Places API | Auto-fills venue + city + country |
| Frontend | Vanilla HTML/CSS/JS (ES modules) | No build step, easy to maintain |

---

## Google Cloud Setup (one-time)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g. `setlist-app`)
3. Enable **Google Drive API**
4. Enable **Google Places API**
5. Create **OAuth 2.0 Client ID** → Web Application
   - Add your GitHub Pages URL to Authorized JavaScript Origins
   - e.g. `https://yourusername.github.io`
6. Copy the **Client ID** into `js/config.js` where marked `YOUR_GOOGLE_CLIENT_ID`
7. Create an **API Key**, restrict it to Places API only
   - Copy it into `js/config.js` where marked `YOUR_PLACES_API_KEY`

---

## Data Model

All data lives in a single file `setlist-data.json` in the user's Google Drive root.

### Show entry
```json
{
  "id": "1714000000000",
  "type": "show",
  "artist": "black rebel motorcycle club",
  "tour": "live in sf",
  "venue": "The Warfield",
  "city": "San Francisco, CA",
  "country": "United States",
  "date": "2025-10-25",
  "status": "attended",
  "source": "manual"
}
```

### Festival entry
```json
{
  "id": "1714000000001",
  "type": "festival",
  "festival": "Glastonbury Festival of Contemporary Performing Arts 2025",
  "venue": "Worthy Farm",
  "city": "Shepton Mallet",
  "country": "United Kingdom",
  "date": "2025-06-25",
  "dateEnd": "2025-06-29",
  "status": "attended",
  "lineup": ["Pixies", "PJ Harvey", "Idles"],
  "source": "lastfm"
}
```

### Field reference

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | yes | `Date.now().toString()` for manual, `lastfm_NNNN` for imported |
| type | `show` \| `festival` | yes | Controls form fields and row color |
| artist | string | show only | MusicBrainz autocomplete |
| tour | string | show only | Optional, free text |
| festival | string | festival only | Free text with alias autocomplete |
| venue | string | yes | Google Places autocomplete |
| city | string | yes | Auto-filled by Places |
| country | string | yes | Auto-filled by Places |
| date | string (YYYY-MM-DD) | yes | ISO date |
| dateEnd | string (YYYY-MM-DD) | festival only | Optional end date; defaults to same as `date` in form |
| status | `interested` \| `planned` \| `bought` \| `attended` | yes | Cycles on tap |
| lineup | string[] | festival only | Optional array of artist name strings |
| source | `manual` \| `lastfm` | yes | For provenance tracking |

---

## UI / UX Spec

### Layout
- Mobile-first, works on desktop
- Sticky header with logo + show count + DEV badge (shown when using dev data file)
- Three tabs: **Upcoming** · **Attended** · **All**
- Floating `+` FAB (bottom right) → triggers add modal
- Fixed stats bar at bottom (interested / planned / tickets / attended counts)

### Add Modal
- Slides up from bottom (sheet pattern)
- Toggle at top: **SHOW** | **FESTIVAL**
- **Show fields:** Artist (autocomplete) → Tour/Event name (optional) → Venue (Places autocomplete, fills City) → Date → Status
- **Festival fields:** Festival Title (with alias autocomplete) → Venue (Places autocomplete, fills City) → Date From → Date To (defaults to same as From) → Status
- Enter key advances through fields
- Submit on final field Enter or tap ADD
- Default status for new entries: **Interested**

### Festival name autocomplete
- When typing in the festival name field (add or edit), autocomplete suggestions are drawn from two sources in order: the user's own existing festival titles already in the data, and a hardcoded alias map for common shorthand. Suggestions appear as a dropdown below the field; tap to accept.
- Hardcoded alias seeds: `glasto → Glastonbury Festival`, `primavera → Primavera Sound`, `coachella → Coachella`, `outside lands → Outside Lands`, `reading → Reading Festival`, `leeds → Leeds Festival`

### Festival date default
- When user sets the Date From field, Date To auto-populates with the same value. User only changes it if the festival is multi-day. Applies to both add modal and edit sheet.

### Tab filters
- A segmented pill row sits below the tabs on both the Upcoming and Attended tabs: `ALL · SHOWS · FESTIVALS`
- Filters the visible list to that type only. Active pill uses the green accent color (`#c8f53b`), inactive is muted.
- State is per-tab and independent. Hidden on the All tab.

### List rows
- Sorted chronologically (ascending for Upcoming, descending for Attended)
- No grouping headers
- **Shows** → green (`#c8f53b`) left accent + status pill
- **Festivals** → amber (`#f5a623`) left accent + status pill
- Festival rows with a non-empty lineup show artist count as subtext (e.g. `12 artists · The Warfield`)
- Status pill cycles on tap: `INTERESTED → PLANNED → TICKET ✓ → ATTENDED`
- **No swipe-to-delete.** Delete is only accessible inside the edit sheet.
- Tap any row to open the edit sheet

### Status pill colors
- Interested = muted purple pill (`#2a1a2e` bg, `#9b59b6` text)
- Planned = green pill (`#c8f53b`)
- Ticket ✓ = teal pill
- Attended = grey pill

### Edit sheet — upcoming shows
- Tap row → sheet slides up, all fields pre-populated and editable
- Fields: Artist, Tour, Venue, City, Country, Date, Status
- Status field taps cycle through all states inline (same as pill on list row)
- "Delete" text button in sheet header (red) → confirmation dialog before deleting
- "Save changes" primary button writes to Drive

### Edit sheet — attended events (shows and festivals)
- Tap row → sheet slides up, all fields pre-populated and editable
- Subtle "attended — limited edits" label in header (status not changeable from this view)
- All other fields are editable (title, venue, dates, city, country)
- Delete requires stronger confirmation dialog: `"This will permanently delete [event name]. Are you sure?"`
- "Save changes" primary button writes to Drive

### Edit sheet — festival lineup section
- Appears in the festival edit sheet below the date fields, for both upcoming and attended festivals
- Shows a `LINEUP · N ARTISTS` label
- Existing artists shown as removable chips (× to remove each)
- **"Fetch lineup from MusicBrainz"** button with amber dot indicator
  - On tap: queries MusicBrainz by festival name + year parsed from date field
  - Shows loading state during fetch
  - On success: displays matched event name + date for user to confirm it's the right event, then a scrollable selectable chip list of all artists found
  - Artists already in lineup are pre-selected
  - Two action buttons: **"Add N selected artists"** (adds only checked artists) and **"Add all N artists"** (adds entire returned list)
  - On large festivals (50+ artists) the chip list is scrollable with a search/filter input at the top
  - If MusicBrainz returns no match or a network error: surface a clear message and fall back to manual entry
  - Note: MusicBrainz only has past events — fetch will not work for future/upcoming festivals
- **Manual add fallback:** plain text input below the chips — type artist name, hit Enter or tap +, appends to lineup array. Reuses existing MusicBrainz artist autocomplete.

### MusicBrainz lineup fetch — implementation notes
- Event search endpoint: `https://musicbrainz.org/ws/2/event/?query=event:{name}+begin:{year}&fmt=json`
- Artist relations fetch: `https://musicbrainz.org/ws/2/event/{mbid}?inc=artist-rels&fmt=json`
- Filter relations where `type` is `performer`, `headliner`, `support act`, or `member of band`
- Respect MusicBrainz rate limit: max 1 request/second (1s delay between the two requests)
- Show event name + date in the picker before displaying artist list so user can confirm the correct event was matched

### Search
- Inline below tabs, filters in real time
- Search scope: `artist`, `festival`, `venue`, `city`, `tour`, and `lineup` array
- When a festival matches via a lineup artist (not its own title), show the matching artist name as subtext in amber: e.g. `Pixies in lineup · Worthy Farm`
- Direct title/artist matches display normally

### Visual language
- Dark theme: `#0a0a0a` background
- Font: Bebas Neue (logo/headings) + DM Mono (body)
- Shows: accent `#c8f53b` (green)
- Festivals: accent `#f5a623` (amber)
- Status states: interested = purple pill, planned = green pill, bought = teal pill, attended = grey pill

---

## Google Drive Sync

```
On load:
  1. Check localStorage for Google auth token
  2. If no token → show "Sign in with Google" screen
  3. If token → silently refresh → load setlist-data.json from Drive
  4. If file doesn't exist → create empty one

On every data change (add / edit / delete):
  1. Update in-memory state
  2. Re-render list
  3. Write updated JSON back to Drive (debounced 1s)
```

The file is stored in Drive root as `setlist-data.json`. On first load after sign-in, if the file already exists (e.g. from imported Last.fm data), it loads that history immediately.

Google Drive retains version history on the JSON file automatically. To roll back to a previous state: right-click `setlist-data.json` in Google Drive → Manage versions.

---

## History Import

330 events imported from Last.fm (2007–2025) are pre-converted and stored in `setlist-data.json`. This file is uploaded to Google Drive manually on first setup — no import UI needed.

**Source file:** `setlist-data.json` (provided separately)

**Import script used:** Python converter that mapped Last.fm event fields → SETLIST data model, with keyword-based show vs festival detection.

**Festival lineup enrichment:** Historical festival entries do not have lineup data on import. Enrich them individually by opening each festival via the edit sheet and using the Fetch Lineup button. Only enrich festivals you care about — no bulk migration required.

---

## File Structure

```
setlist/
├── index.html              # app shell + all HTML
├── styles.css              # all styles
├── js/
│   ├── app.js              # entry point, event wiring
│   ├── auth.js             # Google OAuth
│   ├── autocomplete.js     # MusicBrainz + Places + festival alias
│   ├── config.js           # API keys + Drive filename
│   ├── drive.js            # Drive read/write
│   ├── edit.js             # edit sheet + lineup + MusicBrainz fetch
│   ├── modal.js            # add modal
│   ├── render.js           # list rendering + filtering
│   ├── state.js            # shared app state
│   └── utils.js            # DOM helpers, formatters
├── specs/                  # spec delta files (version history)
├── test-fixtures.json      # test data (15 entries, all statuses/types)
├── DEV.md                  # local dev + testing guide
├── setlist-data.json       # initial data — upload to Google Drive on setup (gitignored)
└── README.md               # setup instructions
```

---

## Out of Scope (MVP)

- User accounts / multi-user
- Last.fm sync (their events API was killed in 2016)
- Setlist tracking (songs played)
- Social features
- Native app
- Offline mode / service worker
