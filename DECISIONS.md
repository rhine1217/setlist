# SETLIST — Decisions Log

A record of every significant design and technical decision made, and why. Update this file whenever a decision is revisited or reversed.

---

## Architecture

### ES modules (no build step)
**Decision:** The app is split across `index.html`, `styles.css`, and `js/*.js` ES modules loaded via `<script type="module">`.
**Why:** GitHub Pages serves static files. No bundler, no npm, no CI pipeline. ES modules give clean file separation without tooling. Anyone can fork and edit without a build step.
**Changed from:** Originally a single `index.html` (v1). Refactored to modules at Checkpoint 1 end when the file grew too large to manage.

### Google Drive as database
**Decision:** Use a single `setlist-data.json` file in the user's Drive root instead of a proper database.
**Why:** No backend, no Cloudflare Worker, no cost. User owns their data. Works across every device they're signed into Google on.
**Trade-off:** Not suitable for multi-user or sharing. Fine for personal use.
**Considered:** Cloudflare D1, Supabase, GitHub Gist. Drive won because it requires no new accounts and the user already has it.

### `drive.file` scope (not `drive`)
**Decision:** OAuth scope is `drive.file` — only files the app created.
**Why:** The broader `drive` scope triggers Google's OAuth verification process for external apps, which requires a review. `drive.file` avoids this entirely. The app only needs to access its own file.

### No Last.fm sync
**Decision:** Don't attempt to write back to Last.fm.
**Why:** Last.fm killed their events API in 2016. No write path exists.

---

## Data Model

### Show vs Festival as explicit types
**Decision:** A toggle on the add modal switches between Show and Festival, which changes the form fields shown.
**Why:** Festival rows need different fields (Festival Title instead of Artist, date range instead of single date).
**Festival fields:** Festival Title + Venue/City + Date range + Status + optional Lineup
**Show fields:** Artist + Tour/Event name (optional) + Venue/City + Date + Status

### Four status states (v2)
**Decision:** Status cycle is `interested → planned → bought → attended`.
**Why:** "Interested" captures the pre-planning state — you've heard about a show and want to track it before committing. Previously the cycle was `planned → bought → attended` (3 states).
**Changed from:** v1 had 3 statuses. `interested` added in v2 to reflect real tracking behavior.

### Lineup field on festivals (v2)
**Decision:** Festivals have an optional `lineup: string[]` field.
**Why:** Festival lineups are the primary reason you'd look up a past festival entry. Enables lineup search and artist count subtext on rows.
**Population:** Manually via edit sheet chips input, or via MusicBrainz fetch for past festivals.

### City as separate field, auto-filled by Places
**Decision:** City is its own field but auto-populated when user picks a venue from Google Places autocomplete.
**Why:** Enables future filtering by city. Manual override still possible.

### Country stored but not shown in add modal (v1) / shown in edit sheet (v2)
**Decision:** In the add modal, country is stored silently from Places. In the edit sheet, city and country are separate editable inputs.
**Why:** Keeping the add modal minimal; the edit sheet is where corrections happen.

### Tour/Event name is optional on shows
**Decision:** Tour name is a second optional field on shows, not required.
**Why:** Most shows don't need it. Useful for "The Black Parade Tour" entries.

### Status cycles on tap (no dropdown)
**Decision:** Tapping the status pill on a list row cycles through all 4 states.
**Why:** Faster than a dropdown on mobile.

### `source` field (`manual` | `lastfm`)
**Decision:** Every entry has a `source` field.
**Why:** Useful for debugging imports and future filtering.

---

## UX

### Slide-up modal for add form
**Decision:** Floating `+` FAB opens a bottom sheet modal.
**Why:** Mobile-first. With 5+ fields, an inline form would dominate the screen.

### Edit sheet via row tap (v2)
**Decision:** Tapping any row opens a slide-up edit sheet. Delete is only accessible inside the edit sheet.
**Why:** Every entry needs to be editable. Putting delete inside the sheet (with a confirmation) prevents accidental deletion.
**Changed from:** v1 had swipe-to-delete and no edit flow ("delete + re-add" workaround).

### No swipe-to-delete (v2)
**Decision:** Swipe-to-delete removed entirely.
**Why:** Too easy to trigger accidentally on mobile, especially in a scrollable list. Delete now requires intentional action: tap row → edit sheet → red Delete button → confirm dialog.

### Attended edit sheet is read-only on status (v2)
**Decision:** When editing an attended entry, the status field is hidden. You can edit all other fields but not change the status away from attended.
**Why:** Attended is a terminal state for historical entries. Changing it accidentally would move it out of the Attended tab. Stronger delete confirmation on attended entries for the same reason.

### Festival alias autocomplete (v2)
**Decision:** Festival name field autocompletes from two sources: user's existing festival titles + hardcoded alias map.
**Why:** Users type shorthand ("glasto", "primavera") and expect the full name. Existing titles prevent duplicate festival name variations.

### Festival date-to defaults to date-from (v2)
**Decision:** When setting Date From on a festival, Date To auto-fills with the same value.
**Why:** Single-day festivals are common enough that requiring the user to set both is friction. User only changes Date To for multi-day events.

### Type filter pills per tab (v2)
**Decision:** ALL / SHOWS / FESTIVALS segmented pills on the Upcoming and Attended tabs. State is independent per tab.
**Why:** With a mix of shows and festivals, users often want to see just one type. Per-tab state means filtering Upcoming doesn't reset Attended.

### No grouping on list rows
**Decision:** Tabs are chronological with no month/year headers.
**Why:** Headers add visual noise. Dates on each row are sufficient context.

### Show vs Festival differentiated by row accent color
**Decision:** Shows get green (`#c8f53b`) left border accent, festivals get amber (`#f5a623`).
**Why:** Immediately scannable. Color carries meaning without needing a tag.

### Festival date as range
**Decision:** Festivals have `date` (start) and `dateEnd` (end) fields.
**Why:** Multi-day festivals are the norm. Showing "Jun 27–29" is more accurate than a single date.

---

## History Import

### One-time JSON drop, no import UI
**Decision:** 330 Last.fm events were converted to `setlist-data.json` and uploaded to Drive manually on first setup.
**Why:** The import is a one-time migration, not an ongoing workflow.

### Last.fm scraping approach
**Decision:** Used a browser console script (run while logged into Last.fm) to scrape all event pages across 2007–2025.
**Why:** Last.fm's robots.txt blocks external crawlers. Running fetch() from the browser session bypasses this — it's the user's own data.

### Festival detection via keyword matching
**Decision:** Shows are classified as festivals if their title contains keywords like "festival", "glastonbury", "coachella", etc.
**Result:** 28 festivals, 302 shows from 330 total events.

---

## Future Decisions (Pending)

- **Offline support:** Service worker + local cache. Deferred post-MVP.
- **Last.fm artist data:** Pull top artists to power recommendations. API still works for read operations.
- **CSV export:** Let user download their data. Simple JSON → CSV conversion.
- **Multiple festivals same weekend:** Date range overlap handling not yet defined.
