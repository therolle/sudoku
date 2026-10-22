# Quiet Sudoku: handoff brief for Claude Code

This is a finished single-page app (see README.md). Your job is to get it live on AWS Amplify Hosting, not to redesign it.

## Context
- Built in a Claude chat session on 2026-10-22. The original lives as a claude.ai artifact; `index.html` is the standalone version with doctype, PWA meta and service worker registration added.
- Puzzle generation is pure code in the browser. Do not add a backend or any API call.
- Keep it one HTML file. No framework, no bundler, no npm dependencies. Only external resource is Google Fonts, and the app has system-font fallbacks.

## Tasks, in order
1. Generate the PNG icons from `icon.svg`: `icon-192.png` (192x192) and `icon-512.png` (512x512, maskable-safe, so keep the grid inside the central 80%). Use whatever rasteriser is available (rsvg-convert, ImageMagick, or a small Python script with cairosvg). Commit them.
2. Serve locally (`python3 -m http.server 8080`), open in a browser, confirm: a puzzle appears, digits can be placed, pencil mode toggles, Check flags a wrong cell, the service worker registers without console errors, Lighthouse PWA installability passes.
3. `git init`, first commit, create a GitHub repo (private is fine) under the user's account with `gh repo create`, push `main`.
4. Deploy to Amplify Hosting in the user's AWS account. Prefer the CLI: `aws amplify create-app` with the GitHub repo (needs an access token or the Amplify GitHub App; if that needs a browser step, stop and tell the user exactly what to click), then `aws amplify create-branch` for `main` and `aws amplify start-job`. Region: the user's default profile region unless told otherwise. If the CLI route is awkward, walk the user through the console in five steps instead; do not spend more than a few minutes fighting it.
5. Report the live URL. Suggest a custom domain only if the user asks.

## Conventions
- Ask before anything that costs money beyond the Amplify free tier or that creates IAM resources.
- When `index.html` changes, bump `CACHE` in `sw.js` so installed clients refresh.
- Keep commits small and plainly worded.
