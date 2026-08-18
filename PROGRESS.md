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

- [ ] **Phase 3: The title strip and the kebab dropdown**  <- NEXT
      Centered title with the notecard's tagline as a kicker, kebab top right, six
      dropdown entries: About, Services, Portfolio, Reviews, Contact, Whole Board.
- [ ] **Phase 4: Clickable zones**
      Delegated click handler on `#board`, reusing the deskbar's `window.scrollTo`
      path. Links inside zones must win over the zone click.
- [ ] **Phase 5: The circular sticker replaces the center notecard**
      White ring, black disc, interim `W`. Pin 0 stays at (1783, 815) so no string
      moves. Retune stop 1.
- [ ] **Phase 6: The stapled navy trim**
      Four narrow strips in board coordinates at the cork's inner edge. Dark navy near
      `#1b2739`, roughly 60-70 board pixels wide, wavy on the inner edge only, small
      staples around 22 board pixels. Background trim, not a focal point. Papers stack
      above the strips.
- [ ] **Phase 7: The form sheet**
      Relocate two doodle stickies, place the form in the freed cork above the contact
      postcard, retune stop 6, write `privacy.html`.
- [ ] **Phase 8: Wire Formspree**
      `https://formspree.io/f/xyegnvzd` in a new `js/form.js`. One test submission.
- [ ] **Phase 9: Efficiency and review pass**
      Byte count against the Phase 1 baseline, judges per stop, keyboard walkthrough.
- [ ] **Phase 10: Deploy to staging, on the owner's say-so only**

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
- 2026-08-18: push still blocked. The owner's token authenticates as
  notcadenwhitt-stack but returns 403 on this repo, so it lacks write access. Nothing
  is cached in the keychain, so there is no stale credential to clear.
