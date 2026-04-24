# SETLIST — Progress

Track build status, checkpoints, and what's next. Update after every Claude Code session.

---

## Status: 🟡 Checkpoint 1 complete — deployed, debugging Google APIs

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

### 🔲 Checkpoint 2 — First data import + verify full flow
**Goal:** Get the 330 imported shows into the app
**Steps:**
- [ ] Sign in at https://rhine1217.github.io/setlist
- [ ] On first sign-in, import modal appears — paste contents of `setlist-data.json`
- [ ] Verify 330 shows load and save to Google Drive
- [ ] Verify venue autocomplete works (Bill Graham → fills city: San Francisco, CA)
- [ ] Verify adding a new show works end-to-end
- [ ] Test on mobile (390px)

---

### 🔲 Checkpoint 3 — Polish
**Remaining items:**
- [ ] Error states (Drive unavailable)
- [ ] Offline graceful degradation
- [ ] Test swipe-to-delete on mobile

---

## Known Issues / Blockers

### Places API (New) enablement
The venue autocomplete uses the new `AutocompleteSuggestion` API (March 2025).
This requires **Places API (New)** enabled separately from the legacy Places API.
Error seen: `Places API (New) has not been used in project...`
**Fix:** Enable "Places API (New)" at console.developers.google.com/apis/api/places.googleapis.com/overview?project=142418659339
**Status:** User was enabling this at end of session — verify it works next session.

### Data not yet imported
`setlist-data.json` is local only (gitignored). User still needs to paste it into the import modal on first sign-in to get their 330 shows into the app.

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
