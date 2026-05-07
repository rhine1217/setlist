# SETLIST — Spec Delta: v2 → v3

> Incremental changes introduced in Checkpoint 3 (branch `claude/naughty-dhawan-bf06f8`).
> Date: 2026-05-06
> Each section notes what changed, what was added, and what was removed.

---

## Summary of Changes

| Area | Change type |
|---|---|
| Data model — `notes` field | **New field** on both shows and festivals |
| Data model — show ID format | **Updated** — multi-date creates unique IDs via `Date.now().toString(36) + random suffix` |
| Add modal — show date | **Changed** — single date → multi-date list (creates one entry per date) |
| Add modal — notes | **New field** |
| Festival end-date validation | **New behavior** — `min` attribute enforced + toast error if end < start |
| Auto-attended | **New behavior** — status auto-sets to Attended when a past date is picked |
| List rows — notes inline | **New behavior** — first line of notes shown in dim italic below venue subtext |
| Edit sheet — type toggle | **New feature** — Show ↔ Festival toggle with field remapping and warnings |
| Edit sheet — notes field | **New field** |
| Edit sheet — lineup paste | **New feature** — textarea for pasting comma/newline-separated artist lists |
| Mobile — iOS zoom fix | **Bug fix** — all inputs set to `font-size: 16px`; modal uses `max-height: 92dvh` |

---

## 1. Data Model

### 1a. New field: `notes`

```
| notes | string | optional | Free text; available on both shows and festivals |
```

- Optional on both show and festival entries
- Free text; intended for things like on-sale dates, who you're going with, ticket info
- Displayed on list rows as a single truncated line in dim italic text (first line of the notes string)
- Full notes visible and editable in the edit sheet

**Updated show example:**
```json
{
  "id": "1714000000000",
  "type": "show",
  "artist": "black rebel motorcycle club",
  "venue": "The Warfield",
  "city": "San Francisco, CA",
  "date": "2025-10-25",
  "status": "interested",
  "source": "manual",
  "notes": "on sale Friday, going with Leila"
}
```

**Updated festival example:**
```json
{
  "id": "1714000000001",
  "type": "festival",
  "festival": "Glastonbury 2025",
  "date": "2025-06-25",
  "dateEnd": "2025-06-29",
  "status": "interested",
  "source": "manual",
  "notes": "Leisa has tickets, camping in Park"
}
```

### 1b. Show ID format — multi-date entries

When adding multiple show dates at once, IDs use `Date.now().toString(36) + Math.random().toString(36).slice(2, 6)` to avoid collisions when creating entries in the same tick.

---

## 2. Add Modal — Multi-date Shows (changed)

**Before:** Single date input field labeled "Date".

**After:** Date is now a list. Starts with one empty date input. A "+ Add another date" link below the list appends new rows. Each extra row has a `×` remove button (hidden when only one row exists).

On submit, the app creates **one separate show entry per date**, all sharing the same artist, tour, venue, city, and status. Each gets its own `id`.

Festival type is unchanged — still uses From / To date range.

---

## 3. Notes Field — Add Modal & Edit Sheet (new)

A **Notes** textarea (2 rows, non-resizable) appears:
- In the **add modal**: below the Status buttons, above the Add button. Placeholder: `on sale dates, going with…`
- In the **edit sheet**: below the lineup section (for festivals) or below the status (for shows), above the Save button. Same placeholder.

On list rows, only the **first line** of notes is shown. Empty `notes` fields render nothing — no indicator, no empty space.

---

## 4. Festival End-Date Validation (new)

**Before:** No validation — it was possible to save a festival with an end date before its start date.

**After:**
- When the user picks a **Date From** value, the **Date To** input has its `min` attribute set to match, so the native date picker won't allow an earlier selection.
- On submit (add modal) and save (edit sheet), if `dateTo < dateFrom`, an **inline error** is shown directly below the To field: `"End date can't be before start date"`. The To input gets a red border (`.fi.error`). Focus moves to the To field.
- The error clears automatically when the user changes the To field value.
- The error also clears when the modal is reset (on close) or when the edit sheet is reopened.
- Error text is rendered by a `<span class="field-err">` element placed inside the `.fg` wrapper immediately after the input.

---

## 5. Auto-Status on Date Pick (updated)

When a date is picked in the **add modal** or **edit sheet**, the Status automatically updates based on whether the date is in the past or future.

- **Past date** → status switches to **Attended**
- **Future date** → status switches to **Interested**
- Applies to: show date field in add modal, festival Date From in add modal, show date in edit sheet, festival Date From in edit sheet
- Only fires when the status section is visible (i.e., not on entries already locked to attended)
- Partial / invalid years (e.g. year < 1900, such as when the user has only typed "20" into the year field) are ignored — no status change fires until a plausible 4-digit year is present
- The user can manually override the status after the auto-set

---

## 6. List Rows — Notes Inline (new behavior)

When an entry has a `notes` field, the first line of notes text is shown below the existing venue/city subtext line:

```
[row-title]  Black Rebel Motorcycle Club
[row-sub]    The Warfield · San Francisco, CA
[row-note]   on sale Friday, going with Leila       ← new, dim italic
```

Only the first line (before the first newline) is shown. Overflow is truncated with ellipsis. Entries without notes render no extra line.

---

## 7. Edit Sheet — Type Toggle: Show ↔ Festival (new feature)

A **Show | Festival** toggle (matching the add modal's toggle style) now appears at the top of the edit sheet, below the delete/label header.

**Field remapping on switch:**

| Switch direction | What happens |
|---|---|
| Show → Festival | Artist name value moves to Festival name field; Tour field clears; Date moves to Date From; festival date range and lineup section appear |
| Festival → Show | Festival name value moves to Artist field; Date From moves to Date field; Date To and lineup section disappear |

**Warnings:**
- **Show → Festival:** If the Tour field has a value, a confirmation dialog fires: `"Tour name '[value]' will be removed. Switch to Festival?"` If cancelled, the toggle reverts.
- **Festival → Show:** Always shows: `"Switch to Show? The lineup (N artists) will be moved to Notes."` (If lineup is empty: `"Switch to Show?"`). If confirmed, lineup artists are joined with `, ` and appended to the Notes field before clearing.

The `type` field on the saved entry reflects the toggle state at time of save, not the original type.

---

## 8. Edit Sheet — Lineup: Text Paste (new feature)

A new **Paste list** section appears at the bottom of the lineup section in the festival edit sheet, separated by a thin divider line.

- A 2-row textarea with placeholder `arctic monkeys, the strokes, pj harvey…`
- A full-width **"+ Add all from list"** button below it
- On tap: text is split by commas, semicolons, and newlines; each token is trimmed; duplicates (already in lineup) are skipped; remaining artists are added as lineup chips; textarea clears; toast shows `"Added N artist(s)."`

The **MusicBrainz fetch button is retained** for past festivals where the database has event data.

---

## 9. Mobile — iOS Zoom Fix (bug fix)

**Before:** All modal form inputs had `font-size: 14px`. iOS Safari auto-zooms any page when an input with `font-size < 16px` is focused. This caused the modal to appear larger than the screen and left the main page zoomed after the modal closed.

**After:**
- All `.fi` (form inputs / textareas) changed to `font-size: 16px`
- Search input changed to `font-size: 16px`
- Modal `max-height` changed from `92vh` to `92vh; max-height: 92dvh` — uses dynamic viewport height (accounts for keyboard), with `vh` fallback for older browsers

---

## 10. Auth — Token Expiry Note (informational)

Google OAuth access tokens expire after ~1 hour. The token is stored in `localStorage` under `sl_token`. As a PWA, localStorage persists between sessions until the user manually clears storage. Re-authentication prompts approximately once per hour during active use; the sign-in is one-tap since Google remembers the account. A server-side refresh token would avoid this but requires a backend — out of scope.

---

## Deferred (not in v3)

### Lineup paste — fuzzy artist name matching
**Proposed:** When pasting a comma/newline-separated artist list, each name would be sent to the MusicBrainz search API; if the top result score ≥ 85, the canonical MB name replaces the raw input (e.g. "artic monekys" → "Arctic Monkeys").

**Why deferred:** Requires N async API calls per paste, adding latency and complexity (loading state, error handling per artist, possible false positives). The manual add input already benefits from live MB autocomplete for typo correction. Deferred to a future checkpoint.
