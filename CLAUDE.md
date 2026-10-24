# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Quiet Sudoku: an ad-free sudoku PWA, one static HTML page. See README.md for the feature list.

## Hard constraints
- Keep the app a static page with no framework, bundler, npm dependencies, backend or API calls: `src/index.html` (CSS and app JS inline) plus `src/grader.js`, a plain classic script loaded before the app. Puzzle generation is pure code in the browser. The only external resource is Google Fonts, with system-font fallbacks.
- When `src/index.html` or `src/grader.js` changes, bump `CACHE` in `src/sw.js` (`quiet-sudoku-vN`). The service worker is cache-first, so installed clients keep the old page until the cache name changes.
- Do not rename `KEY` in `src/index.html` (also `quiet-sudoku-v1`, but unrelated to the SW cache). It is the localStorage key for the saved game, stats and prefs; changing it wipes every player's progress.
- Ask before anything that costs money beyond the Amplify free tier or that creates IAM resources.

## Commands
There is no build, lint or test suite.

    python3 -m http.server 8080 -d src     # serve locally, open http://localhost:8080

Verify changes in a real browser. Before testing, unregister the service worker and clear caches, or the cache-first SW serves the old page. The app runs inside an IIFE, so `S` is not reachable from the console; read the saved state (including `S.solution`) from `localStorage.getItem('quiet-sudoku-v1')`.

Icons are rasterised from `src/icon.svg` with ImageMagick (`magick -background none -density 768 icon.svg -resize 192x192 icon-192.png`). `icon-512.png` is maskable: square background with no rounded corners, contents scaled to 85% around the centre so the grid stays inside the 40% safe circle.

## Architecture (`src/index.html` script)
- **Engine:** `fillGrid` (randomised backtracking), `dig` (removes symmetric pairs while `countSolutions(g,2)===1`). `generate(key,seed)` deals and grades up to `MAX_ATTEMPTS` candidates until `Grader.level` returns the requested key, falling back to the nearest band. `DIFFS[key].clues` only sets how sparse the grid looks; it is not the difficulty.
- **Seeding:** all engine randomness goes through `shuffle` → `rand` (mulberry32 seeded by `seedRng` from a string), so a seed always deals the same puzzle while `dig` and the grader bands are unchanged. `fresh` seeds with `YYYY-MM-DD/level/n` (local date, `n` = that day's deal count for the level, kept in `stats.day`/`stats.dealt`), so every player's n-th puzzle of a level on a given day is the same one. `S.seed` records it. Hints use plain `Math.random`.
- **Grader (`src/grader.js`):** a human-technique ladder solver (naked/hidden singles, pointing, claiming, naked/hidden pairs and triples, X-wing, Y-wing, swordfish, else `beyond`). `grade(puzzle)` reports the hardest technique, per-technique counts, hidden singles needed and the minimum number of available singles while 12+ cells are empty. `level(report)` bands by hardest technique so neighbouring levels never overlap: Easy = naked singles, wide; Medium = hidden singles, 3-12 of them, never only one move available; Hard = box-line or subsets, at least two such steps; Expert = needs a wing or fish but is still solved by the ladder, so no level requires guessing. The script also works in Node (`module.exports`) for benchmarking: generate a few hundred puzzles per level and histogram `hardest` before changing bands.
- **State:** a single object `S` (puzzle, solution, cells, notes as 9-bit masks, undo stack, `wrong`, `hinted`, timer, `assisted`) plus `stats` and `prefs`, all saved together by `save()`. Every action mutates `S` and then calls `afterMove()` → `render()` + `checkDone()` + `save()`. `render()` redraws all 81 cells from `S` by setting class names; there is no incremental DOM logic.
- **Prefs:** `prefs.peers` (row/column/box tint, default on), `prefs.assist` ("Cell assist": `dead` class on every peer of every copy of the selected digit, default off, only available while `peers` is on and layered over the peer tint) and `prefs.live`. Only `live` consults the solution; `live` and `assist` both set `S.assisted` (no best time), `peers` does not. `peers` and `assist` are rules-only and must stay that way.
- **Two kinds of red:** `conflict` is computed every render from peer duplicates (rules only); only player-entered cells are drawn red, never clues or hints, so the cell to fix is unambiguous. `wrong` means the digit differs from the solution: set by Check, or computed live in `render()` when `prefs.live` ("Show mistakes") is on. With live mode on the Check button is hidden, and `S.assisted` is set so the game does not count toward best times.
- **Board layout:** `.board` pins `grid-template-rows` and `grid-template-columns` to `repeat(9,minmax(0,1fr))`, and each cell's digit and notes overlay in one grid area. The thick 3x3 lines are a `::before` gradient at fixed 33.3%/66.7%, so any change that lets row heights depend on content misaligns them.

## Deployment
- The repo is public: keep account IDs, app IDs, domains and other hosting details out of tracked files. They live in the gitignored `CLAUDE.local.md`.
- A push to `main` auto-deploys via AWS Amplify Hosting. `amplify.yml` publishes `src/` as the site root with no build step; root-level files (README, this file) are not served.

## Conventions
- Conventional commits (`type(scope): description`), small and plainly worded.
