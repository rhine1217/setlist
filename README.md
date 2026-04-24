# SETLIST

A lightweight personal concert tracker. Replaces Last.fm's abandoned events feature.

**Stack:** GitHub Pages (hosting) · Google Drive (data) · Google OAuth (auth)

---

## Setup

### 1. Google Cloud (one-time, ~10 mins)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project — name it `setlist` or anything you like
3. In the left menu → **APIs & Services → Library**
   - Search and enable **Google Drive API**
   - Search and enable **Places API**
4. Go to **APIs & Services → Credentials**
5. Click **Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins: add `https://YOUR-USERNAME.github.io`
   - Copy the **Client ID**
6. Click **Create Credentials → API Key**
   - Click the key → **Restrict key** → APIs: select **Places API**
   - Copy the **API Key**

### 2. Configure the app

Open `index.html` and replace:
```
YOUR_GOOGLE_CLIENT_ID   →  paste your OAuth Client ID
YOUR_PLACES_API_KEY     →  paste your API Key
```

### 3. Upload your data

Upload `setlist-data.json` to the **root of your Google Drive** (not inside any folder).

If starting fresh (no import), skip this step — the app will create an empty file on first sign-in.

### 4. Deploy to GitHub Pages

```bash
git init
git add index.html README.md
git commit -m "initial"
gh repo create setlist --public --push --source=.
```

Then go to the repo → **Settings → Pages → Source: main branch** → Save.

Your app will be live at `https://YOUR-USERNAME.github.io/setlist`

---

## Usage

- **Add a show:** tap `+` → fill in Artist, Venue, Date → ADD
- **Add a festival:** tap `+` → toggle to FESTIVAL → fill in Festival Name, Venue, Dates → ADD
- **Change status:** tap the status pill on any row to cycle `PLANNED → TICKET ✓ → ATTENDED`
- **Delete:** tap `×` on any row
- **Search:** type in the search bar to filter by artist, festival, or venue

---

## Data

All your data lives in `setlist-data.json` in your Google Drive. You own it entirely — back it up, export it, or move it anytime.
