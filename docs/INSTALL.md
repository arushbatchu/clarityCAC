# Put Clarity online and on your phone

## 1. Publish with GitHub Pages (about 5 minutes)

1. Create a **public** repo on github.com named `clarity`. Don't add a README.
2. Upload: on the empty repo page click **uploading an existing file**, then drag in **everything inside** the `clarity` folder (not the folder itself). Commit.
   - Mac hides the `.github` folder in Finder. Press **Cmd+Shift+.** to show it so it gets uploaded too. If it doesn't make it, the app still works; you just won't get the automatic test runs.
3. Go to **Settings → Pages**. Source: **Deploy from a branch**. Branch: **main**, folder: **/ (root)**. Save.
4. Wait about a minute, refresh the Pages settings, and you'll see `https://<you>.github.io/clarity/`. That page forwards to the app.

If GitHub Pages gives you trouble, the instant backup is https://app.netlify.com/drop: drag the `frontend/public` folder onto the page and you get a live https link right away.

## 2. Install on a phone

**iPhone:** open the link in **Safari** → Share button → **Add to Home Screen** → Add.
**Android:** open the link in **Chrome** → tap **Install** on the banner (or menu → Install app).
**Computer:** Chrome or Edge shows an install icon at the right end of the address bar.

Check it worked: turn on airplane mode, open Clarity from your home screen, run a scenario.

## 3. Offline single file (no internet, no server)

```bash
cd frontend
npm install
npm run standalone
```
Double-click `frontend/dist/clarity-standalone.html`. Installing to the home screen needs the online link; everything else works from this file.

## 4. Changing the code

- Changed rules, weights, or copy in `backend/clarity/`? Run `python3 backend/scripts/codegen.py`, then `cd frontend && npm run build`.
- Changed anything in `frontend/src/`? Run `cd frontend && npm run build`.
- Commit `frontend/public/js/` too. GitHub Pages serves those compiled files directly.
