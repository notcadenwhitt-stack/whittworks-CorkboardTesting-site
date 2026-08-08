# Plan: events service sticky, Annie testimonial placeholder, legibility pass

Approved 2026-08-08. Replaces the executed first-paint framing plan.

**One-line goal:** the board gains a fourth service (event management) and a
second, clearly-placeholder testimonial slot, and every piece of reading text
on the site is comfortably legible at its resting zoom.

## Classification
Track: Feature — additive content on an existing, working site. Parked:
real Annie quote/photo (pending her team's confirmation).

## Interview Ledger
- Q1 Annie materials → placeholders until her team confirms (user)
- Q2 plan approved (user)

## Goal & Success Criteria
- A fourth blue sticky, "Event Management & Coordination," sits in the
  services cluster, fully framed at the services stop, in both the board and
  the narrow-screen editorial design.
- A second testimonial (index card + polaroid) for Annie Meissner exists as
  an unmistakable placeholder: name and title shown, ZERO fabricated quote
  words, neutral inline-data-URI polaroid image; framed at the testimonial
  stop beside Chad's.
- Every reading passage is clearly legible in a 1440x900 screenshot at its
  stop's resting zoom; no body ink lighter than #444 on white/cream paper.
- All load fixes hold: first-frame framing, cork underlay, fail-open paths,
  clean console.

## Current State (verified this session)
- Blue stickies: index.html:507-517 (board), :393-401 (editorial). Chad quote
  card :541 (1320,1736), polaroid :546 (1990,1845).
- STOPS has 8 entries; stop 3 services (2788,722,1000x950), stop 5
  testimonial (1870,1990,1290x820). Only STOPS[0] is mirrored by the inline
  head script — other stops retune freely.
- Cache-busting at style.css?v=52, board.js?v=10. innerText tripwires: 1387
  board / 1707 scripted editorial (re-baseline after this work).
- HANDOFF traps: size papers with --sz custom property, never raw
  percentages; bump ?v= on every edited linked file.

## Scope (v1)
The three changes, both designs, plus retuned camera framing where they land.

## Out of Scope & Parked Items
- Real Annie quote and photo — pending; swap is a drop-in (replace polaroid
  img src, insert quote text into the ruled lines, remove the pencil note).
- Mobile/tablet polish — still deferred.
- Stop count, scroll mapping, pins/string, load-fix machinery: untouched.

## Approach
Sticky: clone the blue-sticky markup/CSS pattern for "Event Management &
Coordination"; body copy (veto-able): "planning, logistics, and the tools
that make an event run itself." Nudge cluster positions so four fit; widen
STOPS[3] until all four rest in frame with margin. Executor's choice:
placement, rotation.
Annie placeholder: clone quote-card + polaroid beside Chad's. Card:
"Annie Meissner — Director of Events & Finance, Alabama Republican Party"
over empty ruled lines, small pencil note "quote on its way". Polaroid:
neutral-grey inline data URI (nothing new to 404), caption Annie Meissner.
Widen STOPS[5] to frame both. Editorial: matching service list item and an
equally-placeholder second blockquote.
Legibility: darken grey-ish reading inks toward near-black (typewriter) or
deep ink (hand); bump sizes within writable insets; tighten stop spans where
text still reads small. Judge per stop by screenshot at 1440x900.

## Requirements
- R1: WHEN the camera rests at stop 3, all four service stickies SHALL be
  fully in frame with margin, titles legible.
- R2: WHEN the camera rests at stop 5, both testimonials SHALL be in frame;
  Annie's SHALL contain zero invented quote words.
- R3: WHEN any stop renders at 1440x900, reading-path text SHALL meet the
  ink floor (#444 minimum on white/cream) and read comfortably.
- R4: WHEN the site loads narrow or without JS, the editorial SHALL show the
  new service and the placeholder testimonial.
- R5: WHEN any linked file changes, its ?v= SHALL bump; recorded innerText
  tripwires SHALL be re-baselined wherever documented.
- R6: WHEN the load-fix battery reruns (no-JS, 390x844, reading mode,
  console), results SHALL match the 2026-08-08 baseline.

## Key Decisions
- Annie's title corrected to "Director of Events & Finance" [assumed:
  spelling fix intended — if wrong: one-line edit].
- Widen stops 3 and 5, do not add a stop (user's scroll mapping and peek
  audit stay frozen) [A2].
- Deploy after screenshot approval: push corkboard-realism, rebuild staging
  main with HANDOFF fixups (delete CNAME, insert noindex meta) [A3].

## Edge Cases & Failure Handling
- Placeholder polaroid is inline data URI → cannot 404.
- Reading mode reflows both testimonials; verify the empty-ruled card does
  not collapse oddly there.
- Legibility edits to shared CSS → recapture every stop the selector reaches.

## Assumptions Ledger
| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Sticky body copy draft acceptable | user veto at approval | one-line rewrite | Phase 5 |
| A2 | Widen stops, don't add one | keeps scroll/peek machinery frozen | rework framing | Phase 1 |
| A3 | Staging deploy OK with placeholder name/title | noindex + unlisted | pull the rebuild | Phase 5 |
| A4 | Ink floor #444 = "not grey on white" | user granted latitude | tune per screenshot | Phase 3 |

## Verification
- Screenshots of stops 0, 3, 5, and every legibility-touched stop at
  1440x900, delivered to the user.
- Console clean; innerText re-baselined and recorded; no-JS and 390x844
  spot-checks.
- Live staging check after deploy (curl for new markup, then browser check).

## Build Phases
- [ ] Phase 1: Fourth sticky + stop 3 retune (both designs)
      Done when: stop-3 screenshot shows four framed stickies; editorial
      lists four services
      Steps: clone sticky markup; place/rotate; widen STOPS[3]; add
      editorial list item; screenshot
      Covers: R1, R4; checks: A2
- [ ] Phase 2: Annie placeholder pair + stop 5 retune (both designs)
      Done when: stop-5 screenshot shows both testimonials, Annie's visibly
      placeholder with zero invented words
      Steps: clone card+polaroid; data-URI photo; empty ruled lines + pencil
      note; widen STOPS[5]; editorial blockquote; screenshot
      Covers: R2, R4
- [ ] Phase 3: Legibility sweep
      Done when: every stop's screenshot passes the ink floor and reads
      comfortably at rest
      Steps: darken inks; size up within insets; tighten spans where needed;
      recapture affected stops
      Covers: R3; checks: A4
- [ ] Phase 4: Conventions + battery
      Done when: ?v= bumped on touched files; tripwires re-baselined in this
      file and HANDOFF.md; battery matches baseline
      Covers: R5, R6
- [ ] Phase 5: User approval, then deploy
      Done when: user approves the screenshot set; staging serves the new
      content
      Steps: deliver set; on approval push corkboard-realism; rebuild
      staging main per HANDOFF fixups; live check
      Checks: A1, A3
