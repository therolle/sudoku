# Quiet Sudoku

Ad-free sudoku as a single static page. No backend, no account, no tracking.

- Unlimited puzzles generated in the browser (pure code: randomised backtracking fill, symmetric digging with a uniqueness check, a human-technique grader for difficulty).
- Four levels graded by the hardest technique a puzzle needs: Easy (naked singles), Medium (hidden singles), Hard (box-line interactions, pairs, triples), Expert (X-wing, Y-wing, swordfish). None requires guessing.
- Pencil marks, undo, erase, hint, check, conflict highlighting, timer, per-level stats.
- Optional "Show mistakes" mode (in the menu): wrong digits turn red as you place them and Check is hidden. Games played this way do not set best times.
- Menu (hamburger, top right) holds the level picker, options and a colour legend explaining every marker on the board.
- Two rules-only aids in Options: row/column/box highlighting (on by default) and, on top of it, "Cell assist" (off by default), which adds a light grey to every cell where the selected digit can no longer go. Like "Show mistakes", Cell assist games do not set best times.
- Progress is saved in localStorage. Installable as a PWA; works offline after first load.

## Files

`src/` is the site root; everything in it is published as is.

- `src/index.html` the whole app (CSS and JS inline)
- `src/manifest.json`, `src/icon.svg`, `src/icon-192.png`, `src/icon-512.png` PWA bits
- `src/sw.js` service worker, caches the shell for offline use
- `amplify.yml` Amplify Hosting build spec (no build step, publishes `src/`)

## Run locally

Any static server pointed at `src/` works, for example:

    python3 -m http.server 8080 -d src

Then open http://localhost:8080. The service worker only registers over http://localhost or https.

## Deploy to AWS Amplify Hosting

1. Push this repo to GitHub.
2. Amplify console, Hosting, connect the repo and branch. Amplify reads `amplify.yml`; there is nothing to build.
3. Optional: custom domain under App settings, Domain management.

Cost on the free tier is effectively zero for personal use.
