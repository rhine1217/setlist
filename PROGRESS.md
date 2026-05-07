# SETLIST — Progress

Track build status, checkpoints, and what's next. Update after every Claude Code session.

---

## Status: 🟡 Checkpoint 3 in progress — feature branch ready for local testing

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
**What was built:**
- [x] Google OAuth sign-in via Google Identity Services (GIS) token client
- [x] Token stored in localStorage (`sl_token`) with expiry, auto-reused on reload
- [x] `drive.file` scope (not `drive`) — avoids Google verification requirement
- [x] Load/save `setlist-data.json` from Google Drive (multipart upload)
- [x] Creates file if it doesn't exist on first sign-in
- [x] JSON import modal on first sign-in (for pasting setlist-data.json contents)
- [x] List view with Upcoming / Attended / All tabs
- [x] Show rows (green `#c8f53b` left accent) + Festival rows (amber `#f5a623`)
- [x] Status pill cycling on tap
- [x] Slide-up add modal with Show / Festival toggle
- [x] MusicBrainz artist autocomplete (no key, User-Agent set)
- [x] Google Places venue autocomplete (new API: AutocompleteSuggestion)
- [x] City/country auto-filled from Places, editable
- [x] Date range fields for festivals
- [x] Search / filter
- [x] Stats bar
- [x] Debounced Drive writes (1s)
- [x] Dark theme, Bebas Neue + DM Mono fonts
- [x] Refactored from single `index.html` into ES modules (`js/*.js` + `styles.css`)

**Deploy:**
- [x] GitHub repo: https://github.com/rhine1217/setlist (public)
- [x] Live at: https://rhine1217.github.io/setlist
- [x] `setlist-data.json` added to `.gitignore` — never committed

**Google Cloud setup completed:**
- OAuth 2.0 Client ID created, authorized origin: `https://rhine1217.github.io`
- API key created, restricted to: Maps JavaScript API + Places API + Places API (New)
- Drive API enabled, Maps JavaScript API enabled, Places API enabled, Places API (New) enabled

---

### ✅ Checkpoint 2 — Feature Build (complete)
**Date:** 2026-05-06
**Branch:** `claude/kind-torvalds-532c07`
**What was built:**
- [x] 2A — `interested` as 4th status state; pill cycle updated; stats bar updated; default for new entries
- [x] 2B — ALL / SHOWS / FESTIVALS type filter pills on Upcoming and Attended tabs (per-tab state)
- [x] 2C — Swipe-to-delete removed; delete moved to edit sheet with confirmation dialog
- [x] 2D — Edit sheet: tap any row → slide-up sheet with all fields pre-filled; upcoming and attended variants
- [x] 2E — Festival lineup section in edit sheet: removable chips, MusicBrainz fetch with confirm flow, manual add
- [x] 2F — Festival alias autocomplete (hardcoded aliases + existing user data)
- [x] 2G — Date-To auto-fills from Date-From in add modal and edit sheet
- [x] 2H — Lineup search with amber match subtext; festival rows show artist count
- [x] `autocomplete.js` refactored to accept element ID opts (shared between add modal and edit sheet)
- [x] `js/edit.js` created as new module
- [x] `test-fixtures.json` added (15 entries covering all statuses and types)
- [x] `DEV.md` added (local server setup + test guide)
- [x] `specs/SPEC-v2-delta.md` added (v1→v2 change log)
- [x] `SPEC.md` and `DECISIONS.md` updated to reflect v2 state and committed to git

**Before merging to main:**
- [ ] Revert `js/config.js` `FILE_NAME` from `'setlist-data-dev.json'` to `'setlist-data.json'`
- [ ] Merge branch to main (user action — see merge instructions below)

---

### 🟡 Checkpoint 3 — Feature build (in progress)
**Date:** 2026-05-06
**Branch:** `claude/naughty-dhawan-bf06f8`
**What was built:**
- [x] 3A — iOS zoom fix: input `font-size` raised to 16px (Safari auto-zoom threshold); modal uses `max-height: 92dvh`
- [x] 3B — Notes field: optional free text on shows and festivals; first line shown inline on list rows in dim italic
- [x] 3C — Multi-date add: show type supports adding multiple dates; creates one entry per date on submit
- [x] 3D — Festival end-date validation: `min` attribute set dynamically on date-to; toast error if end < start in both add modal and edit sheet
- [x] 3E — Auto-attended: status auto-sets to Attended when a past date is picked (add modal + edit sheet)
- [x] 3F — Text-paste lineup: textarea in edit lineup section; paste comma/newline-separated artists and add all at once; MusicBrainz button retained
- [x] 3G — Edit type toggle: Show ↔ Festival toggle in edit sheet with field remapping; Show→Festival warns if tour value will be lost; Festival→Show warns and preserves lineup in notes field

**Before merging to main:**
- [ ] Local test: add a show with 3 dates → verify 3 entries created
- [ ] Local test: add notes to an entry → verify shown on list row
- [ ] Local test: try to set festival end date before start → verify blocked
- [ ] Local test: add a show with past date → verify auto-attended
- [ ] Local test: paste lineup text → verify chips created
- [ ] Local test: switch entry type show→festival and festival→show → verify field remapping and warnings
- [ ] Revert `js/config.js` `FILE_NAME` from `'setlist-data-dev.json'` to `'setlist-data.json'`
- [ ] Merge branch to main (user action)

---

### 🔲 Checkpoint 4 — Production verify

After merging and GitHub Pages deploys:
- [ ] Sign in at https://rhine1217.github.io/setlist
- [ ] Import historical data: paste `setlist-data.json` into import modal (330 entries)
- [ ] Verify all 4 status tabs and counts are correct
- [ ] Verify venue autocomplete works (e.g. Bill Graham → San Francisco, CA)
- [ ] Test adding a show and a festival end-to-end
- [ ] Test editing an existing attended show
- [ ] Test fetching lineup for a past festival (try Glastonbury 2023)
- [ ] Test on mobile (390px)

---

## Known Issues / Resolved

### ✅ Places API (New) — resolved
Was getting `Places API (New) has not been used in project...` error. User enabled it and it now works.

### ⚠️ MusicBrainz fetch — only works for past festivals
MusicBrainz only has past events. Fetch will not return results for upcoming/future festivals. Expected behavior; add artists manually for those.

---

## Instructions for Claude Code

When picking up this project:

1. Read `SPEC.md` first — full v2 feature and data model reference
2. Read `DECISIONS.md` — understand why things are the way they are before changing them
3. Read `PROGRESS.md` (this file) — check current checkpoint and open tasks
4. After completing a checkpoint, update this file with date and notes
5. Never change the data model without adding an entry to `DECISIONS.md`
6. **Never merge to main or push to main** — always leave that action to the user

### Key constraints to respect
- ES modules, no build step — `index.html` + `styles.css` + `js/*.js`; do NOT collapse back to a single file
- `drive.file` scope only — do NOT change to `drive` scope
- Google Drive is the only persistence layer — no other backend
- Mobile-first — test every change at 390px width
- Status cycles on tap on list rows — never a dropdown
- Shows = green `#c8f53b`, Festivals = amber `#f5a623` — load-bearing UX
- `setlist-data.json` is gitignored — never commit it
- `js/config.js` `FILE_NAME` must be `'setlist-data.json'` on main; use `'setlist-data-dev.json'` on feature branches for local testing
