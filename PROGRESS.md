# Progress tracker: editing the cork board in place

Read this file FIRST in any new session. `PLAN.md` holds the approved plan this
checklist executes. `HANDOFF.md` and `AGENT-HANDOFF.md` hold the traps. Nothing
here supersedes them.

**Repository:** `/Users/cadenwhitt/Claude Code Projects/Experimentation/Final Project/whittworks-CorkboardTesting-site`
**Working branch:** `board-edits`, cut from `corkboard-realism` at `2540468`
**Last updated:** 2026-08-18. ALL TEN PHASES COMPLETE AND DEPLOYED TO STAGING.

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

- [x] **Phase 7: The form sheet**
      DONE 2026-08-18. Airplane and chart2 doodles relocated to the open band above the
      About card. A `.contact-form` paper sheet at `left:120px top:1000px 880x480`
      `--rot:-0.4deg`, carrying `data-zone-stop="6"`. Two columns for the short fields:
      Name | Email, then Phone | How Did You Find Me?, the consent notice, then a
      full-width Project Description textarea, then Send and the privacy link. Fields are
      `name`, `email`, `phone`, `heard-from`, `project` (minlength 20) plus a `_gotcha`
      honeypot. New `js/validate.js`, new `privacy.html`, stop 6 retuned to
      `{ x: 575, y: 1489, w: 980, h: 1050 }`.
      TWO corrections the executor made, both found by measuring:
      (1) `index.html`'s CSP carried `form-action 'none'`, which silently refuses to
      navigate to the Formspree action. Now `form-action 'self' https://formspree.io`.
      Without this the form would have looked fine and done nothing.
      (2) the brief's clearance maths compared the new sheet's UNROTATED edges against
      neighbours' already-rotated measured positions, double-counting margin. At the
      briefed 900x480 the sheet cleared the About card by 10px, not 40. Resized to
      880x480 at -0.4deg; measured worst-case clearances are about-card 57.5, postcard
      43.2, polaroid 46.0, left trim 53.3.
      Also worth keeping: setting `.value` from script does NOT trip `minlength`, because
      the spec gates `tooShort` on a dirty value flag that script assignment never sets.
      Validation tests must drive real typing (CDP `Input.insertText`) or they give a
      false negative.
      ONE defect I fixed after the handoff: the executor added a pin on the sheet and a
      string from it down to the postcard's pin, and the older sticker-to-postcard string
      now crossed the sheet as well. Two red strings ran straight through the Email label
      and the description box. Pin 10 moved to the sheet's TOP-RIGHT corner (952, 1024),
      `[0, 7]` became `[0, 10]` so the sticker's line ends on the form's own pin over open
      cork, and the form-to-postcard string was dropped entirely: any line between those
      two pins must cross one sheet or the other, and a string over an input is in the
      way rather than charming. The postcard keeps its pin unstrung.
      Verified: type renders at 16.29 CSS px under stop 6 at 1440x900, above the 15px
      floor; empty submit focuses Name, a bad email focuses Email, a 5-character
      description focuses Project Description, each with its own message and nothing
      leaving the machine; `cdp.mjs stops` unchanged; `privacy.html` loads and the form's
      link reaches it. Tripwires 1387/1814/1406/1798 -> 1694/1814/1713/1798, +244 on the
      two board-driven renders only.

- [x] **Phase 8: Wire Formspree**
      DONE 2026-08-18. New `js/form.js` POSTs the form to
      `https://formspree.io/f/xyegnvzd` with `Accept: application/json` so the visitor
      stays on the board instead of landing on Formspree's confirmation page. Pure
      enhancement: the form's own `action`/`method` still work if the script is blocked,
      missing, or throws, and the handler stands down entirely when `fetch` or `FormData`
      is absent. It also cannot run on an invalid form, because the browser does not fire
      `submit` when its own constraint validation fails.
      CSP widened by exactly one origin: `connect-src 'none'` -> `connect-src
      https://formspree.io`. Without that the fetch dies silently. The stale comment above
      the CSP was rewritten to match.
      A `#cf-status` line with `role="status"` sits OUTSIDE the form, because success
      hides the whole form and a status inside it would vanish with it. Hidden at rest, so
      the tripwires do not move.
      Failure path tested by forcing a rejected fetch: the form STAYS on screen so nothing
      typed is lost, the button re-enables, and the fallback is a `mailto:` link built
      after the failure from the values in hand, carrying name, email, phone, how they
      found the studio, and the full project description. Verified the typed text really
      is in the link.
      The honeypot short-circuits before any request: a filled `_gotcha` gets the same
      acknowledgement a person gets and nothing is sent.
      LIVE TEST SENT ONCE, 2026-08-18, every field reading "TEST SUBMISSION, ignore".
      Formspree accepted it and the success state rendered. Owner to confirm receipt; a
      brand-new Formspree form sends an activation email on first submission rather than
      the message itself.
      Tripwires unchanged at 1694/1814/1713/1798, `cdp.mjs stops` unchanged.

- [x] **Phase 9: Efficiency and review pass**
      DONE 2026-08-18. TWO parts.
      EFFICIENCY: Phase 5 deleted the only element on `index.html` set in Permanent
      Marker, but the face was still declared in `style.css` AND preloaded at high
      priority, so every visit fetched 29KB to letter nothing. Removed from the preload,
      the `@font-face`, the `--marker` property, `hand.js`'s selector list, and a dead
      `reading.css` rule. The FILE stays in `assets/` because `404.html` still uses it and
      carries its own `@font-face`.
      Measured against `be7e9d9`, counting only what `index.html` pulls in:
      uncompressed 1,836,268 -> 1,870,695 (+34,427); over the wire 1,714,091 ->
      1,707,374 (-6,717). The raw figure grew because this branch added a form, a menu,
      click-to-zoom, validation and a privacy page, all source text. The wire figure is
      what Pages serves and it FELL: dropping the font more than paid for the new code.
      REVIEW: an independent judge looked at all eight stops, the phone layout at several
      scroll positions, `privacy.html` and `404.html` at both widths, and the console
      throughout. Console clean everywhere. It found two copy defects, and checking them
      turned up a third:
      `index.html:454` still read "CADEN WHITT — FOUNDER" with a literal em dash, which
      is why a `&mdash;` grep had missed it; `:504` had the same em-dash-for-comma in
      Chad's editorial attribution; and `:494`'s Level Up link used a pair of em dashes as
      separators. All three were EDITORIAL-only, which is how the Phase 2 pass missed
      them. Fixed to commas and to the middot this site already uses.
      The board's quote attribution at `:850` KEEPS its leading em dash on purpose: that
      is an attribution mark in a typewriter composition, not prose, and `.attr` carries
      no `text-transform`, so its uppercase is authored and deliberate.
      Judged NOT worth chasing: a faint mark after "CO-FOUNDER" at stop 5. It sits at the
      edge of an ink-filtered glyph and reads as a filter artifact, not a stray character.
      Keyboard: 12 tab stops in sensible document order, the `_gotcha` honeypot correctly
      OUT of the tab order via `tabindex="-1"`, and `:focus-visible` set universally at
      `css/style.css:278` with no `outline: none` anywhere to defeat it.
      Tripwires 1694/1814/1713/1798 -> 1694/1812/1713/1796.

- [x] **Phase 10: Deploy to staging**
      DONE 2026-08-18. Staging is live at
      https://notcadenwhitt-stack.github.io/whittworks-CorkboardTesting-site/
      `main` force-updated 47ce8ae -> 1261db1, rebuilt FROM `board-edits` and never
      merged into, which is this repo's standing convention. Two differences from the
      branch: `CNAME` deleted so staging cannot answer for whittworkstudios.com, and the
      robots noindex meta added to `index.html` and to the new `privacy.html`.
      The previous staging tip is recoverable at tag
      `staging-before-board-edits-20260818` (47ce8ae), which is pushed.
      The commit and the force-push were BLOCKED by the permission classifier and the
      owner ran them himself. Expect that again on the next staging rebuild; it is the
      guard doing its job, not a fault.
      Verified live through headless Chrome (the shell sandbox cannot reach *.github.io):
      first check served the OLD build, which is Pages not having rebuilt yet rather than
      a bad deploy; the second, about two minutes later, served the new one. Confirmed on
      the live URL: noindex present, serving from github.io so the CNAME removal took,
      sticker present, 4 trim strips, the form present with action
      `https://formspree.io/f/xyegnvzd`, 6 menu entries, 12 zone targets, innerText 1694
      matching the local board tripwire exactly, and the console clean. A live screenshot
      shows the whole board rendering correctly.
      Byte count against the Phase 1 baseline of 1,842,182 across 47 files, judges per
      stop, keyboard walkthrough.

## THE CAMERA COORDINATE BUG, found 2026-08-19

`.board` carries the walnut frame as a CSS `border`, and its `transform` moves the
WHOLE element, border included. Every paper on it is positioned INSIDE that border.
So a paper's y and a camera stop's y were never the same number: they differed by
exactly the border width, and every stop framed that far off.

At 30px it read as slack in the tuning. Thickening the walnut to 96px shifted every
stop 66 further and pushed the contact form's Send row out of frame, which is how it
surfaced. Measured before the fix: stop 6 declares centre y 1489, the actual visible
centre was 1393.

`writeFraming()` now adds the border to x and y when composing the transform, read
from the element's computed style rather than hard-coded, so changing the frame again
cannot silently reopen this. Verified: stop 6's visible board rect is now exactly
y 964-2014, which is what its numbers say, and the Send row is inside it.

Same family as the string bug: two coordinate systems that looked identical while the
border was thin.

## FINAL ZOOM SETTINGS, signed off 2026-08-19. Change these together, not singly.

    js/board.js   FLY_MS       750          flight duration
    js/board.js   FLY_EASE     cubic-bezier(0.42, 0, 0.58, 1)   both directions
    js/board.js   FLY_EASE_IN  same as FLY_EASE
    js/board.js   FAR_SCALE    0.6
    js/board.js   STOPS 2-5    widened so each rests at scale 0.75
    js/board.js   STOP 6       left at 0.857 (see below)
    css/style.css MOVE_SETTLE consumer: settle() must refuse to run while flying

WHY EACH VALUE IS WHAT IT IS, so nobody re-litigates it by feel:

- **Stops 2-5 rest at 0.75, not 0.9-1.0.** The board needs a texture of
  3600 x scale x devicePixelRatio to draw sharply, so the resting scale sets how
  much the compositor re-rasters mid-flight. 0.75 puts each zone at ~74MB against
  105-132MB before. This is the single change that made the zoom feel good.
- **Stop 6 (Contact) is deliberately closer at 0.857.** The form's labels and
  inputs are 19 board px and clear the 15 CSS px legibility floor ONLY at that
  scale; at 0.75 they render at 14.25 and fail. Do not "fix" the inconsistency.
- **FLY_MS 750 is not near a ceiling.** An earlier test said 750 was clicky and
  660 was safe. That reading was WRONG: settle() was still firing mid-flight, so
  at 750ms against a 600ms settle the most expensive frame on the page landed 80%
  of the way through every move. Once settle was taught to wait for the landing,
  750 became smooth. **If clicks ever return, check settle before touching this.**
- **Both directions share one curve now.** Zoom in briefly had its own lazier
  opening to hide the allocation spike that only zooming IN pays (out is cheap:
  the board is already drawn large and the compositor just shrinks it). Measured,
  that curve peaked at 2.06x the average speed and did so 63% of the way through,
  against 1.72x dead-centre for the shared one, and the owner felt the difference
  as jerk. Most of what it was hiding was the settle bug.

## RESOLVED 2026-08-19: the zoom, and what actually fixed it

The owner confirmed the zoom is smooth. Four things were wrong and they were fixed in
this order; only the last two were the ones he could feel.

1. `ease()` reused for the flight. It carries a 0.22 DWELL at both ends, right for the
   scroll mapping and wrong for a flight, where it deletes the ease-in and ease-out.
2. A `requestAnimationFrame` tween re-rasterising a 3600x2400 layer every frame. Moved
   to a CSS transition so the compositor owns it.
3. `FLY_EASE` was `cubic-bezier(0.45, 0, 0.15, 1)`, whose control points are out of
   order in x. Measured: 20% of the distance in the first quarter of the duration, 60%
   more in the next quarter, then a crawl. The owner called it "a brief pause, then a
   quick zoom, then a stutter". Now `cubic-bezier(0.42, 0, 0.58, 1)`.
4. **The one that finished it: FLY_MS 760 -> 430.** The board needs roughly a 132MB
   texture to draw sharply at a zone's scale on a 2x display (218MB at stop 1). Chrome
   will not hold one that big for the length of an animation, so it RE-rasterises at
   intervals, and each one is a stall plus a visible pop. The owner described the result
   as "big zoom, click, little zoom, click, little zoom, stabilise". A flight's duration
   is therefore the number of intervals it spans; a shorter one collects fewer.
   **If this ever regresses, look at FLY_MS before looking at render cost.**

The three render-cost passes (Phase 4c and the two post-deploy rounds) were still worth
keeping, and the page is genuinely cheaper for them, but none of them was the thing he
was seeing. Diagnose the animation before optimising the paint.

Texture cost per stop at 1440x900 on a 2x display, for reference:
stop 0 scale 0.34 = 16MB, stop 6 0.86 = 97MB, stops 3/4 0.90 = 107MB, stop 2 1.00 =
132MB, stop 1 1.29 = 218MB. Widening the zone framings by about a fifth would roughly
halve these; offered to the owner and not taken, because it changes how close each zone
sits.

## THE STRING BUG, found 2026-08-19 (read this before touching .strings)

`.strings` was sized with `position: absolute; inset: 0; width: 100%; height: 100%`
and that box resolved to **3408x2208**, short by exactly 192 in each axis, which is
twice `.board`'s border width. The viewBox is `0 0 3600 2400`, so
`preserveAspectRatio` fitted a 3600-wide coordinate system inside a 3408-wide element:
every string coordinate came out scaled by 0.92 and shifted 48 units sideways, while the
pins, laid out with plain `left`/`top`, sat where they belonged. Measured error at the
far end of a long string: 73.7 screen pixels, over 200 board pixels.

It was ALWAYS wrong. With the old 30px frame the error was 60 units and read as
artistic slack. Thickening the frame to 96px tripled it, which is why the owner
suddenly said the strings connect to nothing. He was right and two earlier "fixes"
(re-stacking, then reducing sag) were both treating symptoms.

Fixed by giving `.strings` explicit board units: `left: 0; top: 0; width: 3600px;
height: 2400px`. Verified: every string endpoint now lands 0.0 screen pixels from its
pin's centre, measured by converting each path's start and end through
`getScreenCTM()` and comparing against every pin's rendered centre.

NEVER size this element with percentages or `inset`. It must occupy exactly the same
coordinate space the pins do, because `js/board.js` draws both from one PINS array.

## Third post-deploy round, 2026-08-19

- **The flight easing was the "choppy zoom", not performance.** `FLY_EASE` was
  `cubic-bezier(0.45, 0, 0.15, 1)`, whose second control point sits at x=0.15, BEFORE the
  first at x=0.45. Measured, that curve covers 20% of the distance in the first quarter
  of the duration, 60% more in the next quarter, then crawls through the last 20% for
  half the duration. The owner described it unprompted as "a brief pause, then a quick
  zoom, then a stutter before it's done", which is that curve read off a screen.
  Now `cubic-bezier(0.42, 0, 0.58, 1)`: symmetric, 50% of the way at 50% of the time,
  no abrupt change of speed. **Do not put a control point out of order again.**
- **The strings.** Two wrong fixes before the right one, so the reasoning is worth
  keeping. It is NOT geometry: every strung pin lands inside a paper and `.pin`'s
  `margin: -15px` centres each pin exactly on its path endpoint. It was NOT stacking
  either, though stacking made it worse in both directions: at `z-index: 1` a string
  vanishes under a sheet for its entire final approach and surfaces only as stubs between
  papers, so no endpoint is visible at all; at 6 it stays continuous into its pin and the
  pin, one layer up, covers the join.
  The actual cause was the SAG. It was `24 + dist * 0.055`, which on a typical 1090px run
  puts 84 board pixels of droop in the curve, so the line arrives at its pin from a steep
  angle well below the straight path and reads as a squiggle that happens to pass near a
  pin. Now `10 + dist * 0.02`, about a third: still string rather than wire, but taut
  enough that each line visibly runs pin to pin.

## Second post-deploy round, 2026-08-19

- **The strings looked "connected to nothing".** Not a geometry bug: a probe confirmed
  every strung pin (0-7 and 10) lands inside a paper, and `.pin`'s `margin: -15px`
  centres each pin exactly on the path endpoint. It was STACKING. `.strings` sat at
  `z-index: 6` against papers at `3`, so every string drew across the TOP of every sheet
  it passed, which reads as a red line on the photograph rather than something holding
  paper down. `.strings` is `z-index: 1` now: a string disappears under a sheet,
  re-emerges on open cork, and only ever ends at a pin sitting on top. It also removes a
  full-board translucent layer from the overdraw.
- **Third performance pass**, after the owner said it was better but still struggling:
  (1) `.strings`' own full-board drop-shadow is off while moving or far.
  (2) `.viewport::after`, the room's grain and vignette, is a full-viewport composite
  ABOVE the board, so it re-composites over everything on every frame of a flight. It is
  `display: none` while moving. It lives outside `.board`, so `js/board.js` mirrors the
  moving state onto the root element as `board-moving-scene`.
  (3) The board's two `--cork-lq` placeholder background layers are covered by an opaque
  layer the moment `cork.webp` decodes, but stayed in the stack as two more blended
  layers to composite across 3600x2400 on every rasterisation. `js/board.js` now signals
  `cork-ready` on `decode()` (not `onload`, which fires before the bitmap is ready) and
  the stack drops 7 layers -> 5.
  (4) Paper shadows use `box-shadow` instead of `filter: drop-shadow` while moving OR
  far. drop-shadow derives its shape from rendered alpha, so it renders the element then
  blurs that result; box-shadow follows the border box. The papers are plain rectangles
  in exactly these states anyway, because `url(#cut)`'s torn edge is already off.
  Measured at 1440x2 DPR. Whole-board resting state: filter passes 25 -> 8, SVG filters
  0, blur passes 0, board background layers 7 -> 5. During a close-up move: filter passes
  24 -> 8. Tripwires and stops unchanged; stop 0 screenshot visually intact.

## Post-deploy round, 2026-08-19

- **The navy trim is gone.** The owner disliked it and asked for a thick solid walnut
  border instead. The four `.trim` SVGs, the `#staple-glyph` symbol and all the `.trim`
  CSS were deleted, and `.board`'s own frame went from `border: 30px` to `border: 96px`
  with the border-image slice re-fitted (`85 / 96px round`). The wood scan is 256px and
  the slice is 85, so at 96px it renders near 1:1 instead of the 3x oversupply it sat at
  when the lip was 30. Do not reintroduce a paper trim.
- **Expensive effects are now gated on ZOOM LEVEL, not just motion.** This is the fix for
  the owner's report that a zoom OUT would "buffer, then click into place" at the very
  end. Tying the collapse to `.moving` alone put the entire restore cost at the end of a
  zoom out, which is the one framing where every paper is on screen at once and so every
  filter has to be rasterised together.
  `js/board.js` now sets a `far` class on `.board` when the camera's scale drops below
  `FAR_SCALE` (0.6), toggled only when it actually flips rather than every frame, and the
  three collapse blocks in `css/style.css` list `.board.far` alongside `.board.moving`.
  Measured at 1440x900: the whole board rests at 0.34 and every zone stop lands between
  0.86 and 1.29, so 0.6 separates them with no stop near the boundary.
  Effect at the whole-board framing: SVG filters 31 -> 3, mix-blend elements 16 -> 1,
  blur passes 22 -> 0. Zoomed in, all of it returns. Screenshots at stop 0 and stop 2
  confirm the board looks identical at distance and keeps its full ink tremor up close,
  which is the premise: two displacement pixels cannot be resolved at a third of scale.
  Papers KEEP their drop-shadows at far zoom on purpose; losing those reads as the board
  going flat.

## Owner decisions, 2026-08-18

- No logo yet. The sticker ships the interim `W`; swapping in the real mark later
  replaces the contents of one inline `<svg>`.
- The form gets an OPTIONAL "How did you find me?" field. Budget and timeline were
  explicitly declined; do not add them.
- Further smoothness work waits until the whole project is built. Two performance passes
  already shipped (Phase 4c). The next untouched lever is the board's 7-layer blended
  cork background, held back because collapsing it during motion risks a visible colour
  shift when it returns.

## WHEN YOU ADD POSTHOG (or any analytics), do these three things

The consent gate is built and wired; the analytics itself is deliberately NOT installed.

1. **Check the gate before loading anything.** `js/welcome.js` exposes
   `window.wwAnalyticsGranted()`. The provider's snippet must not run at all unless it
   returns true. Analytics is not "strictly necessary" storage, so under GDPR it needs
   opt-in BEFORE it loads, not a banner shown alongside it.
2. **Widen the CSP.** `index.html`'s Content-Security-Policy currently allows
   `script-src 'self' 'unsafe-inline'` and `connect-src https://formspree.io` and nothing
   else. PostHog will fail silently until its origin is added to BOTH. Silent is the word:
   a blocked script logs to the console and does nothing else.
3. **Update `privacy.html`.** It currently states the site uses no analytics. That
   sentence becomes false the moment this ships, and the welcome panel says the same
   thing in its Privacy and Cookies section.

The consent decision lives in `localStorage` under `ww-analytics`, values `granted` or
`denied`, and the panel shows and lets a visitor change their current choice.

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
- 2026-08-20: Welcome-panel copy pass. Legal footer lost the "Terms and Accessibility
  are being written." note, and the heading plus link row now sit in
  `.welcome-footer-block` so LEGAL centres over its own links rather than
  right-aligning independently. Privacy block reordered so the two buttons
  (Allow cookies / Deny) come first and the disclosure sits under them at
  0.74rem; the consent status line dropped to the same size. Board tripwire
  2315 -> 2271 -> 2331 across the two edits; the four non-board modes never
  moved. Deployed to staging main at style.css?v=92.
