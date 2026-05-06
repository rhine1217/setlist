# SETLIST — Local Dev Guide

How to run the branch locally and test against isolated data.

---

## One-time setup: add localhost to Google Cloud

The app needs your Google OAuth client to allow `localhost`.

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) → your project → **APIs & Services → Credentials**
2. Click your **OAuth 2.0 Client ID**
3. Under **Authorized JavaScript origins**, add:
   ```
   http://localhost:8080
   ```
4. Save. Changes propagate in ~5 minutes.

---

## Run the local server

From the project root (or worktree root):

```bash
python3 -m http.server 8080
```

Then open: **http://localhost:8080**

> The app must be served over HTTP — opening `index.html` directly as a `file://` URL will break ES module imports and Google OAuth.

---

## Test data

This branch uses `setlist-data-dev.json` on your Google Drive (set in `js/config.js`). This is completely separate from your production `setlist-data.json`.

A **DEV** badge appears in the app header when using the dev file, so you can never confuse the two.

**To load test data on first sign-in:**

1. Sign in with Google
2. The import modal appears (Drive file is empty on first use)
3. Open `test-fixtures.json` from this repo, copy the contents
4. Paste into the import modal → tap **Import**
5. You'll get 15 test entries covering all statuses, shows, and festivals (some with lineups)

**Test fixture coverage:**

| Type | Status | Count |
|---|---|---|
| Show | interested | 2 |
| Show | planned | 1 |
| Show | bought | 2 |
| Show | attended | 4 |
| Festival | interested | 1 |
| Festival | planned | 1 |
| Festival | attended | 3 (2 with lineup, 1 without) |

---

## What to test (Checkpoint 2 features)

### 2A — Interested status
- [ ] Add a show → default status is now **Interested**
- [ ] Pill cycles: Interested → Planned → Ticket ✓ → Attended
- [ ] Interested events appear in **Upcoming** tab
- [ ] Stats bar shows 4 counts including Interested

### 2B — Type filter pills
- [ ] On Upcoming tab: ALL / SHOWS / FESTIVALS pills appear below tabs
- [ ] Filter works, active pill highlights green
- [ ] Switching tabs resets pill context independently
- [ ] Pills are hidden on the **All** tab

### 2C — Delete via edit sheet only
- [ ] Swipe-to-delete is gone on mobile
- [ ] No × button on desktop hover
- [ ] Delete only available inside the edit sheet

### 2D — Edit sheet
- [ ] Tap any row → edit sheet slides up, all fields pre-filled
- [ ] Edit a show: change artist, venue, date, status → Save → reflects in list
- [ ] Attended entry: status field is hidden, "attended — limited edits" label shows
- [ ] Delete from edit sheet: attended entries show stronger confirm message

### 2E — Festival lineup
- [ ] Tap a festival → edit sheet shows LINEUP section
- [ ] Existing lineup shown as removable chips
- [ ] × chip removes artist, count updates
- [ ] Manual add: type artist name, Enter or + appends to lineup
- [ ] MusicBrainz fetch: enter festival name + date, tap Fetch, confirm event, select artists

### 2F — Festival alias autocomplete
- [ ] In add modal, type "glasto" → suggests "Glastonbury Festival"
- [ ] Type "primo" → suggests "Primavera Sound"
- [ ] Existing festival titles in your data appear as suggestions

### 2G — Festival date-to default
- [ ] Set Date From → Date To auto-fills with same date
- [ ] Works in both add modal and edit sheet

### 2H — Lineup search + subtext
- [ ] Search "Arctic Monkeys" → Glastonbury 2023 appears
- [ ] Matching artist shown in amber as subtext: "Arctic Monkeys in lineup · Worthy Farm"
- [ ] Festival rows with lineup show "N artists" subtext

---

## Switching back to production

Before merging to main, revert `js/config.js`:

```js
export const FILE_NAME = 'setlist-data.json'; // production
```

The DEV badge disappears automatically once this is set to the production filename.
