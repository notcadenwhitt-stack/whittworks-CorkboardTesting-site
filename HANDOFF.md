# Handoff: WhittWorks Studios

Rewritten 2026-08-07. The previous version was written 2026-08-03 and had gone
badly stale — it described a single-design cork board site, said nothing had
been pushed, and listed work that is now done. Everything below is verified
against the repo, the live remotes and a real device unless marked otherwise.

Branch **`corkboard-realism`**, tip **`fdbaefe`**, working tree clean.

---

## Session intent

The owner asked for a fresh-eyes scan for problems, expecting the cork board's
size and detail to be the cause. It mostly was not. What followed was a
diagnostic pass, a legal cleanup, and then a re-architecture the owner directed
after seeing the mobile result.

---

## What this site is NOW (this is the part that changed most)

**Two designs in one document.** The tan editorial design is the BASE. The cork
board is an enhancement layered on top of it.

| condition | what renders |
|---|---|
| wide screen + working camera | cork board |
| phone / narrow / short viewport | tan editorial + a sticky note in the footer |
| tap the sticky note | cork board, in reading mode |
| scripting off, any width | tan editorial |
| `js/board.js` 404s or CSP blocks it | tan editorial |
| `css/style.css` 404s | tan editorial |
| crawler | tan editorial, fully typeset |

`document.body.innerText.length` is **1387** wherever the board shows and
**1707** on the editorial. The old 1387-everywhere tripwire now means
"1387 on the board".

### The four class gates, and why each exists

Set on `<html>`. Get these wrong and the site shows the wrong design or flashes.

- **`js`** — inline head script. Proves a script ran. Nothing more.
- **`board-first`** — same inline head script, from
  `matchMedia("(min-width: 901px)")`. Decides the design BEFORE first paint.
  This exists because gating on `board-live` alone painted the editorial first
  and swapped ~1 second later on every wide load (measured 1.0s at 4 Mbps,
  1.3s at 1 Mbps).
- **`board-live`** — set by `js/board.js` ALONE, after its own guards pass.
  Proves a camera exists. `js` was not enough: `peek.js` and the head script
  both set it, so a 404 on `board.js` left `js` present and showed a board with
  nothing driving it.
- **`no-board`** — set by `js/peek.js` at DOMContentLoaded if `board-live` never
  appeared. Removes `board-first` and hands the page back to the editorial.
  DOMContentLoaded and NOT `setTimeout(0)`: the parser fetches `board.js` after
  running `peek.js`, and timers fire in that gap, so a zero-delay timer reported
  every healthy load as dead.

Plus `board-open` / `board-shut` for the sticky-note toggle.

There is also an inline `<style>.corkboard{display:none}</style>` in the head.
It is the floor: if `css/style.css` 404s, every display rule goes with it and
BOTH designs render stacked (measured innerText 3116, the whole site twice).

---

## Files

### Created this session
- `css/editorial.css` — the tan design, lifted from `main`. Its `:root` is
  scoped to `.editorial` because `--paper`, `--ink` and `--red` collide with the
  board's at different values. Zero class-name collisions between the two
  stylesheets, which is why the rest arrived unedited.
- `css/reading.css` — the board reflowed into a column. **Has no `@media` of its
  own**; the gate is entirely the `media` attribute on its `<link>`. It was once
  also linked inside `<noscript>`, back when the column was the no-JS fallback;
  it is NOT any more, because the editorial design fills that role better. Do
  not re-add that link.
- `js/peek.js` — the sticky-note toggle. Deliberately separate from `board.js`
  so the toggle survives `board.js` failing to parse.
- `tools/lqip/reencode_assets.py` — one-shot asset re-encode.
- `tools/lqip/grade_photos.py` — one-shot photo grade.

### Modified
- `index.html` — merged both designs, inline head script, inline display floor,
  four font preloads, absolute `og:image`/`og:url`, sticky note in the footer.
- `css/style.css` — Anton + Inter `@font-face`, design-switching gates,
  sticky-note styles, `overflow: clip` on `.viewport`, `min-height` on the three
  card rules, `border-image` slice 170→85.
- `js/board.js` — `--camera` sentinel guard, `board-live`, `cameraActive()`,
  reading-mode standdown, `MOVE_SETTLE` 160→**600**, nav `STOP_TARGET` map.
- `js/hand.js` — `seedText` (textContent) split from `label` (innerText); no
  `aria-hidden` on a wrapper containing a focusable.
- `assets/paper/SOURCES.md` — every referenced asset now has provenance.
- `GOALS.md` — two stale claims corrected.

### Deleted
39 unreferenced files. `assets/` went **6.1 MB → 1.8 MB**. Included every
`-orig`/`-orig2` source scan, 5 unused Resource Boy tapes, the Fuzzimo
originals, and `doodle-bulb-unlicensed.webp.DISABLED`.

### Re-encoded in place
```
tape-3.webp           29,350 →  13,980     lossy alpha
tape-4.webp           17,498 →   9,128     lossy alpha
tape-7.webp           40,018 →  18,720     lossy alpha
postcard-front.webp  206,980 →  47,742     82% of it is hidden behind .pc-picture
wood.jpg              38,666 →   9,876     512→256, slice 170→85 in lockstep
caden.jpg            105,424 →  91,938     tone grade
levelup-card-900.jpg  66,935 →  66,763     tone grade
```
Referenced payload is now **40 files, 1,677,351 bytes**.

---

## Decisions made, with the reasoning that is expensive to re-derive

- **The cork is not the problem.** 304 KB of 1.84 MB (16.25%). A counterfactual
  rebuild at 2400x1600 transferred the same bytes. Board size 3600x2400 is
  correct — KEEP IT. The cork is if anything too small: 1024² laid at a 1180
  board-px tile is a 3.83x upscale at retina.
- **`.moving` STAYS.** An early report said delete it; that was measured on a
  host at load average 18-175 and is wrong. Removing it is 10-25x worse at p95.
- **`MOVE_SETTLE` is 600, not 160 and not 400.** The cost is RESTORING the
  shadow stacks, not collapsing them — a GPU-process block of 428ms, not main
  thread. A wheel is bursts with pauses, and 160 fired inside every pause.
  400 was tried and resonates with a 450ms cadence, worse than 160.
- **Reading mode drops `url(#cut)`.** A WebKit bug: it painted a solid black
  170x188pt rectangle at the viewport origin on real iPhones. Chrome never
  reproduced it at any viewport. Desktop keeps the filter.
- **The four Rawpixel stickies stay**, as a knowingly accepted risk. Openverse
  returns `creator=None` for all three IDs and rawpixel.com is 403 behind
  Cloudflare, so the owner's own "read the source page" standard cannot be met.
  Recorded in full in `SOURCES.md`.
- **The two `&rarr;` arrows stay in the system font.** U+2192 is absent from the
  entire upstream Caveat family, so the only fix is shipping a modified Caveat.
  Owner declined. Do not re-investigate; it is written up in `SOURCES.md`.
- **Keep the LQIP placeholder system.** It solves a different problem from the
  flash: the flash was 1.0-1.3s of the wrong design (now zero), the placeholders
  cover the 12+ seconds of photographs still arriving.

---

## Traps that cost real time here

1. **An emulator is not a browser.** Six days of Chrome DevTools measurement at
   every viewport, DPR and throttle missed a black rectangle that a real iPhone
   showed in one screenshot. Use the iOS Simulator (`xcrun simctl`, then the
   simulator control tool) for anything visual. It reaches the host's
   `localhost` directly, so serve variants locally and bisect.
2. **Scripted scrolling lies.** `window.scrollTo` in a rAF loop paces itself to
   the frame budget and reported locked 60fps for days. Real
   `Input.dispatchMouseEvent` wheel events, in bursts with pauses, found a
   2.6-second frame. Always drive real wheel input.
3. **Measure on an idle machine.** Sibling agents saturating this Mac produced
   numbers that reversed a conclusion twice. Check `uptime` before trusting any
   timing.
4. **`mobile=True` in CDP silently changes your viewport.** Ask for 390 and
   viewport-meta shrink-to-fit gives you 594. Use `mobile=False` and ASSERT
   `innerWidth` before trusting a measurement.
5. **`offsetParent` is null for `position: fixed`.** It reports every visible
   fixed element as hidden. Use `getClientRects().length`.
6. **`visibility: hidden` changes `innerText`,** exactly like `display: none`
   (measured 1387 → 1355). Only `opacity: 0`, off-screen positioning and
   `clip-path` preserve it.
7. **Percentage padding on absolutely positioned elements** resolves against the
   3600px board. Use `--sz`.
8. **Ports collide silently.** A stale server keeps a port and your new one dies
   unheard, so you measure the wrong build. Verify what a port actually serves
   before trusting it.

---

## Current state

```
whittworks-site          main only (e15a884) — the OLD editorial design, live, untouched
CorkboardTesting         corkboard-realism fdbaefe · main 8c7259e — serving this build
whittworkstudios.com     200, still the old design
```

Staging: `https://notcadenwhitt-stack.github.io/whittworks-CorkboardTesting-site/`

**Per-rebuild fixups for staging, required every time:** delete `CNAME`, add
`<meta name="robots" content="noindex, nofollow">`.

---

## Next steps

1. **Decide whether to merge to `main`.** Nothing forces it. Production is still
   the old design, which is also now the phone experience and the fallback.
2. **Split the board's placeholders out of `css/style.css`** behind the same
   901px gate. 13.2% of that 68 KB file is base64 the editorial never uses, and
   phones load all of it on the render-blocking path.
3. **A human screen-reader pass.** The AX tree and keyboard were driven
   programmatically; nobody has listened to it.
4. Optional: `caden.jpg` photographer is recorded as unnamed; fill it in if known.

## Verification commands

```bash
python3 -m http.server 8941 --directory "<this directory>"
```
Jump the camera to stop *n* of 0..7:
```js
window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * n/7)
```
Always load with a unique `?v=`; the dev server sends no cache headers.
