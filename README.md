# Dino Times

A multiplication tables game for one specific 9-year-old who likes dinosaurs.

## What it does

- Three rooms: a Dig Site (where she answers questions), a Museum (where bones collect into skeletons), and a Sanctuary (where rare eggs hatch into dinos she names).
- 12 tables zones (1× through 12×). Each unlocks the next at 80% accuracy.
- 5–10 minute sessions. Comes back better tomorrow because eggs only tick once per play day.

## Get it on her iPad — recommended path: GitHub Pages

This takes about 10 minutes the first time. After that, updates are just dragging a new file into the website.

### Step 1: Make a free GitHub account

1. Go to https://github.com/signup
2. Use any email, pick a username, verify the email.

### Step 2: Create a repository

1. Click the **+** at the top right of GitHub, then **New repository**.
2. **Repository name:** `dino-times`
3. **Visibility:** Public.
4. Check **Add a README file**.
5. Click **Create repository**.

### Step 3: Upload the game files

1. On your new repo page, click **Add file** → **Upload files**.
2. Drag and drop everything in the `dino-times` folder EXCEPT:
   - `node_modules/` (developer-only)
   - `docs/`, `package.json`, `package-lock.json`, `vite.config.js`, `scripts/` (developer-only — not harmful, just unused)
   - `.superpowers/` (already gitignored)
3. Bottom of the page: **Commit changes**.

### Step 4: Turn on GitHub Pages

1. In the repo, click **Settings** (top right of the repo page).
2. Left sidebar: **Pages**.
3. Under **Build and deployment** → **Source**, pick **Deploy from a branch**.
4. **Branch:** `main` and folder `/ (root)`. Save.
5. Wait 1 minute. The page now shows: **Your site is live at `https://<your-username>.github.io/dino-times/`**.

### Step 5: Install on the iPad

1. Open Safari on the iPad. Go to the URL from step 4.
2. Tap the **Share** button (square with up arrow).
3. Scroll down → **Add to Home Screen** → **Add**.
4. Done. The icon on her home screen opens it like a real app, works offline, and updates next time it's online.

## Fallback path: AirDrop the file

If GitHub Pages feels like too much:
1. (Developer step) Bundle the site into a single `dino-times.html` file. _v1 doesn't ship this packaging — see notes in the spec._
2. AirDrop or email the file to the iPad.
3. Open it in Safari from the Files app.
4. Less polished: no app icon, no auto-update.

## Developer notes

```bash
npm install         # one-time
npm run dev         # start local dev server (http://localhost:5173)
npm test            # run unit tests
```

State lives in `localStorage` under key `dinoTimes.state.v1`. To reset: DevTools → Application → Local Storage → delete the key.
