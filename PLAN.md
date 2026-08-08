# Plan: kill the load-time zoom on the board's top-left corner

Written 2026-08-08. Replaces the 2026-08-03 realism-pass plan, which was
executed in full; its outcomes are recorded in HANDOFF.md.

**One-line goal:** a visitor never sees the top-left corner of the cork at 1:1
while the page loads — the board is framed whole from its very first paint.

## The bug

On a wide-screen load, the inline head script sets `board-first` before
anything paints, so the cork board is what gets laid out. But nothing writes
`#board`'s transform except `js/board.js`, which executes at the end of
`<body>` — and first paint waits only on stylesheets, never on end-of-body
scripts. In that gap the 3600×2400 board paints untransformed with
`transform-origin: 0 0`: the visitor sees the top-left corner of the cork at
full scale, then the camera arrives and the view snaps out to the framed
board. The owner reports it as "a zoom on the top left corner when loading."

Reproduced 2026-08-08 in headless Chromium at 1440×900 by delaying
`board.js` 4s: mid-gap computed transform is `none` with the board displayed;
after load it is `translate(101.679px, 37.7863px) scale(0.343511)`.

The code has always known about this failure shape — the `board-live` gate
exists to stop the *404* route to it ("a 3600x2400 board with nothing driving
it ... the identical top-left-corner failure by another door"). The healthy
load pays a shorter visit to the same corner on every load; slower
connections stare at it for seconds.

## The fix

The inline head script already decides the design before first paint and
already knows the viewport. Let it also compute the stop-0 (whole board)
framing and publish it as a `--first-frame` custom property on `<html>`;
`css/style.css` holds that transform on `.board` until the camera's inline
style takes over:

```css
html.js.board-first .board { transform: var(--first-frame, none); }
```

The head script uses the same numbers as `STOPS[0]` in `js/board.js` — span
3860×2620, center (1800, 1200) — and the same formula
(`s = min(vw/3860, vh/2620)`, `translate(vw/2 − 1800s, vh/2 − 1200s)
scale(s)`), so `board.js`'s first inline write lands on the identical matrix
and the handoff is invisible.

## Requirements

- R1: WHEN the board is on screen during load, at any moment from first paint
  onward, it SHALL show the whole-board framing, never an untransformed
  corner.
- R2: WHEN `js/board.js` executes, its first transform SHALL equal the
  CSS-held one (same viewport, scroll 0) so the handoff moves nothing.
- R3: Every fail-open path SHALL behave exactly as before: scripting off →
  editorial; `board.js` 404 → editorial at DOMContentLoaded; `style.css`
  404 → editorial, never both designs stacked; narrow viewport → editorial
  plus the sticky note; reading mode keeps `transform: none !important`.
- R4: visible text SHALL be untouched: `document.body.innerText.length`
  stays 1387 on the wide board and 1707 on the scripted editorial; console
  SHALL stay clean on healthy loads.
- R5: `STOPS` values, camera easing, `will-change: transform`, and the
  `.moving`/`MOVE_SETTLE` machinery SHALL be untouched. (The stop-0 numbers
  are *mirrored* in the head script, with cross-references both ways.)

## Constraints honoured

- No new requests, no third-party anything: the fix is inline script + one
  CSS rule.
- Cache-busting convention: bump `?v=` on every edited linked file.
- The head script must stay self-contained and unable to fail into a worse
  state: if the property never gets set, `var(--first-frame, none)` is the
  old behavior.

## Edge cases considered

- Resize between first paint and `board.js` arrival: framing is stale for
  that window; the camera corrects it on execution. Strictly better than the
  corner.
- Scroll restoration landing at `scrollY > 0`: CSS holds stop 0, the camera
  cuts to the restored stop on its first frame. Same class of behavior as
  today, minus the corner.
- Tablets (found by adversarial review, then fixed): the head script
  originally sat above `<head>` and so read `innerWidth` before the viewport
  meta was processed — a mobile browser answers with the 980px legacy layout
  viewport there. On phones that is harmless (the stylesheet's real-viewport
  `@media` gate hides the board), but a tablet whose final viewport is still
  ≥ 901px would keep the board, held by a frame built for 980×672 — ~28%
  small on an iPad-Pro-class screen — then snap when the camera corrected
  it. The script therefore MOVED to just after the viewport meta, still
  before every stylesheet: design decided pre-paint, viewport read
  post-meta. Verified in Chromium tablet emulation (1366×1024, `isMobile`):
  `--first-frame` now computes from the real viewport and matches the
  camera's write. Not verifiable on real iPad Safari from this environment;
  worst case there is the pre-move behavior, which the camera corrects.
- The same move makes `board-first` genuinely absent on phones (it used to
  be set from the 980px guess and merely neutralized by the CSS gate).

## Verification

- [x] Repro with `board.js` held by route interception (headless Chromium,
      1440×900). Verified 2026-08-08: in the gap, `<html>` carries
      `board-first` but not `board-live`, the inline transform is empty, and
      the computed transform is already
      `matrix(0.343511, 0, 0, 0.343511, 101.679, 37.7863)` — held by the CSS
      variable alone. After `board.js` executes, its inline write is the
      identical matrix. The in-gap screenshot shows the whole framed board
      (photographs still soft under their LQIP placeholders, which is that
      system doing its job); before the fix the same moment showed the
      top-left corner of the cork at 1:1.
- [x] Transform-equality sweep across viewports (2560×1440, 1440×900,
      1280×1024, 1024×768, 901×700): CSS-held matrix == camera's first
      matrix, component-wise. Verified 2026-08-08.
- [x] Fail-open battery: no-JS, `board.js` 404, `style.css` 404, 390×844
      phone viewport, reading-mode toggle (computed transform `none` beats
      the new rule), reduced motion, scroll-during-gap. All land where
      HANDOFF.md's table says they should. Verified 2026-08-08.
- [x] `innerText.length` unchanged by this work: 1387 on the wide board,
      1707 on the scripted editorial (390×844), byte-for-byte. The battery
      also measured three states the docs never enumerated, all pre-existing
      and none touched by this diff: 1691 no-JS editorial (the peek-note
      label needs the `js` class), 1727 unstyled editorial (`style.css`
      404 reveals both toggle labels), 1406 narrow reading mode (adds
      "← BACK TO THE SITE"). Recorded here so the next tripwire reader does
      not chase them as regressions.
- [x] Console clean on healthy loads; the only console errors in the battery
      were the single deliberate 404 per sabotage scenario.
- [x] No push until the verification results above were actually observed.
