# SETLIST — Progress

Track build status, checkpoints, and what's next. Update after every Claude Code session.

---

## Status: 🟡 Checkpoint 1 complete — spec expanded, Checkpoint 2 is feature build

---

## Checkpoints

### ✅ Checkpoint 0 — Discovery & Spec (complete)
**Date:** 2026-04-24
**What happened:**
- Defined app concept: lightweight Last.fm events replacement
- Confirmed Last.fm events API is dead (killed 2016) — no sync possible
- Chose stack: GitHub Pages + Google Drive + Google Identity Services
- Designed data model: show vs festival types, all fields defined
- Designed UX: slide-up modal, tab navigation, color-coded rows
- Scraped 330 Last.fm events (2007–2025) via browser console script
- Converted to `setlist-data.json` (302 shows, 28 festivals, all `attended`)
- Created SPEC.md, DECISIONS.md, PROGRESS.md

**Files produced:**
- `setlist-data.json` — 330 imported events (local only, NOT committed to git — gitignored)
- `index.html` — full app built in session 2

---

### ✅ Checkpoint 1 — Core App (complete)
**Date:** 2026-04-24
**What was built (`index.html`):**
- [x] Google OAuth sign-in via Google Identity Services (GIS) token client
- [x] Token stored in localStorage (`sl_token`) with expiry, auto-reused on reload
- [x] `drive.file` scope (not `drive`) — avoids Google verification requirement
- [x] Load/save `setlist-data.json` from Google Drive (multipart upload)
- [x] Creates file if it doesn't exist on first sign-in
- [x] JSON import modal on first sign-in (for pasting setlist-data.json contents)
- [x] List view with Upcoming / Attended / All tabs
- [x] Show rows (green `#c8f53b` left accent) + Festival rows (amber `#f5a623`)
- [x] Status pill cycling (planned → ticket ✓ → attended) on tap
- [x] Slide-up add modal with Show / Festival toggle
- [x] MusicBrainz artist autocomplete (no key, User-Agent set)
- [x] Google Places venue autocomplete (new API: AutocompleteSuggestion)
- [x] City/country auto-filled from Places, editable
- [x] Date range fields for festivals
- [x] Delete entries (× button on hover, swipe left on mobile)
- [x] Search / filter
- [x] Stats bar (planned / bought / attended counts)
- [x] Debounced Drive writes (1s)
- [x] Sign out button
- [x] Dark theme, Bebas Neue + DM Mono fonts

**Deploy:**
- [x] GitHub repo: https://github.com/rhine1217/setlist (public)
- [x] Live at: https://rhine1217.github.io/setlist
- [x] `setlist-data.json` added to `.gitignore` — never committed

**Google Cloud setup completed:**
- OAuth 2.0 Client ID created, authorized origin: `https://rhine1217.github.io`
- API key created, restricted to: Maps JavaScript API + Places API + Places API (New)
- Drive API enabled
- Maps JavaScript API enabled
- Places API enabled
- Places API (New) enabled (separate from legacy Places API — required for new AutocompleteSuggestion)

---

### 🔲 Checkpoint 2 — Feature build (START HERE next session)

**Context:** The spec was updated after Checkpoint 1. Several features in the spec are not yet implemented in `index.html`. This checkpoint is pure coding — no new Google Cloud setup needed.

**Read `index.html` in full before starting** (single file, ~1100 lines). Then implement the items below in order.

---

#### 2A — `interested` status (4th state)

Current code has 3 statuses: `planned → bought → attended`. Spec requires 4: `interested → planned → bought → attended`.

- `interested` = upcoming (show before date, status = interested)
- Upcoming tab filter: include `status === 'interested'` alongside `planned` and `bought`
- Stats bar: add **Interested** count (currently only Planned / Ticket / Attended)
- Pill color: muted purple — add CSS var `--purple: #9b59b6` and class `.pill.interested { background: #2a1a2e; color: #9b59b6; }`
- Add modal status buttons: add `Interested` as first option, default to `interested` for new entries
- Cycle order: `interested → planned → bought → attended` (wraps back to interested)
- `s-btn` active class for interested: `on-interested { background: #2a1a2e; color: #9b59b6; border-color: #9b59b6; }`

---

#### 2B — Type filter pills (Upcoming + Attended tabs)

Spec: a `ALL · SHOWS · FESTIVALS` segmented pill row below the tabs row on Upcoming and Attended tabs only (not All tab).

- Add HTML row below `.tabs` div, hidden on All tab
- State: `typeFilter = 'all'` per-tab (reset when switching tabs)
- Active pill: green accent `#c8f53b` with black text; inactive: muted
- Filter `filtered()` to apply type filter after tab filter
- CSS: `.type-pills { display:flex; gap:8px; padding:8px 16px; }` `.type-pill { font-family:'Bebas Neue'; font-size:14px; padding:4px 12px; border-radius:20px; border:1px solid var(--border); background:none; color:var(--dim); cursor:pointer; }` `.type-pill.on { background:var(--green); color:#000; border-color:var(--green); }`

---

#### 2C — Remove swipe-to-delete

Spec says: **No swipe-to-delete on any row type.** Delete is only inside the edit sheet.

- Remove `initSwipe()` function and all calls to it
- Remove `.del-reveal` div from `rowHTML()`
- Remove `.row-wrap`, `.del-reveal` CSS
- Remove `.btn-del` (desktop hover ×) from rows — delete moves to edit sheet only
- Rows should be tappable to open edit sheet (wire up click handler on `.row`)

---

#### 2D — Edit sheet (tap row → slide-up sheet)

Spec: tap any row opens an edit sheet (same slide-up modal pattern). Different content for upcoming vs. attended.

**Upcoming shows edit sheet:**
- Fields: Artist, Tour, Venue, City, Country, Date, Status
- Status taps cycle inline (same 4-state cycle)
- Red "Delete" text button in sheet header → confirmation `confirm()` before deleting
- "Save changes" primary button → updates entry in `setlist`, calls `scheduleSave()`, closes sheet

**Attended events edit sheet (shows + festivals):**
- Small grey label in header: `attended — limited edits`
- All fields editable EXCEPT status (no status control shown)
- Delete requires stronger confirm: `"This will permanently delete [event name]. Are you sure?"`

**Festival edit sheet (upcoming + attended):**
- Same fields as show but: Festival name, Venue, City, Country, Date From, Date To, Status (if upcoming)
- Plus lineup section (see 2E below)

**Implementation notes:**
- Reuse the existing `.modal` / `.backdrop` pattern — add a second modal `#edit-modal` / `#edit-backdrop`
- Store currently-editing entry id in `let editId = null`
- On open: populate all fields from entry data
- MusicBrainz artist autocomplete reused in artist field
- Places autocomplete reused in venue field
- Country field: add a `country-edit-in` input (currently city/country are separate stored vars, make them proper inputs in edit sheet)

---

#### 2E — Festival lineup section (inside festival edit sheet)

Appears below date fields for all festival edits (upcoming + attended).

**Structure:**
- `LINEUP · N ARTISTS` label
- Existing artists as removable chips: `[Artist Name ×]` — × removes from lineup array
- **"Fetch lineup from MusicBrainz"** button (amber dot indicator)
- **Manual add:** text input + Enter/+ button → appends to lineup, uses MusicBrainz autocomplete

**MusicBrainz fetch flow:**
1. Tap fetch button → show loading state
2. Query: `https://musicbrainz.org/ws/2/event/?query=event:{festivalName}+begin:{year}&fmt=json`
   - `festivalName` = festival title from edit field
   - `year` = parsed from date field (first 4 chars)
3. On results: show matched event name + date for user to confirm correct event
4. Fetch artist relations: `https://musicbrainz.org/ws/2/event/{mbid}?inc=artist-rels&fmt=json`
   - Filter where `relation.type` is `performer`, `headliner`, or `support`
   - Extract `relation.artist.name`
5. Show scrollable selectable chip list; pre-select artists already in lineup
6. Two buttons: **"Add N selected"** and **"Add all N"**
7. On 50+ artists: add search/filter input at top of chip list
8. On no results / network error: show message, fall back to manual entry only
9. Rate limit: max 1 req/sec (use `await new Promise(r => setTimeout(r, 1000))` between the two MB requests)

---

#### 2F — Festival alias autocomplete (add + edit)

Spec: festival name field autocomplete draws from two sources:
1. User's existing festival titles in `setlist` array
2. Hardcoded alias map

Aliases to hardcode:
```js
const FEST_ALIASES = {
  'glasto': 'Glastonbury Festival',
  'primavera': 'Primavera Sound',
  'coachella': 'Coachella',
  'outside lands': 'Outside Lands',
  'reading': 'Reading Festival',
  'leeds': 'Leeds Festival',
};
```

Logic: on input in `#fest-in` (and `#fest-edit-in` in edit sheet):
- Filter alias keys that start with input (case-insensitive) → show alias value as suggestion
- Filter existing festival titles in `setlist` that include input → show as suggestions
- Deduplicate, show in AC dropdown (reuse `showAC()`)

---

#### 2G — Festival date-to auto-fill

When user changes `#date-from-in` in add modal (or equivalent in edit sheet), auto-set `#date-to-in` to same value if it's currently empty or equal to the old from value.

```js
$('date-from-in').addEventListener('change', e => {
  const to = $('date-to-in');
  if (!to.value || to.value === previousDateFrom) to.value = e.target.value;
  previousDateFrom = e.target.value;
});
```

---

#### 2H — Festival row subtext + lineup search

**Row subtext:** Festival rows with `lineup` array length > 0 should show `N artists` as subtext instead of (or after) venue/city. Update `rowHTML()`:
```js
const festSub = e.lineup?.length ? `${e.lineup.length} artists` : sub;
```

**Search includes lineup:** Update `filtered()` search to also check `e.lineup` array:
```js
(e.lineup || []).some(a => a.toLowerCase().includes(q))
```

**Lineup match subtext:** When a festival matches via lineup (not title/venue), show the matching artist in amber as row subtext:
```js
// In rowHTML, if matchedViaLineup:
`<div class="row-sub" style="color:var(--amber)">${matchedArtist} in lineup · ${esc(e.venue)}</div>`
```
This requires `filtered()` to return match metadata alongside entries.

---

### 🔲 Checkpoint 3 — Data import + verify

After Checkpoint 2 is coded and deployed:
- [ ] Sign in at https://rhine1217.github.io/setlist
- [ ] Import modal appears — paste contents of `setlist-data.json` (330 entries)
- [ ] Verify counts load correctly
- [ ] Verify venue autocomplete works (Bill Graham → San Francisco, CA)
- [ ] Test adding a show end-to-end
- [ ] Test editing an existing show
- [ ] Test fetching lineup for a festival
- [ ] Test on mobile (390px)

---

## Known Issues / Blockers

### Places API (New) — likely resolved
Was getting `Places API (New) has not been used in project...` error. User enabled it at end of last session. Verify it works before building more on top of it.

### Data not yet imported
`setlist-data.json` is local only (gitignored). User needs to paste into import modal on first sign-in.

---

## Instructions for Claude Code

When picking up this project:

1. Read `SPEC.md` first — full feature and data model reference
2. Read `DECISIONS.md` — understand why things are the way they are before changing them
3. Read `PROGRESS.md` (this file) — check current checkpoint and open tasks
4. After completing a checkpoint, update this file with date and notes
5. Never change the data model without adding an entry to `DECISIONS.md`

### Key constraints to respect
- Single `index.html` — no build step, no separate CSS/JS files
- `drive.file` scope only — do NOT change to `drive` scope
- Google Drive is the only persistence layer — no other backend
- Mobile-first — test every change at 390px width
- Status cycles on tap — never a dropdown
- Shows = green `#c8f53b`, Festivals = amber `#f5a623` — load-bearing UX
- `setlist-data.json` is gitignored — never commit it

### Architecture decisions made this session
- Switched from `drive` to `drive.file` scope to avoid Google verification/test-user friction
- Added JSON paste import modal (shown when Drive file is empty) to load historical data
- Migrated Places from deprecated `AutocompleteService` to new `AutocompleteSuggestion` API
- Maps JS API loaded with `loading=async`, Places library loaded via `importLibrary('places')`
