# Quiet Sudoku

Ad-free sudoku as a single static page. No backend, no account, no tracking.

- Unlimited puzzles generated in the browser (pure code: randomised backtracking fill, symmetric digging with a uniqueness check, singles-only grader for difficulty).
- Four levels: Easy 40 clues, Medium 33, Hard 28, Expert 24.
- Pencil marks, undo, erase, hint, check, conflict highlighting, timer, per-level stats.
- Progress is saved in localStorage. Installable as a PWA; works offline after first load.

## Files

- `index.html` the whole app (CSS and JS inline)
- `manifest.json`, `icon.svg`, `icon-192.png`, `icon-512.png` PWA bits
- `sw.js` service worker, caches the shell for offline use
- `amplify.yml` Amplify Hosting build spec (no build step)

## Run locally

Any static server works, for example:

    python3 -m http.server 8080

Then open http://localhost:8080. The service worker only registers over http://localhost or https.

## Deploy to AWS Amplify Hosting

1. Push this repo to GitHub.
2. Amplify console, Hosting, connect the repo and branch. Amplify reads `amplify.yml`; there is nothing to build.
3. Optional: custom domain under App settings, Domain management.

Cost on the free tier is effectively zero for personal use.
