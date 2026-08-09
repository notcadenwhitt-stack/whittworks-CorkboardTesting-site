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

`document.body.innerText.length` is **1487** wherever the board shows and
**1807** on the editorial (1506 in reading mode, 1791 with no JS) —
re-baselined 2026-08-09 when the second testimonial was PARKED off the tip
(see "2026-08-09" below). With the parked pair restored (branch
`annie-wip`) the values are 1593 board / 1899 editorial, which were the
2026-08-08 baselines; before that content existed at all they were
1387/1707, and older notes in this file cite those numbers as measurements
of their day. The old 1387-everywhere tripwire now means "1487 on the
board".

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
BOTH designs render stacked (measured 2026-08-07, before the
events/testimonial content: innerText 3116, the whole site twice).

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

## 2026-08-08: events sticky, Annie placeholder, legibility pass

Executed from PLAN.md (approved 2026-08-08). What changed:

- **Fourth blue service sticky** "Event Management & Coordination" at
  (2886, 852), `paper-1 c-blue flip` so the reused scan reads as a different
  note. Editorial services list gained the matching fourth row.
- **Annie Meissner testimonial placeholder**: quote card at (2450, 1850) with
  name/title typed over empty ruled lines and a graphite `.pencil-note`
  ("quote on its way", bottom LEFT — her polaroid lies over the card's
  bottom-right corner); polaroid at (3040, 1900) with a neutral-grey inline
  SVG data URI for film (nothing new to 404). ZERO invented quote words, both
  designs. Swap-in is a drop-in: photo into `.pol-photo` src, quote onto the
  ruled lines, delete the pencil note.
- **Tape strips are SIBLINGS of the card and polaroid**, positioned in board
  coordinates: the card clips children (`overflow: hidden`) and both papers
  carry filter stacks that would re-shadow anything inside. Reading mode
  hides bare-sibling tape (`.board > .tape`).
- **The pink mini-sticky moved** (2944, 1741) → (3150, 1430): Annie's card
  would have covered its text. Still inside stop 4's frame.
- **STOPS retuned**: 3 → (2745, 755, 1050x1000) frames all four stickies;
  5 → (2362, 1768, 2200x900) frames both testimonial pairs. STOPS[0] and the
  head-script mirror untouched.
- **Legibility**: `.typed.small` ink #55503f → #3d382e (the old grey sat
  under the #444 floor); `.quote-card .typed` 20 → 24px and attr 13 → 17px
  (line-height 32 kept, so strikes stay on the ruled lines) because stop 5
  now rests at ~0.65 zoom against the old ~1.1. `.pencil-note` is jittered
  by hand.js (selector added).
- Versions: style.css 53, reading.css 5, editorial.css 4, board.js 11,
  hand.js 6. Tripwires above re-baselined (1593 board / 1899 editorial /
  1612 reading / 1883 no-JS).
- Battery re-run clean: no-JS wide + narrow render the editorial, 390x844
  editorial + reading mode verified, console clean at all eight stops.
  Pre-existing, untouched: `assets/cork.webp` preload is not media-gated, so
  narrow viewports sometimes log a "preloaded but not used" warning and
  fetch ~304KB the editorial never paints (same class of issue the tape
  preloads fixed with their 901px gate).

**Same day, owner-directed in chat after the screenshot set:** the board
split into panes. The WORK pane sits right — postcard at (2400, 1300) with
a genuinely dark print (saturate .78 / contrast .96 / brightness .9, and
the ink-density ceiling halved to 0.07; the owner pushed three times toward
the live site's near-black), the pink mini-sticky at (3095, 1705) tucked so
its top-left quadrant covers the postcard's bottom-right corner (owner's
requested arrangement) — and **the cork below and right of the postcard is
deliberately EMPTY: reserved for future product cards.** The green chart
doodle moved up to (980, 1300), clear of Chad's polaroid. REVIEWS are a stacked column left of it: row 1 Chad,
polaroid (1240, 1450) LEFT of his quote card (1600, 1510); row 2 Annie,
card (1300, 1955) LEFT of her blank polaroid (1940, 1925). That
polaroid-card / card-polaroid zigzag is the owner's requested arrangement —
keep it. PINS 4/5/6 moved with their papers (the freeze on pins meant the
system, not pinning a moved paper to empty cork); strings follow pins
automatically. STOPS 4/5 retuned; stop 5 now rests near 0.89 zoom, so the
quote-card type bumps from earlier today still land well.

Not done, deliberately: push/deploy (owner approval pending, PLAN.md phase
5), real Annie quote/photo (pending her team), mobile polish (still parked).

## 2026-08-09: final geometry, and the second testimonial parked

Owner-approved plan (PLAN.md). Coordinates here supersede the 2026-08-08
sections above.

- Green chart doodle → **(620, 1120)**: open cork, overlaps nothing.
- Work postcard → **(2520, 1300)**: its middle (x=2920) is the midpoint of
  Chad's card's right edge (2300) and the cork's inner right edge (3540 —
  the frame border is 30px). Pink mini-sticky **(3215, 1705)** keeps the
  corner tuck; pin 4 **(2934, 1318)**; board.js at ?v=16.

**Parked: Annie Meissner's testimonial.** The owner wants bare cork there
until her quote and photo are confirmed real. DO NOT restore or push it
without the owner explicitly confirming — the agreed protocol is: when the
owner next mentions her review/picture, recite the stored placement, then
fill in only on their yes. The full working version lives on the local-only
branch **`annie-wip`** (at the "Move the doodle…" commit). Placement, for
the recital: card `(1300, 1955, −1.2°)` with sibling tape `(1282, 1912)`;
blank polaroid `(1940, 1925, 2.2°)` with sibling tape `(2222, 1869)`;
editorial figure `.testimonial-pending` after Chad's. All the CSS is still
in the tree (.annie-card, .pencil-note, .annie-polaroid, reading-mode
rules, the hand.js `.pencil-note` selector), so restoration is pasting the
markup back at the two RESERVED comments in index.html, re-baselining the
tripwires to 1593/1899, and swapping in the real photo per the polaroid
LQIP/object-position convention.

## Verification commands

```bash
python3 -m http.server 8941 --directory "<this directory>"
```
Jump the camera to stop *n* of 0..7:
```js
window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * n/7)
```
Always load with a unique `?v=`; the dev server sends no cache headers.
