# Handoff: WhittWorks cork board realism pass

Written 2026-08-03. Everything below is verified against the repo and a live
browser check unless marked otherwise.

## What this project is

`whittworkstudios.com` is a single-page static site (no build step) at
`/Users/cadenwhitt/Claude Code Projects/Experimentation/Final Project/whittworks-site/`.
Deploy is a git push to GitHub Pages, repo `notcadenwhitt-stack/whittworks-site`.

The design is a photorealistic cork "conspiracy board." A fixed camera starts
zoomed out on a framed 3600x2400 board and scroll drives it through 8 stops:
overview, title card, about + polaroid, three service sticky notes, the Level Up
work sample, testimonial + polaroid, contact, back to overview.

## Current branch state — READ THIS FIRST

Work lives on branch **`corkboard-realism`**. Nothing has been pushed. `main` is
untouched and still holds the older print-poster editorial design that is live.

```
24f6672  Fix sticky sizing and per-word line breaking
46c4f12  Photographic paper: real stickies, polaroid frames, postcards, tape
3ce4025  Restore cork board design from stash onto its own branch
108cd7e  (main) Use WhittWorks logo for favicon and social-share thumbnail
```

**Why commit 3ce4025 exists:** a different Claude session was running in this
same folder overnight. At 01:39 it stashed the uncommitted cork board and reset
to the editorial design, then committed favicon work on top. The board was
recovered from `stash@{0}` ("cork board redesign draft (unapproved)") onto this
branch with the favicon commit merged in. The stash still exists; do not drop it
until this branch is confirmed good. If a second session may still be running in
this folder, check before you start writing files.

## The task, in the user's words

The sticky notes and polaroids "look like they are supposed to be in a video
game." CSS gradient approximations were rejected. The fix is real photographic
assets, the way real cork and wood textures already solved the board surface.
The user then asked for a postcard: **Level Up as a postcard front, Contact as a
postcard back.** Also: make the handwriting feel handwritten, so no two "a"s look
identical while still reading as one person's hand. Realism is priority one.

Hard constraints from the user:
- Do not push to GitHub until they approve the design.
- Copy stays word-for-word; only presentation changes.
- Assets must be free and legal for commercial use.

## What is done

**Assets** — 23 processed files in `assets/paper/`, 1.6 MB total, all licenses
recorded in `assets/paper/SOURCES.md` (read it before adding or redistributing
anything; the Fuzzimo terms forbid re-publishing the raw scans as a resource
pack, so never commit the source ZIP).

| Asset | Count | Source | License |
|---|---|---|---|
| `sticky-01..07.webp` | 7 | Unsplash (Kelly Sikkema) + Rawpixel CC0 previews | Unsplash License / CC0 1.0 |
| `polaroid-frame-1..3.webp` | 3 | Fuzzimo blank instant-film scans | free commercial, no attribution |
| `postcard-back.webp` | 1 | Wikimedia, 1913 divided-back postcard | public domain |
| `postcard-front.webp` | 1 | Wikimedia, 1925 white-border postcard | public domain |
| `stamp-1.webp` | 1 | Wikimedia, 1917 Washington 2c | public domain |
| `tape-1..8.webp` | 8 | Resource Boy masking tape PNGs | free commercial |
| `paper-grain.webp` | 1 | ambientCG Paper002 | CC0 1.0 |

Each polaroid frame has its transparent photo window measured; those numbers live
in CSS as `--wx/--wy/--ww/--wh` per `.frame-N` class. Same idea for the postcard
picture area.

**Integration** — all in `index.html` + `css/style.css`:
- Every sticky note renders on a real photographed note (`.paper-1` … `.paper-7`),
  each with its own aspect ratio and measured writable insets. Doodle notes use
  the smaller notes, two of them mirrored with `.flip` so repeats are less obvious.
- Polaroids are scanned frames with photos positioned behind the transparent
  window, plus a gloss layer and the caption sitting on the frame's bottom lip.
- Work stop is now `.postcard-front`: the Level Up screenshot printed into the
  card's picture area with print grain over it, two real tape strips at the top
  corners, and the caption hand-written on a tape label.
- Contact stop is `.postcard-back`: message on the left, the circled email on the
  address lines, the 1917 stamp in the corner.
- Index cards gained real paper fiber over the ruled-card gradients.
- Shadows moved from `box-shadow` to layered `drop-shadow` so they follow each
  cutout's actual silhouette.

**Handwriting** — `js/hand.js` (new, loaded after `board.js`):
- Splits hand-lettered text into `.wd` word spans containing `.ch` character
  spans, seeded by a hash of the text so the same letters draw every visit.
- Per character: rotation ±2.05deg, baseline ±0.05em, scale 0.968–1.032, and for
  Caveat a real variable-weight jitter (`wght` 415–525 / 545–655 when bold) so
  stroke thickness varies like pen pressure. Permanent Marker is static, so it
  gets opacity variance instead.
- Four `feTurbulence` + `feDisplacementMap` filters in `index.html` (`#ink-a/b/c`
  for handwriting clusters, `#ink-t` lighter for typewriter text) roughen stroke
  edges; because displacement depends on screen position, identical glyphs in
  different places distort differently.
- Accessibility: parent gets `aria-label` with the clean string, every generated
  span is `aria-hidden`, so screen readers announce words not letters.
- Font embed changed to `Caveat:wght@400..700` to get the variable axis.

## Two traps that already cost time

1. **Percentage padding on absolutely positioned elements resolves against the
   containing block, which here is the 3600px board.** Sticky padding of `7%`
   became 250px and the notes rendered thousands of pixels tall. Insets now come
   from a `--sz` custom property (`calc(var(--pt) * var(--sz))`). If you add a new
   paper element, set `--sz` on it, never raw percentages.

2. **`python -m http.server` sends no cache headers, so the browser aggressively
   caches `index.html` and the CSS.** A plain reload will show you stale output
   and make you think your fix failed. Load a unique query string
   (`http://localhost:8940/?v=<anything-new>`) to see real changes. There is a
   `?v=3` cache-buster on the stylesheet link in `index.html`; bump it when you
   edit CSS.

## How to run and verify

```bash
python3 -m http.server 8940 --directory "/Users/cadenwhitt/Claude Code Projects/Experimentation/Final Project/whittworks-site"
```

In Claude Code, `preview_start` with name `whittworks` does this (configured in
`Experimentation/.claude/launch.json`). Then jump the camera to stop *n* of 0..7:

```js
window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * n/7)
```

Screenshot each stop. Console should be clean (it is, as of 24f6672).

## What is left

1. **Zoomed verification of all 8 stops.** Only the overview has been checked
   carefully at 1440x900. The close-up stops are where realism actually gets
   judged, and where text fit on the new paper is most likely to be wrong.
2. **Contact postcard layout at zoom.** The message text and circled email were
   positioned by measurement, not by eye at final size.
3. **Camera stop framing.** Elements changed size, so several `STOPS` entries in
   `js/board.js` probably need their spans retuned. Pin 4 was already nudged for
   the postcard.
4. **A realism critique pass.** Worth having fresh eyes (or fresh agents) look at
   final screenshots and answer "what still reads as fake?" Known suspects: the
   pins are still pure CSS (no free photographic pin was found that cut out
   cleanly), and the red string is still SVG.
5. **Mobile.** Untouched and unverified.
6. **User approval, then push.** Do not push before that.

## Decisions made without asking (veto any cheaply)

- Typewriter text on index cards stays typed, only lightly roughened, because a
  real board mixes typed cards with handwritten notes.
- Stickies stay mostly yellow with one chartreuse and one pink accent.
- The two postcards are treated as separate physical cards from the same era, one
  pinned picture-side out and one address-side out.
- Doodle notes got photographic paper too, two of them mirrored.
- Pins stayed CSS; no qualifying free photo existed.
- Processed WebP derivatives are committed to the repo; raw source scans are not.
