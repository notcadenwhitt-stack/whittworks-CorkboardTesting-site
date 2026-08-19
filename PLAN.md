# Plan: Edit the existing cork board, in place

Approved 2026-08-18. Supersedes the previous plan (recoverable at commit `2540468`
on `corkboard-realism`). This plan REPLACES the abandoned click-to-zoom rewrite,
which is parked unfinished at commit `8a8167a` on branch `board-rebuild` and is
never used, merged, or pushed.

Repository: `/Users/cadenwhitt/Claude Code Projects/Experimentation/Final Project/whittworks-CorkboardTesting-site`
Working branch: `board-edits`, cut from `corkboard-realism` at `2540468`.

**One-line goal:** the cork board that ships today loses its bottom chrome, gains
clickable zones, a stapled paper frame, a circular logo sticker, an attention-grabbing
title with a kebab menu, and a working contact form, without any part of it being
rebuilt from scratch.

## Classification

Track: UI build, executed as a series of edits to a working site. One Feature slice
(the contact form) and one Integration edge (Formspree) fold in. Parked secondary
asks: the real logo art, the merge to production at `whittworks-site`, the parked
Annie Meissner testimonial, mobile polish.

## Interview Ledger

- Q1 scroll or click-only -> keep scrolling, add clicking on top (recommended, accepted)
- Owner then deferred every remaining fork ("whatever you think works best"), so the
  rest of this plan is defaulted and tagged. Every default is listed in the
  Assumptions Ledger and in the Defaulted Decisions recap.

Questions spent: 1 of 14.

## Goal & Success Criteria

1. No fixed chrome appears at the bottom of the window at any camera stop.
2. Clicking any zone's paper on the opening board frame moves the camera to that
   zone's existing stop. Scrolling still works exactly as it does today.
3. The top strip carries a centered, attention-grabbing "WhittWorks Studios" title
   and a kebab button at the top right that opens a dropdown.
4. The center notecard is a circular sticker: white ring, black inner disc, logo slot.
5. Paper strips are stapled around the inner edge of the cork.
6. A visitor can submit name, email, optional phone, and a project description, and
   the owner receives it as email.
7. Every visible sentence uses correct capitalization and grammar; "Work" reads
   "Portfolio" everywhere; "More portfolio available on request" opens a mail composer.
8. Referenced payload does not grow beyond today's measured total.

## Current State

- Branch `board-edits` at `2540468`, tree clean (verified: `git status`, `git log`).
- `index.html` 795 lines, `css/style.css` 1722, `css/editorial.css` 466,
  `css/reading.css` 329, `js/board.js` 528, `js/hand.js` 132, `js/peek.js` 125
  (verified: `wc -l`).
- The camera maps `window.scrollY / maxScroll` across eight stops; the runway is
  `.scroll-space` at 1300vh (verified: `js/board.js:299-336`).
- Eight stops are already tuned, including the five this plan makes clickable
  (verified: `js/board.js:136-145`):
  stop 0 whole board, 1 title card, 2 about, 3 services, 4 work, 5 reviews,
  6 contact, 7 pull back out.
- The `.deskbar` nav links already jump the camera by calling `window.scrollTo` to a
  stop's offset, with a `scrollIntoView` fallback when the camera is not active
  (verified: `js/board.js:485-521`).
- `index.html:551-556` holds the two pills the owner wants gone:
  `<p class="scroll-hint">Scroll to move around the board</p>` and
  `<button class="motion-toggle">Smooth motion</button>`. Their CSS is
  `css/style.css:384-455`. Added in commit `44ddb97` (verified: `git log`).
- The same words are authored twice, once as cork paper and once as the tan editorial
  page. "Work" appears as a label at `index.html:396` (editorial nav), `:468`
  (editorial note), `:527` (deskbar), and `:631` (the pink sticky) (verified: `grep`).
- Every paper's board-space rectangle was measured at 1440x900 (verified: headless
  probe, 2026-08-18). Free cork and reserved cork are named in the layout section.
- No privacy policy page exists (verified: repo holds `index.html` and `404.html`).

## Scope (v1)

Edits to `index.html`, `css/style.css`, `css/editorial.css`, `css/reading.css`,
`js/board.js`, plus one new `js/form.js` and one new `privacy.html`. No file is
rewritten from scratch. No existing paper is redesigned except the center notecard,
which the owner asked to replace. Assets are reused byte for byte.

## Out of Scope & Parked Items

- **The abandoned rewrite** on `board-rebuild`. Never used, never merged, never pushed.
- **The real logo.** The sticker ships the interim WhittWorks `W` on the black disc.
- **Annie Meissner's testimonial.** Her cork stays bare.
- **Production.** `whittworks-site` and `whittworkstudios.com` are not touched.
- **Product cards** for the reserved cork under the Level Up print.
- **Mobile and tablet polish** beyond keeping the existing editorial fallback working.
- **Analytics.** None today, none added.

## Approach

Nine small edits to a working site, each independently verifiable, each committed
on its own.

The camera is not touched. Clicking a zone calls `window.scrollTo` to that zone's
stop offset, which is byte-for-byte the path the deskbar links already take
(`js/board.js:496-521`). The scroll runway, the stop interpolation, the fade logic,
the reduced-motion handling, and the reading-mode fallback all keep working because
none of them learn anything new. A click is just a fifth way to reach a stop the
site could already reach.

The bottom chrome disappears, and the motion override inside it goes with it. That
control exists because the owner opened the site on a machine with Windows animation
effects off and saw the camera hard-cut with nothing explaining why (verified: the
comment at `index.html:540-550`). He decided on 2026-08-18 to drop it anyway, and the
reasoning holds: that failure was ugly because a hard cut mid-scroll reads as a broken
page, and this board is becoming primarily click-driven, where a cut between two
composed framings reads as a deliberate jump. The OS setting becomes the sole
authority, which is the WCAG default position.

Copy is authored twice in this codebase, so every copy edit lands in both the board
markup and the editorial markup, and the `innerText` tripwires get re-measured after.

Executor's choice: the dropdown's animation, the staple glyph's exact path, the form
sheet's paper texture, and the easing on the sticker's hover.

## Requirements

| # | Requirement | Acceptance check |
|---|---|---|
| R1 | THE SYSTEM SHALL render no fixed chrome at the bottom of the window at any camera stop. | Screenshots at stops 0, 2, 4, 6 |
| R2 | THE SYSTEM SHALL continue to move the camera on scroll, across the same eight stops, at the same framings. | The existing `cdp.mjs stops` check still passes |
| R3 | WHEN a visitor clicks a zone's paper on the board, THE SYSTEM SHALL move the camera to that zone's stop. | Five scripted clicks, transform compared to the stop's matrix |
| R4 | WHEN a visitor clicks a real link inside a zone, THE SYSTEM SHALL follow the link and SHALL NOT move the camera. | Click the Level Up caption, the circled email, and the portfolio sticky |
| R5 | THE SYSTEM SHALL render a centered "WhittWorks Studios" title on the top strip, and a kebab button at the top right. | Screenshot at three viewport widths |
| R6 | WHEN the kebab is pressed, THE SYSTEM SHALL open a dropdown listing About, Services, Portfolio, Reviews, Contact, and Whole Board; Escape SHALL close it and focus SHALL be trapped while open. | Keyboard walkthrough |
| R7 | THE SYSTEM SHALL replace the center notecard with a circular sticker: white ring, black inner disc, logo slot. Clicking it SHALL return the camera to the whole board. | Screenshot plus click test |
| R8 | THE SYSTEM SHALL render narrow dark-navy strips with a wavy inner edge, stapled by small staples along all four inner edges of the cork, in board space, obscuring no paper and reading as background trim rather than a focal point. | Screenshot at stop 0, judged against "does the eye land on it first" |
| R9 | THE SYSTEM SHALL collect Name (required), Email (required, format-checked), Phone (optional, consent notice attached), Project description (required, 20 characters minimum), and How did you find me (optional). | Submit with each field empty in turn |
| R10 | WHEN the form is submitted, THE SYSTEM SHALL POST to Formspree and show a paper acknowledgement; on failure it SHALL show the error and a `mailto:` link carrying the typed content. | One live submit, one submit with the network offline |
| R11 | THE SYSTEM SHALL label the portfolio section "Portfolio" in both designs, and "More portfolio available on request" SHALL be a `mailto:caden@whittworkstudios.com` link. | Grep for "Work" as a label returns nothing; click opens the composer |
| R12 | THE SYSTEM SHALL use correct capitalization and grammar in every visible string, in both designs. | Full copy read-through against the checked list |
| R13 | THE SYSTEM SHALL leave the second testimonial's cork bare. | Visual check at stop 5 |
| R14 | THE SYSTEM SHALL be fully operable by keyboard and SHALL keep working with scripting disabled and at 390x844. | Tab walkthrough; the existing `cdp.mjs modes` check |
| R15 | THE SYSTEM SHALL load no third-party runtime JavaScript and SHALL NOT grow the referenced payload. | Network log; byte count before and after |
| R16 | THE SYSTEM SHALL serve `privacy.html`, linked from the form. | Load the page, follow the link |

## Key Decisions

- **Edit in place, never rewrite** (user, 2026-08-18).
- **Scrolling stays; clicking is added on top** (user, Q1).
- **Zone framings rest at scale 0.75, except Contact at 0.857** (user, signed off
  2026-08-19). Widening stops 2-5 cut each zone's texture from 105-132MB to ~74MB and
  is what made the zoom feel good. Contact stays closer because the form's type fails
  the 15 CSS px floor below 0.857. Final motion settings and the reasoning behind each
  are recorded in `PROGRESS.md` under "FINAL ZOOM SETTINGS".
- **Clicks set scroll instantly and fly the camera directly** (user, 2026-08-18, after
  seeing the first version). Animating scroll made the camera tour every intervening
  stop, because the camera is a pure function of scroll. Scroll now carries only the
  resting state; a 520ms tween owns the visual motion and takes the straight line between
  the two framings. `FLY_MS = 0` turns it into a hard cut, which is also the path reduced
  motion takes.
- **The motion override is deleted outright, not relocated** (user, 2026-08-18).
  The OS `prefers-reduced-motion` setting becomes the only authority. Accepted
  consequence: on a machine with animation effects off, the camera cuts between stops
  with no in-page way to turn gliding back on.
- **The stapled frame lives in board space**, at the cork's inner edge, so it reads as
  stapled to the board and zooms with it [A1]. It is **dark navy, narrow, and wavy
  along its inner edge, with small staples** (user, 2026-08-18). Its job is to absorb
  the empty cork margin around the papers, not to draw the eye.
- **The center notecard's tagline moves to the top strip** as a kicker under the
  title, since the sticker has no room for it [A2]. It arrives in **Phase 5**, not
  Phase 3: the notecard still holds that sentence until the sticker replaces it, and
  printing it in both places would duplicate the copy on screen for two phases.
- **The board's title is set in Anton**, the site's own display face, whose
  `@font-face` is already declared in `css/style.css:214` (verified). Cost: a
  12,004-byte font fetch on the board path, because the editorial that was Anton's only
  consumer is `display: none` there. Permanent Marker would have cost zero new bytes but
  sits in `js/hand.js`'s selector list, so it would re-roll every hand-lettered glyph on
  the board and put the Level Up caption back at risk. 12KB is the cheaper side of that
  trade, and smaller than four of the five fonts the board already fetches.
- **The dropdown is wired by widening one selector**, not by new camera code:
  `js/board.js` reads `a[data-stop]` instead of `.deskbar a[data-stop]`, so the six
  entries drive the existing, already-debugged handler (verified: real clicks in
  headless Chrome move the camera).
- **The form sheet goes in the freed cork above the contact postcard**, and the two
  doodle stickies now sitting there relocate to open cork [A3].
- **Stop 6 is retuned** to frame the form and the postcard together [A3].
- **Phone consent is an inline notice, not a checkbox**, because the owner replies to
  inbound inquiries rather than sending marketing texts [A4].
- **No CAPTCHA.** A honeypot field plus Formspree's own filtering [A5].
- **Nothing is pushed** until the owner says so. Every phase commits locally.
- **Sonnet 5 writes the code; Opus 5 plans, reviews, and approves**, escalating one
  sector to Opus 5 only after repeated failures on that same sector (verified:
  `AGENT-HANDOFF.md`, standing instruction).

## Board Layout: measured space

Board is 3600x2400 with a 30px frame border. Every rectangle below was measured at
1440x900 (verified: headless probe, 2026-08-18), in board pixels.

| Paper | x | y | w | h |
|---|---|---|---|---|
| about-card | 386 | 507 | 729 | 447 |
| caden-polaroid | 1078 | 640 | 389 | 460 |
| title-card (becomes the sticker) | 1424 | 820 | 812 | 501 |
| service stickies (four) | 2424-3267 | 350-1225 | ~357 | ~348 |
| work-postcard | 2541 | 1316 | 817 | 542 |
| portfolio sticky (pink) | 3236 | 1726 | 278 | 275 |
| chad-polaroid | 1260 | 1472 | 384 | 458 |
| quote-card | 1624 | 1530 | 711 | 439 |
| contact-postcard | 338 | 1556 | 725 | 454 |
| doodles (four) | 301, 642, 1173, 2047, 2164 | 188-1456 | ~290 | ~310 |

**Reserved cork, never fill:**
- x 1240-2340, y 1990-2370: the parked second testimonial.
- x 2400-3540, y 1900-2370: future product cards.

**Free cork the form uses:** x 250-1100, y 980-1520, once the two doodle stickies at
(301,1129) and (642,1143) relocate. Suggested new doodle homes, both clear of every
stop's framing: approximately (1560, 300) and (60, 120).

**Zone click targets and their existing stops:**

| Zone | Papers that become clickable | Stop |
|---|---|---|
| About | about-card, caden-polaroid | 2 |
| Services | all four service stickies | 3 |
| Portfolio | work-postcard | 4 |
| Reviews | chad-polaroid, quote-card | 5 |
| Contact | contact-postcard, form sheet | 6 |
| Whole board | the circular sticker | 0 |

## Data & State Changes

No database, no persistence, no cookies, no local storage beyond the motion
preference the site already stores. Form values live in the DOM until submitted, then
leave for Formspree.

## Interfaces, Integrations & Credentials

- **Formspree**, one POST from the browser to `https://formspree.io/f/xyegnvzd`,
  `Accept: application/json`, body as `FormData`. The endpoint id is public by design
  and ships in the repo; it is not a secret and needs no environment variable
  (user, supplied 2026-08-17, re-confirmed 2026-08-18). The endpoint is live: a GET
  returns `405 Method Not Allowed`, which is a POST-only route answering, where a
  non-existent form id returns 404 (verified: `curl`, 2026-08-18). So A6 is now only
  about the free tier's volume, not about whether the form exists.
- **`mailto:caden@whittworkstudios.com`**, used by the portfolio sticky, the contact
  postcard's circled address, and the form's failure path.
- **Phone consent copy**, printed under the optional phone field: "Optional. By giving
  your phone number, you agree that WhittWorks Studios may call or text you about this
  inquiry. Message and data rates may apply. Your number is never sold or used for
  marketing."
- **`privacy.html`**, a short page: what the form collects, that Formspree processes
  and delivers it, that nothing is sold, and how to ask for deletion.
- No external fonts, no CDN, no analytics. Every font is already self-hosted
  (verified: `assets/fonts/`).

## Edge Cases & Failure Handling

| Case | Behavior |
|---|---|
| JavaScript off, any width | Editorial page renders, every section readable, form submits by native POST |
| Camera not active (reading mode, narrow viewport) | A zone click falls back to `scrollIntoView`, exactly as the deskbar links do today |
| Click lands on a link inside a zone | The link wins; the camera does not move |
| Click lands on the sticker | Camera returns to stop 0 |
| `prefers-reduced-motion: reduce` | Camera cuts between stops, as today. No in-page override exists any more; the OS setting is the only authority |
| Form submitted with invalid email | Inline message under the field, focus moves there, nothing is sent |
| Formspree errors or the network is down | Error paper with a working `mailto:` fallback carrying the typed content |
| Honeypot filled | Silently accepted, never sent |
| Logo not yet supplied | Sticker shows the interim `W` on the black disc |

## Risks, Landmines & Adaptations

- **Deleting the "Smooth motion" button restores a failure the owner personally hit**
  (verified: `index.html:540-550`). The owner accepted this on 2026-08-18. Residual
  risk: a visitor with OS animations off gets hard cuts and no override. Mitigation:
  because the board becomes click-driven, a cut lands on a composed framing rather
  than mid-sweep, which is the case that read as broken. Phase 9 judges one stop-to-
  stop click with reduced-motion emulated, to confirm the cut reads as deliberate.
- **Copy is authored twice.** A one-sided edit leaves the two designs disagreeing.
  Adaptation: Phase 2 edits both and re-measures all four `innerText` tripwires.
- **`js/hand.js` jitter is document-order dependent**: adding any lettered element
  re-rolls every letterform after it (verified: `AGENT-HANDOFF.md`). Adaptation: the
  form sheet and the frame's staples carry no hand-lettering, and Phase 7 re-checks
  the Level Up caption's fit on its tape after the form lands.
- **Tape and paper that clip or filter their children** displace anything placed
  inside them (verified: `AGENT-HANDOFF.md`). Adaptation: the stapled frame's strips
  and staples are siblings in board coordinates, never children of a paper.
- **The parked testimonial gets restored by accident.** Adaptation: R13 makes bare
  cork a checked requirement, and no phase reads from `annie-wip`.
- **A form on a public page attracts spam** to a real inbox. Adaptation: honeypot plus
  Formspree filtering.
- **The live smoke test sends a real email.** Adaptation: the test payload reads
  "TEST SUBMISSION, ignore" in every field, and it runs once.
- **The in-app browser pane returns black screenshots when hidden** (verified:
  `AGENT-HANDOFF.md`). Adaptation: every visual check runs through
  `tools/verify/cdp.mjs`.
- **Rebuilding `main` is destructive.** Adaptation: Phase 10 runs only on the owner's
  say-so, tags the current `main` first, and never merges into it.

## Assumptions Ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | The strip is roughly 60-70 board pixels wide, navy near `#1b2739`, anchored to the wall's own `#233341` (verified: `css/style.css:478`), with a gentle wave on the inner edge only | The owner asked for dark navy, wavy, small, and not a focal point; the wall's blue is the palette the site already owns | Retint or resize the strip, minutes | Phase 6 screenshot |
| A2 | The notecard's tagline belongs on the top strip once the sticker replaces it | The sticker has no room and the owner wants a title up top anyway | Print it on another paper, minutes | Phase 5 |
| A3 | The form fits the free cork above the contact postcard, with the two doodles moved | Measured: that rectangle is 850x540 once the doodles relocate | Place the form elsewhere and retune stop 6, about an hour | Phase 7 |
| A4 | An inline phone consent notice suffices, no checkbox | Replies to inbound inquiries are solicited contact | Add a required checkbox, one field | Phase 7 |
| A5 | A honeypot plus Formspree filtering is enough spam defense | Low-volume studio site | Enable Formspree's reCAPTCHA, no code change | Phase 8 |
| A6 | Formspree's free tier covers the volume | Named service, plan limits unread. The endpoint itself is confirmed live (verified: GET returns 405, a POST-only route answering) | Paid tier or another service | Phase 8's live submit |
| A7 | The dropdown should carry Reviews and Whole Board, which the deskbar omits today | Stops 5 and 0 exist and are tuned | Drop two entries | Phase 3 |
| A9 | Small staples means roughly 22 board pixels wide, about half the size a staple would be on a full-size sheet | The owner asked for "very small"; below this they stop reading as staples at stop 0 | Resize one value | Phase 6 screenshot |
| A8 | Clicking a zone should not also be possible on the editorial page | The editorial has no camera | Nothing; the fallback already handles it | Phase 4 |

## Open Items (none blocking)

- **Logo file.** CONFIRMED NOT READY, 2026-08-18 (user). The sticker ships the interim
  mark; swapping in the real one later replaces the contents of one inline `<svg>` and
  touches neither the ring nor the disc.
- **Smoothness.** The owner deferred any further motion-performance work until the whole
  project is built (user, 2026-08-18). Two passes already shipped in Phase 4c; the next
  untouched lever is the board's own 7-layer blended cork background, which is held back
  because collapsing it during motion risks a visible colour shift when it returns.
- **Logo file, original note.** Not ready. The sticker ships the interim `W` from `assets/favicon.svg`
  (path `M11 17 L21 47 L32 26 L43 47 L53 17`, no fill, stroke `#FFA92B`,
  `stroke-width` 7 on a 64x64 viewBox, round caps and joins), inline so it stays sharp
  at every zoom and costs no request. Keep the markup shaped so the real logo replaces
  the `<svg>` contents without touching the ring or the disc.
- **Pushing.** Nothing is pushed until the owner says so. One word changes this.
- **Production merge.** Not planned.

## Verification

Every visual check runs through headless Chrome, never the in-app pane.

```bash
node tools/verify/cdp.mjs stops     # eight camera stops, both motion modes
node tools/verify/cdp.mjs modes     # the six render modes and the tripwires
node tools/verify/cdp.mjs shot 0    # screenshot at a stop
```

- Screenshots at stops 0, 2, 3, 4, 5, 6 at 1440x900.
- Five scripted zone clicks, each compared to its stop's transform matrix.
- Three link clicks inside zones, confirming the camera does not move.
- Keyboard walkthrough: the board, the dropdown, one zoomed zone, Escape.
- The existing `modes` check at 390x844 and with scripting disabled.
- Console clean at every stop.
- Byte count of referenced files, before and after.
- One live Formspree submit with a payload labeled as a test.

**How the owner confirms it personally:** open the page, click each zone and the
sticker, open the kebab, submit the form with his own address, then load it on his
phone.

## Build Phases

- [ ] Phase 1: Remove the bottom chrome and the motion override
      Done when: screenshots at stops 0, 2, 4, and 6 show nothing fixed at the bottom
      of the window, `prefers-reduced-motion` emulation still produces cuts, and no
      reference to `motion-toggle`, `motion-on`, `motion-off`, or the stored override
      survives a grep of the tree.
      Steps:
      - Delete `.board-chrome` and its two children from `index.html:551-556`.
      - Delete `.scroll-hint` and `.motion-toggle` rules from `css/style.css:384-455`.
      - In `js/board.js`, delete `motionBtn`, `storedMotion`, `storeMotion`, the
        `override` variable, and the button binding. Keep `osReduced()` and the live
        `matchMedia` listener, and let `reduced` read the OS setting alone.
      - Delete the `motion-on` and `motion-off` class rules wherever they are styled.
      - Delete the hint's fade logic in `update()` and anything that only served it.
      - Record the baseline referenced byte count for Phase 9 to compare against.
      Covers: R1; checks: none

- [ ] Phase 2: Copy pass and the Portfolio rename, in both designs
      Done when: a grep for "Work" as a section label returns nothing, no service
      sticky starts a sentence lowercase, and all four `innerText` tripwires are
      re-measured and recorded in `HANDOFF.md`.
      Steps:
      - `index.html:396` and `:527`: nav label "Work" becomes "Portfolio";
        `href="#work"` becomes `href="#portfolio"` and the section id moves with it.
      - `index.html:468`: "More work available on request." becomes "More portfolio
        available on request."
      - `index.html:631`: "more work available on request →" becomes "More portfolio
        available on request →", wrapped as a `mailto:caden@whittworkstudios.com` link
        (the note IS the link, not a link inside it).
      - Capitalize all four service sticky bodies; fix "domains, hosting, and deploys
        set up properly. stays live" to "Domains, hosting, and deploys set up
        properly, so the site stays live and current after launch."
      - `index.html:588`: "When I am not building websites I am traveling" gains its
        missing comma, in both designs.
      - Polaroid caption "Caden — founder" becomes "Caden Whitt, Founder".
      - Re-run `cdp.mjs modes`, record the new tripwires.
      Covers: R11, R12

- [ ] Phase 3: The title strip and the kebab dropdown
      Done when: the title is centered and legible at 1280, 1440, and 1920 wide, the
      kebab opens a dropdown of six entries, each entry drives the camera, Escape
      closes it, and a tab walkthrough never escapes the open menu.
      Steps:
      - Restructure `.deskbar`: centered, enlarged "WhittWorks Studios" in Anton.
        NO kicker here; the tagline arrives in Phase 5 with the sticker, so the same
        sentence is never printed twice on screen.
      - Kebab button at the top right, drawn as three rows of one dot plus one dash.
      - Dropdown as paper chrome: About, Services, Portfolio, Reviews, Contact,
        Whole Board. Six entries, no motion control.
      - Map ALL six stops in `js/board.js`'s `STOP_TARGET` fallback, which is what runs
        when the camera is inactive. It covered only 2/3/4/6, so Reviews and Whole Board
        were silent no-ops in reading mode.
      - Reuse the existing `data-stop` handler for every entry.
      - `aria-haspopup`, `aria-expanded`, Escape, outside click, close on selection.
      Covers: R5, R6, R14; checks: A2, A7

- [ ] Phase 4: Clickable zones
      Done when: five scripted clicks each land the camera on the matching stop's
      transform, the three in-zone links still navigate without moving the camera, and
      every target is reachable and operable by keyboard.
      Steps:
      - Add a delegated click handler on `#board` mapping each paper to its stop, per
        the zone table.
      - Bail out when `e.target.closest("a, button")` matches, so links win.
      - Reuse the deskbar's exact `window.scrollTo` path, including the
        `cameraActive()` false branch that falls back to `scrollIntoView`.
      - Pointer cursor only: `cursor: zoom-in` on the zone, `cursor: pointer` on real
        links inside it. NO hover transform; these papers carry filter and shadow
        stacks, several clip their children, and some are held by tape strips that are
        positioned siblings rather than children, so a hover transform would slide a
        paper out from under its own tape.
      - DELIBERATELY NO `tabindex` and no button role on the papers, reversing this
        plan's earlier line. Two of the ten contain real links (`.work-postcard` holds
        the Level Up caption anchor, `.contact-postcard` the circled email), and a
        button's content is treated as its label and may not contain interactive
        descendants, so a button role on either is invalid ARIA. Ten new tab stops
        whose only effect is re-framing the camera would also sit ahead of the three
        real links a keyboard visitor is there to reach. The kebab dropdown built in
        Phase 3 already reaches all six framings by keyboard, so the FUNCTION is
        keyboard-operable and the click is a redundant pointer shortcut to it. WCAG
        2.1.1 asks for the functionality to be reachable, not for every redundant
        pointer affordance to carry a tab stop.
      - Escape returns to the whole board. Beyond the original plan, added because zone
        clicks otherwise leave the scroll wheel and the menu as the only ways back out.
        It checks the kebab's `aria-expanded` and stands down while the menu is open,
        rather than relying on `stopPropagation` from `js/menu.js`, whose Escape handler
        is registered later and so fires second.
      Covers: R2, R3, R4, R14; checks: A8

- [ ] Phase 5: The circular sticker replaces the center notecard
      Done when: a screenshot at stop 0 shows a circular sticker with a visible white
      ring and black disc where the notecard was, every red string still meets its
      pin, and clicking the sticker returns the camera to stop 0.
      Steps:
      - Replace the `.title-card` section with the sticker: outer white ring, inner
        black disc, inline `W` centered on the disc.
      - Leave pin 0 at (1783, 815) untouched so no string moves.
      - Retune stop 1 to frame the sticker.
      - Confirm the editorial page is unaffected.
      Covers: R7; checks: A2

- [ ] Phase 6: The stapled navy trim
      Done when: a screenshot at stop 0 shows a narrow dark-navy strip with a wavy
      inner edge running all four inner edges of the cork, small staples along it, no
      paper obscured, the strip zooming with the board, and a judge asked "what does
      your eye land on first" naming a paper rather than the trim.
      Steps:
      - Four strips positioned in board coordinates at the cork's inner edge, as
        siblings of the papers, never children of one.
      - Width roughly 60-70 board pixels [A1]. Fill a dark navy near `#1b2739`,
        anchored to the wall's own `#233341` (verified: `css/style.css:478`) but a
        shade deeper, so it reads as navy paper on cork and not as a gap showing the
        wall through the board.
      - The outer edge sits flush against the wooden frame; the inner edge is a gentle
        wave, authored as one SVG path per side, amplitude small enough that the strip
        never varies by more than about a third of its width.
      - Staples as one reusable inline SVG symbol, roughly 22 board pixels wide [A9],
        placed at irregular intervals with a small per-staple rotation.
      - Papers keep a higher stacking order, so the pink portfolio sticky at
        x 3236-3514 reads as lying on the strip rather than under it.
      - Matte, unlit, and low contrast against the cork. This is trim filling the empty
        cork margin, not a feature.
      Covers: R8; checks: A1, A9

- [ ] Phase 7: The form sheet
      Done when: every field validates as specified, all label and input text measures
      15 CSS pixels or larger at 1440x900 in the retuned stop 6, and `privacy.html`
      loads from the form's link.
      Steps:
      - Relocate the two doodle stickies at (301,1129) and (642,1143) to open cork.
      - Place the form sheet in the freed rectangle, clear of both reserved areas.
      - Fields: Name, Email, Phone with the consent notice, Project description,
        How did you find me (optional, user 2026-08-18), honeypot.
      - Budget and timeline are explicitly NOT collected (user declined them 2026-08-18).
        Do not add them.
      - Native constraint validation plus inline messages; focus moves to the first
        invalid field.
      - Retune stop 6 to frame the form and the postcard together.
      - Write and link `privacy.html`.
      - Re-check the Level Up caption still fits its tape after the jitter re-rolls.
      Covers: R9, R16; checks: A3, A4

- [ ] Phase 8: Wire Formspree
      Done when: one labeled test submission arrives in the owner's inbox with every
      field present, and an offline submit shows the error paper with a working
      `mailto:` fallback carrying the typed content.
      Steps:
      - Endpoint as a single constant in a new `js/form.js`.
      - `fetch` POST with `Accept: application/json`; success, error, and pending
        states rendered as paper.
      - Native `action` and `method` set, so the no-JS path still posts.
      - Send one payload labeled "TEST SUBMISSION, ignore".
      Covers: R10; checks: A5, A6

- [ ] Phase 9: Efficiency and review pass
      Done when: the referenced byte count is at or below the Phase 0 measurement, no
      third-party script appears in the network log, an Opus 5 judge per stop reports
      no shippable-quality issue, and the keyboard walkthrough completes without a trap.
      Steps:
      - Measure referenced bytes; compare to the baseline recorded in Phase 1.
      - Audit whether the removed chrome freed any font weight or rule.
      - Independent judges on the six stops and the two fallback legs, given the
        parked testimonial and the placeholder logo as an explicit out-of-scope list.
      - Fix, re-judge, tab walkthrough, console clean at every stop.
      Covers: R13, R14, R15, and confirms R1 through R12

- [ ] Phase 10: Deploy to staging, on the owner's say-so only
      Done when: the owner has approved local screenshots AND explicitly asked for a
      push, the staging URL serves the edits, and he confirms them on his own machine.
      Steps:
      - Present local screenshots and wait.
      - Tag the current `main` so the old staging is recoverable.
      - Rebuild `main` from `board-edits`: delete `CNAME`, insert the noindex meta.
      - Push, verify live through headless Chrome, update `HANDOFF.md`, `PLAN.md`,
        and `PROGRESS.md`.
      Covers: all
