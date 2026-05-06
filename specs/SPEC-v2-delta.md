# SETLIST — Spec Delta: v1 → v2

> Incremental changes between the original `SPEC.md` and the updated v2 spec.
> Date: 2026-05-06
> Each section notes what changed, what was added, and what was removed.

---

## Summary of Changes

| Area | Change type |
|---|---|
| Data model — `status` field | **Extended** — added `interested` state |
| Data model — `festival` field | **Updated** — now has alias autocomplete |
| Data model — `lineup` field | **New field** |
| Data model — `dateEnd` field | **Updated** — default behavior clarified |
| Stats bar | **Updated** — added interested count |
| Add modal — festival | **Updated** — alias autocomplete, festival date default |
| Festival name autocomplete | **New feature** |
| Festival date default | **New behavior** |
| Tab sub-filters (SHOWS / FESTIVALS) | **New feature** |
| List rows — status pill | **Updated** — added INTERESTED state |
| List rows — lineup subtext | **New behavior** |
| List rows — delete | **Changed** — swipe-to-delete removed; delete moved to edit sheet |
| List rows — tap to edit | **New behavior** |
| Status pill colors | **New spec section** (formalized) |
| Edit sheet — upcoming shows | **New feature** (was out of scope) |
| Edit sheet — attended events | **New feature** (was out of scope) |
| Edit sheet — festival lineup | **New feature** |
| MusicBrainz lineup fetch | **New feature** |
| Search — lineup scope | **Extended** — now searches `lineup` array |
| Search — lineup match subtext | **New behavior** |
| Visual language — interested pill | **New** |
| History import — lineup enrichment | **New note** |
| Out of scope | **Removed** "Edit existing entries" |

---

## 1. Data Model

### 1a. `status` field — added `interested` state

**Before:** `planned | bought | attended`
**After:** `interested | planned | bought | attended`

`interested` is treated as upcoming (appears in Upcoming tab alongside `planned` and `bought`).

### 1b. `festival` field — alias autocomplete

**Before:** Notes said "Free text"
**After:** Notes say "Free text with alias autocomplete"

See [Festival name autocomplete](#3-festival-name-autocomplete) for implementation.

### 1c. New field: `lineup`

```
| lineup | string[] | festival only | Optional array of artist name strings |
```

- Only on festival entries
- Populated manually or via MusicBrainz fetch
- Used by list row subtext and search

### 1d. `dateEnd` field — clarified default

**Before:** "Optional end date for multi-day"
**After:** "Optional end date; defaults to same as `date` in form"

When the user sets Date From in the add/edit form, Date To auto-populates with the same value and only needs changing for multi-day events.

### 1e. Festival entry example — add `lineup`

The canonical festival JSON example now includes a `lineup` array:

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

---

## 2. Layout / Stats Bar

**Before:** Fixed stats bar shows `planned / bought / attended` counts
**After:** Fixed stats bar shows `interested / planned / tickets / attended` counts

---

## 3. Festival Name Autocomplete (new)

When typing in the festival name field (add or edit modal), autocomplete suggestions come from two sources:

1. The user's own existing festival titles already in the data
2. A hardcoded alias map for common shorthand

Suggestions appear as a dropdown; tap to accept.

**Hardcoded alias seeds:**
| Alias | Resolves to |
|---|---|
| glasto | Glastonbury Festival |
| primavera | Primavera Sound |
| coachella | Coachella |
| outside lands | Outside Lands |
| reading | Reading Festival |
| leeds | Leeds Festival |

---

## 4. Festival Date Default (new)

When user sets the **Date From** field, **Date To** auto-populates with the same value. User only changes it if the festival spans multiple days.

Applies to both the add modal and the edit sheet.

---

## 5. Tab Sub-filters: SHOWS / FESTIVALS (new)

A segmented pill row sits below the tab bar on both the **Upcoming** and **Attended** tabs:

```
ALL · SHOWS · FESTIVALS
```

- Filters the visible list to that type only
- Active pill uses the green accent color (`#c8f53b`), inactive is muted
- State is **per-tab and independent** (Upcoming and Attended remember separate selections)
- Not shown on the **All** tab

---

## 6. List Rows — Updated Behaviors

### 6a. Status pill — added INTERESTED

**Before:** `PLANNED → TICKET ✓ → ATTENDED`
**After:** `INTERESTED → PLANNED → TICKET ✓ → ATTENDED`

### 6b. Festival lineup subtext (new)

Festival rows with a non-empty `lineup` array show artist count as subtext, e.g.:
```
12 artists
```

### 6c. Delete — swipe removed (changed)

**Before:** "Swipe left or × button to delete"
**After:** Delete is **only accessible inside the edit sheet**, behind a confirmation dialog. No swipe-to-delete on any row type.

### 6d. Tap to open edit sheet (new behavior)

Tapping any row opens an edit sheet (pre-populated, editable). Previously there was no edit flow.

---

## 7. Status Pill Colors (formalized)

| Status | Color |
|---|---|
| Interested | Muted purple pill |
| Planned | Green pill (`#c8f53b`) |
| Ticket ✓ | Teal pill |
| Attended | Grey pill |

---

## 8. Edit Sheet — Upcoming Shows (new feature)

Previously out of scope. Now: tapping any upcoming show row opens an edit sheet.

- All fields pre-populated and editable: Artist, Tour, Venue, City, Country, Date, Status
- Status field taps cycle through all states inline
- **"Delete"** text button in sheet header (red) → confirmation dialog before deleting
- **"Save changes"** primary button writes to Drive

---

## 9. Edit Sheet — Attended Events (new feature, shows and festivals)

- All fields editable except status (status not changeable from attended view)
- Subtle `attended — limited edits` label in header
- **Delete** requires stronger confirmation: `"This will permanently delete [event name]. Are you sure?"`
- **"Save changes"** primary button writes to Drive

---

## 10. Edit Sheet — Festival Lineup Section (new feature)

Appears in the festival edit sheet below the date fields, for both upcoming and attended festivals.

**Header:** `LINEUP · N ARTISTS`

**Existing lineup chips:** each artist shown as a removable chip (× to remove)

**"Fetch lineup from MusicBrainz" button** (amber dot indicator):
- Queries MusicBrainz by festival name + year parsed from the date field
- Shows loading state during fetch
- On success: displays matched event name + date for user to confirm, then a scrollable selectable chip list of all found artists
- Artists already in lineup are pre-selected
- Two actions: **"Add N selected artists"** (adds only checked) and **"Add all N artists"** (adds entire list)
- For 50+ artists: chip list is scrollable with a search/filter input at top
- On no match or network error: surfaces a clear message and falls back to manual entry

**Manual add fallback:** plain text input below chips — type artist name, hit Enter or tap +, appends to lineup array. Reuses MusicBrainz artist autocomplete from the show artist field.

---

## 11. MusicBrainz Lineup Fetch — Implementation Notes (new)

```
Event search:
  GET https://musicbrainz.org/ws/2/event/?query=event:{name}+begin:{year}&fmt=json

Artist relations:
  GET https://musicbrainz.org/ws/2/event/{mbid}?inc=artist-rels&fmt=json
```

- Filter relations where `type` is `performer`, `headliner`, or `support`
- Respect MusicBrainz rate limit: **max 1 request/second**
- Show event name + date in picker **before** displaying artist list so user can confirm the correct event

---

## 12. Search — Extended (updated)

**Before:** Searches `artist`, `festival`, `venue`
**After:** Searches `artist`, `festival`, `venue`, and `lineup` array

**New behavior — lineup match subtext:**
When a festival matches via a lineup artist (not the festival's own title), show the matching artist in amber subtext:
```
Pixies in lineup · Worthy Farm
```
Direct title/artist matches display normally (no subtext).

---

## 13. Visual Language — New Status Color

Added `interested = muted purple pill` to the status color set.

---

## 14. History Import — Lineup Enrichment Note (new)

Historical festival entries imported from Last.fm do not have lineup data. Enrich individually:
- Open each festival via the edit sheet
- Use the **Fetch Lineup** button
- Only enrich festivals you care about — no bulk migration required

---

## 15. Out of Scope — Removed Item

**Removed from out of scope:** `Edit existing entries (delete + re-add for now)`

Editing is now fully in scope via the edit sheets described above.

---

## Implementation Priority (suggested order)

1. **Data model** — add `interested` status, `lineup` field (low risk, backward-compatible)
2. **Status pill** — add INTERESTED state to cycle and color map
3. **Stats bar** — add interested count
4. **Edit sheets** — upcoming shows and attended events (highest user impact)
5. **Delete via edit sheet** — remove swipe-to-delete, wire delete to sheet
6. **Tab sub-filters** — SHOWS / FESTIVALS pill row
7. **Festival name autocomplete** — alias map + user history suggestions
8. **Festival date default** — auto-populate Date To from Date From
9. **Festival lineup section** — chips, manual add, MusicBrainz fetch
10. **MusicBrainz fetch** — implementation with rate limiting and confirm step
11. **Search lineup scope** — extend search to lineup array + match subtext
