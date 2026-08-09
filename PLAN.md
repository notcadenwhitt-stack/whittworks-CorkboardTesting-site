# Plan: Explain the snap, make the scroll affordance impossible to miss, and sweep the codebase

Approved 2026-08-09 in chat. Replaces the executed doodle/postcard/park plan,
per the start-of-arc convention in AGENT-HANDOFF.md.

**One-line goal:** the cork board tells every visitor how to drive it, lets
anyone turn the camera motion on or off regardless of their OS setting, and
ships with every confidently-fixable bug, security gap, and inefficiency
already fixed — plus a report saying what changed and whether it mattered.

## Classification
Track: Refactor & hardening, with a Feature slice (motion toggle, hint)
grafted on. The reported bug dissolved under recon — there is no defect to
fix, so the bug-fix track's reproduce-first invariant is satisfied by the
diagnosis below rather than by a failing test. Parked secondary asks: none.

## Interview Ledger
- Q1 reduced-motion behavior -> honor OS + add in-page toggle (accepted).
- Q2 audit authority -> fix everything confident in, including defended
  code, justify each (owner chose the aggressive branch).
- Q3 deploy authority -> deploy (accepted).

Count: 3.

## Current State
- Branch corkboard-realism, tip fee300c, tree clean, synced with origin
  (verified: git status, git log).
- **The reported symptom is the reduced-motion path, not a defect.** Windows
  client-area animations are off (verified: SystemParametersInfo /
  SPI_GETCLIENTAREAANIMATION -> False); Chrome on this machine returns
  matchMedia("(prefers-reduced-motion: reduce)").matches === true (verified:
  CDP probe, RM_REDUCE=true RM_NOPREF=false); js/board.js:298-305 answers
  that by snapping to STOPS[Math.round(p)] with no lerp and no scale ramp
  (verified: read js/board.js).
- `.scroll-hint`: font-size 0.65rem (~10px), aria-hidden="true",
  pointer-events none, fades to opacity 0 once scrollY > innerHeight * 0.4
  (verified: css/style.css:347-364, index.html:481, js/board.js:330).
- Asset versions internally consistent — board.js?v=17 in both the preload
  and the script tag (verified: index.html:273,711). HANDOFF.md still says
  v=16; doc drift only.
- No CSP of any kind (verified: no http-equiv in index.html). No third-party
  hosts; two external links, both rel="noopener". No innerHTML, eval,
  document.write, or insertAdjacentHTML anywhere (verified: grep).
- assets/cork.webp preload carries no media attribute, so narrow viewports
  fetch ~304KB they never paint (verified: index.html:223).
- No tests, no CI, no .github/ (verified: find, ls).
- Runtimes available: node v24.18.0 (built-in WebSocket), python 3.13.15
  (verified: --version).

## Scope (v1)
The motion toggle, the scroll-hint rework, a full audit sweep across js/,
css/, index.html, 404.html, robots.txt with every confident fix applied,
tripwire re-baselining, doc updates, full verification battery, deploy, and
the report.

## Out of Scope & Parked Items
- Production repo whittworks-site / whittworkstudios.com — untouched.
- The parked second testimonial — stays bare cork; the recite-then-confirm
  protocol is unchanged and this work does not touch that reserved comment.
- Accepted residuals reported but not unilaterally changed: caden.jpg's
  blown-white background (needs a new photograph, not code), the short red
  string near sticky 1, the caption arrow on its own line, reading mode's
  typed lines sitting slightly off the ruled lines.
- Mobile/tablet polish — still parked.
- The decide-and-merge to production — nothing forces it.

## Approach
Three passes, in this order, because each de-risks the next.

**Pass 1 — affordance.** The hint and the toggle are the same problem wearing
two hats: a visitor who doesn't know scrolling drives the camera, and a
visitor whose OS silently removed the motion that would have taught them.
Build a small fixed bottom-center cluster: the enlarged hint, and beside it a
real <button> motion toggle. One piece of chrome, one place to look.

**Pass 2 — audit sweep.** File by file, with a standing rule: where a comment
or HANDOFF.md entry defends a decision, override it only with evidence at
least as strong as the evidence behind it, measured on this machine, quoting
both in the report. Where there is no defense, fix on judgment.

**Pass 3 — prove it.** Every change verified across six render modes before
anything ships.

Executor's choice: internal naming, screenshot filenames, CSS property order.

## Requirements
- R1: WHEN a visitor's OS requests reduced motion AND they have expressed no
  in-page preference, THE SYSTEM SHALL keep the snap-to-nearest-stop camera
  unchanged. Check: CDP Emulation.setEmulatedMedia forcing reduce; confirm no
  interpolated frame between stops.
- R2: WHEN any visitor activates the motion control, THE SYSTEM SHALL switch
  camera mode immediately without a reload, in both directions, and persist
  that choice for the session. Check: toggle under both emulated states;
  reload and confirm persistence.
- R3: WHEN the motion control has been used, THE SYSTEM SHALL stop following
  later OS-level changes for the session; WHEN it has not, it SHALL continue
  to follow them live. Check: flip emulated media before and after use.
- R4: The motion control SHALL be a focusable native <button>, keyboard
  reachable, with aria-pressed reflecting state and an accessible name.
- R5: WHEN the board is live, the scroll hint SHALL render at >= 1rem
  computed font-size with contrast >= 4.5:1. Check: getComputedStyle plus a
  measured contrast ratio.
- R6: WHEN the camera has not yet passed stop 1, the hint SHALL remain fully
  opaque. Check: sample opacity at scroll fractions 0, 0.05, 0.1, 0.14.
- R7: The hint's instruction SHALL be available to assistive technology
  rather than aria-hidden. Check: CDP accessibility tree contains its text.
- R8: Every change to code carrying a defending comment or a HANDOFF.md entry
  SHALL appear in the report with the original rationale quoted and the
  superseding evidence beside it. Check: report review.
- R9: WHEN visible text changes, innerText tripwires SHALL be re-measured
  across all four modes and re-documented in HANDOFF.md and GOALS.md.
- R10: All six render modes SHALL render correctly: board (wide), editorial
  (narrow), reading mode, no-JS wide, no-JS narrow, stylesheet-404 floor.
- R11: Console SHALL be free of errors and warnings at all eight stops in
  both motion modes.

## Key Decisions
- Reduced motion stays the default for reduced-motion users: honor the OS;
  the toggle is an override, not a replacement — (user, Q1).
- Toggle scope is the session, via sessionStorage: matches the precedent in
  js/peek.js:23-30, including its try/catch for Safari private mode which
  throws on access — (verified: js/peek.js).
- The toggle lives in board.js, not a new file: it manipulates the camera's
  own `reduced` variable and its live matchMedia listener. This differs from
  peek.js's separation, which exists because that toggle must survive
  board.js failing to parse — a motion toggle has nothing to do if the camera
  is dead — (verified: js/peek.js:1-9, js/board.js:368-385).
- Hint fade retimed to the camera, not to pixels: fade when the camera passes
  stop 1, which proves the visitor found scrolling, instead of at a fixed 40%
  of one viewport — (verified: current behavior at js/board.js:330).
- Audit posture: fix on confidence, including defended code, with evidence
  parity required and every such change justified in the report — (user, Q2).
- Report format: a dated markdown file committed to the repo, plus the full
  text delivered in chat with the TL;DR first — [assumed: default
  REPORT-2026-08-09.md at repo root — if wrong: rename or drop the file].
- This plan replaces PLAN.md per the start-of-arc convention — (verified:
  AGENT-HANDOFF.md:34).

## Data & State Changes
None persisted server-side — static site, no storage, no database.
Client-side: one new sessionStorage key for the motion preference, alongside
the existing ww-board-open. Rollback is removing the key; nothing survives
the tab closing.

## Interfaces, Integrations & Credentials
No APIs exposed or consumed. No third-party hosts (verified: grep — the only
external references are two levelup-men.com links and the SVG namespace URI).
No credentials involved; the only privileged operation is git push to origin
over HTTPS, authenticated by the gh CLI keyring already present on this
machine (verified: gh auth status). No secret values appear in this plan, the
repo, or chat.

**Frozen contracts:** STOPS[0]'s four numbers are mirrored by the
--first-frame math in the inline head script; retuning one without the other
causes a visible snap on load (verified: index.html:56-62, js/board.js:89-94).
Not planned to change — flagged so the executor does not.

## Edge Cases & Failure Handling
- sessionStorage throws (Safari private mode) -> toggle still works for the
  session, preference simply is not remembered. Wrapped in try/catch exactly
  as peek.js does.
- Reading mode / narrow viewport -> the camera stands down, so both the hint
  and the toggle hide with the rest of the board chrome.
- css/style.css 404s -> board.js returns at its --camera sentinel before any
  of this runs; the new code sits below that guard (verified: board.js:24-25).
- matchMedia absent -> motionQuery is already null-guarded; the toggle
  defaults to motion-on and still works.
- Board scrolled past stop 1, then back to the top -> the hint returns.
- A defended decision where measurement is ambiguous -> leave it alone,
  report as "examined, left as-is", never a coin-flip change.

## Risks, Landmines & Adaptations
- Fixing "everything confident in" inside a codebase of hard-won decisions ->
  the evidence-parity rule (R8), plus every such change isolated in its own
  commit so any one can be reverted without unpicking the rest.
- The .moving / MOVE_SETTLE trap — prior measurements were taken on an M3
  Mac, and HANDOFF.md records that a saturated host once reversed the
  conclusion twice -> if touched at all, measure on an idle machine and
  report both number sets. Default expectation: leave them.
- Adding a lettered element re-rolls every subsequent letterform (hand.js
  seeds per-letter jitter from a global counter) -> the new toggle uses the
  mono UI face, not the hand-lettered one, and sits outside .board in
  document order. Verified by screenshot diff of the Level Up caption.
- Visible text changes break the innerText tripwires -> R9 makes
  re-baselining part of the work, not a follow-up.
- Staging rebuild is outward-facing -> Phase 11 records the current staging
  SHA before touching anything so a bad deploy is one rebuild from reverted.
- Chunk-loading regression — .board-underlay must never receive a background
  shorthand -> the CSS pass treats that grouped rule as read-only and the
  battery re-checks computed-background parity.
- Residual: this machine is not the owner's only hardware, and the original
  chunk report came from his -> the report states which findings are
  machine-independent and which need his eyes.

## Assumptions Ledger
| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | The Windows animation setting is the whole cause, no second defect behind it | three independent verifications agree; the code path matches the symptom exactly | a real bug stays unfixed | Phase 1 forces motion on via CDP and confirms interpolation returns |
| A2 | Emulation.setEmulatedMedia faithfully drives board.js's live matchMedia listener | the listener reads the query live rather than latching at load (verified: board.js:368-378) | reduced-mode tests prove nothing | Phase 1 asserts the emulation flips matches |
| A3 | ~1rem at 4.5:1 contrast is enough to stop the misread | 1.5x the current size, which is below every other text on the page | still missed; needs animation or more size | owner's eyes on the Phase 2 screenshot |
| A4 | Fading at stop 1 is the right moment | passing a stop is the earliest proof the visitor found scrolling | hint lingers or vanishes too early | one-line constant change |
| A5 | A report file at repo root is wanted, not just the chat copy | every other artifact here is a committed markdown doc | an unwanted file | delete it; costs nothing |
| A6 | The audit needs no change to STOPS or the head-script mirror | nothing in recon points there | a frozen contract moves and the load snaps | Phase 6 diffs both |

## Open Items (none blocking)
- Whether the report also becomes a published shareable page — proceed with
  the committed file plus the chat copy unless told otherwise.
- Whether HANDOFF.md's stale "board.js v=16" line is worth a standalone fix —
  proceed with correcting it inside the Phase 9 doc pass.

## Verification
Every check runs through headless Chrome over CDP, never the in-app Browser
pane and never curl against *.github.io — both are documented to lie here.

```bash
python -m http.server 8941 --directory <this directory>
```
Jump the camera to stop n of 0..7:
```js
window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * n/7)
```

- Motion battery: 1440x900, both emulated media states, all eight stops.
  Assert interpolated transforms exist between stops in normal mode and do
  not in reduced mode.
- Toggle battery: activate in each direction, confirm mode change with no
  reload, confirm persistence across reload, confirm keyboard reachability
  and aria-pressed.
- Hint battery: computed font-size, measured contrast ratio, opacity sampled
  at scroll fractions 0 / 0.05 / 0.1 / 0.14, presence in the a11y tree.
- Six-mode battery: board wide, editorial at 390x844, reading mode (dispatch
  a click on .board-peek), no-JS wide and narrow
  (Emulation.setScriptExecutionDisabled), and the stylesheet-404 floor.
- Regression guards: computed background parity between .board and
  .board-underlay; screenshot diff of the Level Up caption against its tape
  strip; STOPS[0] versus the head-script --first-frame constants.
- Tripwires: document.body.innerText.length re-measured in all four modes.
- Console: zero errors and warnings at all eight stops, both modes.
- How the owner personally confirms it: open staging on the Windows machine
  with animations still off. A large legible hint should say to scroll, and a
  control should turn the smooth camera on despite the OS setting. Then flip
  Windows animations back on and confirm smooth is the default again.

## Build Phases
- [ ] Phase 1: Replace PLAN.md and stand up the measurement harness
      Done when: this plan is committed as PLAN.md; a CDP script drives the
      local server, forces both prefers-reduced-motion states, and prints the
      board transform at all eight stops — showing interpolation under
      no-preference and hard snaps under reduce
      Steps: write and commit the plan; write the harness; capture the
      baseline in both modes; record baseline tripwires and staging SHA
      Covers: R1; checks: A1, A2
- [ ] Phase 2: Enlarge and retime the scroll hint
      Done when: computed font-size >= 1rem, contrast >= 4.5:1, opacity still
      1 at scroll fraction 0.14, hint text present in the accessibility tree,
      and a 1440x900 screenshot shows it unmistakable
      Steps: restyle .scroll-hint; replace the 40%-viewport fade with a
      stop-1 trigger in board.js; drop aria-hidden; bump ?v=; capture
      Covers: R5, R6, R7; checks: A3, A4
- [ ] Phase 3: Build the motion toggle
      Done when: a keyboard-focusable <button> with correct aria-pressed
      flips the camera between smooth and snap in both directions with no
      reload, persists across a reload, and stops following OS changes only
      after use
      Steps: add the control beside the hint; wire it to `reduced` and the
      existing onMotionChange listener; sessionStorage with try/catch; hide
      it wherever the camera stands down; bump ?v=
      Covers: R2, R3, R4
- [ ] Phase 4: Audit js/ — board.js, peek.js, hand.js
      Done when: every file read line by line, every finding classified fix /
      report-only / examined-and-left, all confident fixes applied, each
      defended-code change carrying its evidence-parity note
      Covers: R8
- [ ] Phase 5: Audit css/ — style.css, editorial.css, reading.css
      Done when: all 2,360 CSS lines reviewed; dead rules, redundant
      selectors and layout hazards resolved or reported; .board-underlay's
      grouped background rule confirmed untouched
      Covers: R8, R10
- [ ] Phase 6: Audit index.html, 404.html, robots.txt — semantics, a11y, SEO
      Done when: heading order, landmarks, alt text, focus order and metadata
      reviewed and fixed where confident; STOPS[0] confirmed still identical
      to the head-script mirror
      Covers: R8; checks: A6
- [ ] Phase 7: Security pass
      Done when: a documented conclusion on every applicable surface for a
      static site — injection sinks, external links, mixed content, a CSP
      recommendation with a concrete meta-tag policy, and confirmation no
      secrets exist in the tree or history
      Covers: R8
- [ ] Phase 8: Performance and payload pass
      Done when: the ungated cork.webp preload is gated behind the 901px
      query and verified to stop downloading at 390px; remaining payload and
      render-blocking costs measured and reported
      Covers: R8, R10
- [ ] Phase 9: Re-baseline tripwires and update the docs
      Done when: innerText measured in all four modes and written into
      HANDOFF.md and GOALS.md; the stale board.js v=16 line corrected;
      HANDOFF.md gains a section for this arc
      Covers: R9
- [ ] Phase 10: Full verification battery
      Done when: all six render modes pass, console clean at all eight stops
      in both motion modes, and every regression guard holds
      Covers: R10, R11
- [ ] Phase 11: Deploy
      Done when: origin/corkboard-realism matches local; staging main rebuilt
      from the branch with CNAME deleted and the noindex meta present; the
      live staging URL serves the new build, verified through headless Chrome
      Steps: record the current staging SHA for rollback; push; rebuild main
      from the branch — never merge or rebase into it; apply both per-rebuild
      fixups; poll and verify live
      Covers: R10
- [ ] Phase 12: Write the report
      Done when: REPORT-2026-08-09.md is committed and delivered in chat,
      opening with a TL;DR that lists every change flatly, each with a
      one-line "does this matter, and why" where it is not self-evident, and
      a clearly separated section for findings deliberately not acted on
      Covers: R8
