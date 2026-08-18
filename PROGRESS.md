# Progress tracker: editing the cork board in place

Read this file FIRST in any new session. `PLAN.md` holds the approved plan this
checklist executes. `HANDOFF.md` and `AGENT-HANDOFF.md` hold the traps. Nothing
here supersedes them.

**Repository:** `/Users/cadenwhitt/Claude Code Projects/Experimentation/Final Project/whittworks-CorkboardTesting-site`
**Working branch:** `board-edits`, cut from `corkboard-realism` at `2540468`
**Last updated:** 2026-08-18

## Resume in one paragraph

The owner scrapped the click-to-zoom rewrite on 2026-08-18 and asked for his changes
to be made to the EXISTING site instead. That site works today: a scroll-driven cork
board with eight tuned camera stops, a tan editorial fallback, and a reading mode.
Nothing is being rebuilt. Ten small edits are being made to it, each committed on its
own. Scrolling stays; clicking is added on top. Nothing is pushed until the owner
says so.

## Model routing (owner's standing instruction)

Opus 5 plans, reviews, and approves. Sonnet 5 subagents write the code. Escalate one
sector to Opus 5 only after Sonnet 5 fails repeatedly on that same sector, never the
whole job.

## Phase checklist

- [x] **Phase 1: Remove the bottom chrome and the motion override**
      DONE 2026-08-18. `.board-chrome`, `.scroll-hint`, `.motion-toggle`, `.motion-dot`,
      the `motion-on`/`motion-off` classes, the `ww-motion` sessionStorage override, and
      the hint's fade logic are all gone from `index.html`, `css/style.css`,
      `css/reading.css`, and `js/board.js`. 228 lines deleted, 37 added. The
      reduced-motion media query now applies to `*` unconditionally; `osReduced()` and
      the live `matchMedia` listener survive, so the OS setting is read live and remains
      the only authority.
      Verified: the nine removed identifiers return zero grep hits; `js/board.js` passes
      a syntax check; screenshots at stops 0, 2, 4, and 6 show nothing fixed at the
      bottom; `cdp.mjs stops` output is byte-identical to a pre-edit worktree at
      `be7e9d9`, so the 14/15 and 7/8 sampling numbers are pre-existing and not a
      regression; tripwires moved 1505 -> 1455 on the board and nowhere else, which is
      exactly the 50 characters of deleted chrome text.
      **Byte baseline for Phase 9: 1,842,182 bytes across 47 referenced files**,
      measured by summing `index.html`, `404.html`, every file in `css/` and `js/`, and
      every local asset they reference. Re-run the same method in Phase 9.
      One extra fix beyond the brief: `onMotionChange` still read the deleted `override`
      variable, which would have thrown a `ReferenceError` the moment a visitor changed
      the OS setting mid-visit. Neither the syntax check nor the harness would have
      caught it, because neither fires a live `matchMedia` change.

- [x] **Phase 2: Copy pass and the Portfolio rename, in both designs**
      DONE 2026-08-18. Thirteen copy edits in `index.html` plus one CSS rule. The
      Portfolio rename covers the editorial nav, the editorial band id and heading, the
      editorial note, the deskbar label, and the pink board sticky. The sticky is now a
      `mailto:caden@whittworkstudios.com` link, authored as an anchor INSIDE the
      `<p class="hand sticky-note">` rather than as the note itself: `js/hand.js:124`
      only leaves its letter-wrapper exposed to assistive tech when the element contains
      a focusable descendant, and the comment there documents a real WCAG 4.1.2 failure
      fixed by exactly this arrangement. Grammar: a missing comma in both copies of the
      About paragraph, "Caden — founder" to "Caden Whitt, Founder" (which also removes
      an em dash), and all four service stickies capitalized, with the second rewritten
      from a subjectless fragment into a sentence.
      Class names were deliberately NOT renamed. `band-work`, `work-note`, and
      `work-postcard` are internal and out of scope; `js/board.js:444` still maps stop 4
      to `.work-postcard`.
      Verified: zero grep hits for any "Work" label or lowercase hand-lettered note;
      tripwires 1455/1807/1474/1791 -> 1483/1814/1502/1798, with every character of all
      four deltas individually accounted for (see `HANDOFF.md`); and the Level Up
      caption still sits on its tape strip with margin at both ends after the jitter
      re-roll, checked on a screenshot at stop 4 rather than assumed.

- [x] **Phase 3: The title strip and the kebab dropdown**
      DONE 2026-08-18. `.deskbar` now carries only the title, set in Anton via a new
      `--display` var in `css/style.css`'s `:root`, uppercased in CSS and left mixed-case
      in the HTML so the accessible name and the tripwire stay right. New
      `.board-menu-btn` fixed at the top right drawing three rows of one dot plus one
      dash, and a `.board-menu` paper dropdown of six entries: About 2, Services 3,
      Portfolio 4, Reviews 5, Contact 6, Whole Board 0. New `js/menu.js`, modeled on
      `js/peek.js`. `js/board.js`'s selector widened from `.deskbar a[data-stop]` to
      `a[data-stop]`, which is the entire wiring; no new camera code.
      No kicker was added here on purpose. The tagline arrives in Phase 5 with the
      sticker. Until then the title and the centre notecard both read "WhittWorks
      Studios"; that duplication is expected and Phase 5 removes the notecard.
      Verified: both scripts pass a syntax check; all six entries carry their stops; real
      clicks and key events driven through headless Chrome confirm `aria-expanded` flips,
      focus lands on the first entry, Escape closes and restores focus to the button, an
      outside click closes, choosing Contact closes the menu AND moves the camera, and
      Tab wraps at both ends; `cdp.mjs stops` unchanged from baseline; the stop-0
      screenshot shows the title as the headline, the strip still a strip, and the kebab
      clear at the top right.
      Tripwires 1483/1814/1502/1798 -> 1450/1814/1469/1798. Board and reading each fell
      by exactly 33, which is the four old nav labels (About 5, Services 8, Portfolio 9,
      Contact 7 = 29) plus one newline each. A closed dropdown is `display: none`, so
      that text correctly leaves `innerText` until the menu opens.
      One defect fixed after the handoff: `STOP_TARGET`, the fallback that runs when the
      camera is inactive (reading mode), mapped only stops 2/3/4/6, so the two new
      entries were silent no-ops there. Added stop 5 -> `.quote-card`, and stop 0 now
      scrolls to the top of the column, tested before the lookup because 0 is a real
      index that would otherwise read as a missing key. All five fallback selectors
      verified to resolve to real elements.

- [x] **Phase 4: Clickable zones**
      DONE 2026-08-18. Ten papers carry `data-zone-stop` and one delegated listener on
      `#board` moves the camera: About card and founder polaroid -> 2, all four service
      stickies -> 3, Level Up print -> 4, quote card and Chad's polaroid -> 5, contact
      postcard -> 6. The existing nav-link handler body was first extracted into
      `goToStop(stop)` as a pure refactor, so paper clicks, dropdown entries, and Escape
      all run the identical path and cannot drift apart.
      Escape returns to the whole board (beyond the original plan). It checks the kebab's
      `aria-expanded` and stands down while the menu is open, rather than relying on
      `stopPropagation` from `js/menu.js`: that handler is registered later and therefore
      fires second, so it could not shout over one that had already moved the camera.
      NO `tabindex` and no button role on the papers, reversing PLAN.md's earlier line.
      Reasons are in a long comment in `js/board.js`; the short version is that two of
      the ten contain real links so a button role would be invalid ARIA, ten new tab
      stops would sit ahead of the three links a keyboard visitor wants, and the Phase 3
      dropdown already makes all six framings keyboard-reachable.
      Verified with real events driven through headless Chrome, with `window.scrollTo`
      stubbed to record the handler's decision and a capture-phase `preventDefault` so
      nothing could navigate: all seven zone clicks land on their exact expected offset
      ((stop/7) x maxScroll of 10800, so 3086/4629/6171/7714/9257); the Level Up caption
      link, the circled email, the pink sticky, bare cork, a doodle, and a pin all leave
      the camera untouched; Escape with the menu closed goes to 0 and with the menu open
      does nothing. Tripwires unchanged at 1450/1814/1469/1798 and `cdp.mjs stops`
      unchanged, both correct since this phase adds attributes and CSS, not visible text.

- [x] **Phase 4b: Clicks fly straight to a zone instead of touring**
      DONE 2026-08-18, on owner feedback: clicking a zone animated `scrollY`, and since
      the camera is a pure function of scroll it VISITED every stop in between. Clicking
      Contact from the opening frame toured About, Services, Portfolio and Reviews.
      Fixed by inverting who owns the motion. `update()` was first split into
      `progressNow()`, `framingFor(p)` and `writeFraming(x, y, s)` as a pure refactor
      (confirmed behavior-neutral against both harness checks before anything was built
      on it). `goToStop` now sets scroll INSTANTLY, so the resting state is correct
      immediately, then tweens the camera along the straight line between the two
      framings over `FLY_MS` (520ms), x and y with `lerp` and scale in log space to match
      how scroll ramps it. Set `FLY_MS` to 0 for a hard cut; reduced motion already takes
      that path.
      Both framings come from `framingFor`, not from `STOPS[n]`, so the flight's last
      frame is byte-identical to the frame scroll draws at that offset. That matters at
      the last stop, where `framingFor` clamps `i` and evaluates `f = 1` rather than
      indexing `i + 1`.
      `onScroll` returns early while flying, because the instant jump fires a scroll event
      that would otherwise paint the destination and leave no flight to watch. A `wheel`
      or `touchstart` cancels the flight and resyncs, bound to those rather than to
      `scroll` because the programmatic jump fires `scroll` too and the two cannot be told
      apart there. `onResize` cancels as well, since `maxScroll` and every `scaleFor`
      result change with the viewport.
      Verified by sampling the transform every frame of a real flight and recovering the
      board-space centre from each matrix: 34 frames, centre-x starts at 1800 (whole
      board), never exceeds 1800, ends at 700 (contact). The stops it used to tour sit at
      2745 and 2800, so the old behavior would have shown a maximum near 2800. `scrollY`
      lands exactly on 9257 as expected, the landing transform is string-identical to the
      one scroll alone produces at that offset, and a mid-flight wheel cancels cleanly and
      stays stable. Plain scrolling untouched: `cdp.mjs stops` and the tripwires are
      unchanged.
      TWO follow-up fixes after the owner looked at it, both worth remembering:
      (1) the flight first reused `ease()`, which carries a 0.22 DWELL at each end so the
      camera RESTS at a stop while the wheel carries you past it. Applied to a flight that
      deletes the ease-in and the ease-out and leaves a lunge in the middle: at 520ms it
      was 114ms frozen, a 292ms dash across a fourfold zoom, then 114ms frozen. NEVER
      reuse `ease()` for anything that is not the scroll mapping; the flight has its own
      `FLY_EASE`.
      (2) the flight then ran as a `requestAnimationFrame` tween and was unusably laggy.
      `.board` is 3600x2400 with `will-change: transform`, and a composited layer must be
      RE-RASTERISED whenever its scale changes, so every frame re-rendered 41 megapixels
      of paper texture, filter stacks and blend modes. It is a CSS transition now, which
      Chrome runs on the compositor thread from a single raster. Type goes slightly soft
      mid-flight and snaps sharp on landing, which is the normal trade.
      Two load-bearing details in that transition. The start frame is written with the
      transition OFF and committed with a forced reflow (`void board.offsetWidth`) before
      the transition is armed, or the browser coalesces both writes, sees only the
      destination, and nothing animates. And a backstop timer is required because
      `transitionend` never fires when the two framings are identical, which happens
      whenever somebody clicks the zone they are already in; without it `flying` stays up
      and deafens every scroll event.
      A third trap, self-inflicted: replacing the tween block also deleted its
      `var FLY_MS` and `var flying` declarations. Under `"use strict"` the first
      assignment threw and clicking did nothing at all, with a clean console at load.
      `scrollY` coming back 0 instead of 9257 is what caught it.

- [x] **Phase 4c: Motion performance pass**
      DONE 2026-08-18, after the owner reported the whole site feeling slow and asked for
      it to hold up on weak machines. His hypothesis was oversized images; measured and
      ruled out (nothing over 2MP, whole asset set under 1.8MB). The cost is all runtime
      rendering on a 3600x2400 layer that is 34.6 million device pixels, about 132MB, at
      2x.
      Measured cost WHILE MOVING, before -> after:
      SVG filters 32 -> 0, mix-blend-mode elements 16 -> 0, filter passes 73 -> 24,
      background layers 123 -> 98. At rest every one of them returns, unchanged.
      What came off, and why it is safe: every SVG filter here is an `feTurbulence`
      feeding an `feDisplacementMap` (`#cut` torn edges, `#ink-a`..`#ink-t` pen tremor,
      `#roughen`), which is procedural Perlin noise generated PER PIXEL and re-run
      whenever rasterisation scale changes. `mix-blend-mode` on the six grain and ink
      overlays forced backdrop readback, which defeats the single-texture path a
      transform animation depends on. And the largest single group of filters turned out
      to be the pins: ten of them, each with a `blur(1px)` highlight and a `blur(3px)`
      shadow, so twenty blur passes for decoration a few pixels wide. The strings SVG
      carried a drop-shadow across the full 3600x2400.
      What deliberately STAYED: the papers' own drop-shadows, because losing them
      mid-flight reads as the board going flat, which is worse than a dropped frame; and
      the photo colour grades on `.pol-photo` and `.pc-picture`, since the Level Up card's
      grade was tuned by the owner across three rounds.
      All of it hangs off the existing `.board.moving` class plus `html.warming`, so the
      same collapse covers scrolling, flights, and initial load. Verified: a forced-moving
      screenshot is visually indistinguishable from the still one, and the tripwires are
      unchanged at 1450/1814/1469/1798.

- [x] **Phase 5: The circular sticker replaces the center notecard**
      DONE 2026-08-18. The centre index card is now a 520px circular sticker at
      (1570, 810): white ring, 452px black disc, and the interim `W` from
      `assets/favicon.svg` inline on the disc at about 55%. Three nested parts on
      purpose, so the real logo replaces the contents of one `<svg>` and touches neither
      the ring nor the disc. It carries `data-zone-stop="0"`, so clicking it returns to
      the whole board; it is a plain `<section>` with no `tabindex`, because the zone
      handler bails on buttons and focusable elements, and the dropdown's "Whole Board"
      entry is the keyboard path.
      Pin 0 stays at (1783, 815); every red string originates there and moving it would
      drag all of them. Stop 1 retuned to `{ x: 1830, y: 1070, w: 900, h: 700 }`.
      The board's only `<h1>` lived inside that card, so the title strip's name became
      the `<h1>` and gained the kicker "Web Design & Consulting · Est. 2026". The card's
      other line, "CADEN WHITT, FOUNDER · WHITTWORKSTUDIOS.COM", was deliberately dropped:
      the founder is already the polaroid's caption and the domain is the site itself.
      Do not restore it.
      One defect found and fixed during review, introduced across Phases 3 and 5: the
      strip was still `<nav aria-label="Primary">` while holding no links, and the actual
      menu sat outside any landmark. The strip is a `<header>` now and the nav landmark
      wraps the kebab and its list, where the links actually are.
      Verified: two `<h1>` tags, one per design; the sticker is a SECTION with
      `data-zone-stop="0"` and no `tabindex`; the menu still opens, moves focus to the
      first entry, closes on Escape and returns focus to the button; `cdp.mjs stops`
      unchanged; and the Level Up caption still sits on its tape after the `hand.js`
      re-roll caused by deleting a `.marker` element, checked on a screenshot.
      Tripwires 1450/1814/1469/1798 -> 1387/1814/1406/1798, arithmetic in `HANDOFF.md`.
- [x] **Phase 6: The stapled navy trim**
      DONE 2026-08-18. Four `<svg class="trim">` strips, 65 board pixels, flat `#1b2739`,
      wavy on the inner edge only with four DIFFERENT wave sequences, and a reusable
      `#staple-glyph` symbol at about 22 board pixels at irregular intervals. No
      gradient, shadow, filter, or blend mode anywhere in it: this shipped straight after
      two rounds of stripping render cost out of the page and none goes back for
      decoration. Authored as the FIRST children of `.board`, before the strings, so
      papers (z-index 3) and pins (7) stack above with no z-index needed.
      Coordinate note worth keeping: `.board` is `box-sizing: content-box` with a 30px
      walnut border, so its absolutely-positioned children live in a 0..3600 by 0..2400
      space that IS the cork, with the frame outside it. A child at left:0 top:0 is flush
      inside the frame.
      THREE corrections the executor made to the brief, all verified:
      (1) the bottom strip's nominal 2335-2400 box overlaps BOTH reserved cork rectangles,
      which end at y2370. The box was kept but the fill path was set back inside it so the
      painted navy reaches only y2374, 4px clear. Proven with `isPointInFill()` sampled on
      a 10px grid across both reserved rectangles: zero hits.
      (2) the right strip's inner boundary at x3535 is already 5px inside the product-card
      rectangle's x3540 edge, so its wave is tapered shallower across y1900-2370 only.
      Also zero hits.
      (3) the brief claimed the pink `.mini-sticky` overlaps the right strip at x3542.
      Measured live, its right edge is about x3484 and the painted navy starts near x3538,
      so there is a small gap of bare cork, not an overlap. No overlap was manufactured.
      The brief was also wrong that stop 6 brings trim into view; measured, stop 0 is the
      only one of the eight stops that frames any trim edge at all.
      Verified: tripwires unchanged at 1387/1814/1406/1798, `cdp.mjs stops` unchanged, all
      four strips `aria-hidden` with no `data-zone-stop`, and the trim resolves to 0x0 in
      the column layout automatically because `.corkboard` is already `display:none` there.

- [ ] **Phase 7: The form sheet**  <- NEXT
      Relocate two doodle stickies, place the form in the freed cork above the contact
      postcard, retune stop 6, write `privacy.html`.
- [ ] **Phase 8: Wire Formspree**
      `https://formspree.io/f/xyegnvzd` in a new `js/form.js`. One test submission.
- [ ] **Phase 9: Efficiency and review pass**
      Byte count against the Phase 1 baseline, judges per stop, keyboard walkthrough.
- [ ] **Phase 10: Deploy to staging, on the owner's say-so only**

## Owner decisions, 2026-08-18

- No logo yet. The sticker ships the interim `W`; swapping in the real mark later
  replaces the contents of one inline `<svg>`.
- The form gets an OPTIONAL "How did you find me?" field. Budget and timeline were
  explicitly declined; do not add them.
- Further smoothness work waits until the whole project is built. Two performance passes
  already shipped (Phase 4c). The next untouched lever is the board's 7-layer blended
  cork background, held back because collapsing it during motion risks a visible colour
  shift when it returns.

## Waiting on the owner

- The real logo art. The sticker ships the interim `W` from `assets/favicon.svg`
  until it arrives.
- Permission to push. Nothing leaves this machine until he asks.

## Never do these

- Never use, merge, or push branch `board-rebuild`. It holds the scrapped rewrite,
  parked unfinished at `8a8167a`, and the owner rejected that direction.
- Never merge or rebase into `main`. It is an unrelated staging history that gets
  rebuilt from the working branch, never merged.
- Never touch the `whittworks-site` repo. That is live production at
  whittworkstudios.com.
- Never restore Annie Meissner's testimonial. Her cork stays bare until the owner
  raises it and confirms.
- Never fill the reserved cork: x 1240-2340 y 1990-2370 (parked testimonial), and
  x 2400-3540 y 1900-2370 (future product cards).
- Never screenshot through the in-app browser pane. It returns black images when
  hidden. Use `tools/verify/cdp.mjs`.
- **Never dispatch a click on a `mailto:` link in the harness.** Headless Chrome still
  hands the URL to the OS default mail client, which opened Outlook on the owner's
  machine mid-session on 2026-08-18. There are three of them on this page: the circled
  address on the contact postcard, the pink portfolio sticky, and the form's failure
  fallback once it exists. To test that a link wins over a zone click, register a
  capture-phase listener that calls `preventDefault()` BEFORE dispatching, and stub
  `window.scrollTo` to record the decision rather than letting anything navigate. See
  the Phase 4 entry for the working recipe.
- The motion override is gone by the owner's decision (2026-08-18). Do not
  reintroduce it. The OS `prefers-reduced-motion` setting is the only authority.

## Verification commands

```bash
node tools/verify/cdp.mjs stops     # eight camera stops, both motion modes
node tools/verify/cdp.mjs modes     # the six render modes and the tripwires
node tools/verify/cdp.mjs shot 0    # screenshot at a stop -> tools/verify/out/
```

## Session log

- 2026-08-17: click-to-zoom rewrite planned and started on `board-rebuild`.
- 2026-08-18: owner scrapped the rewrite. Rewrite parked at `8a8167a`, never pushed.
  Local `corkboard-realism` was 12 commits stale and was fast-forwarded to `2540468`;
  that stale branch is why an earlier session wrongly concluded the two bottom pills
  came from a browser extension. They are real elements at `index.html:551-556`.
  Branch `board-edits` cut, new plan written, Phase 1 not started.
- 2026-08-18: owner decided the motion escape hatch can go entirely, and specified the
  frame: dark navy, wavy, narrow, very small staples, background trim rather than a
  focal point. Plan updated.
- 2026-08-18: Phase 1 complete. Bottom chrome and motion override deleted, verified
  against a pre-edit worktree, tripwires re-baselined in HANDOFF.md.
- 2026-08-18: Phase 2 complete. Portfolio rename in both designs, pink sticky is now a
  mail link, grammar and capitalization fixed, tripwires re-baselined.
- 2026-08-18: push unblocked. A re-scoped token is cached in the macOS keychain, so
  pushes work from any session on this machine. `board-edits` is on origin, and
  `board-rebuild` is confirmed NOT on the remote and must stay that way.
- 2026-08-18: Formspree endpoint confirmed live. A GET to
  `https://formspree.io/f/xyegnvzd` returns 405 Method Not Allowed, which is a POST-only
  route answering; a bad form id returns 404. Which inbox it delivers to is still
  unproven, and only Phase 8's real submission can prove that.
- 2026-08-18: Phase 3 complete. Anton title, kebab dropdown, six wired entries, and the
  reading-mode fallback map completed.
- 2026-08-18: Phase 4 complete. Ten clickable papers, Escape backs out to the whole
  board. Owner then reported the click sweeping through every intervening section, so
  4b replaced the animated scroll with a direct camera flight. FLY_MS is the one dial. A verification step written for this phase told a subagent to click the page's
  mailto links, which opened the owner's Outlook. Never do that; see "Never do these".
