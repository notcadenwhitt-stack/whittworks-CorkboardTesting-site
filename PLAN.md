# Plan: WhittWorks cork board realism pass, verification and polish

Approved 2026-08-03. Executes the remaining work in HANDOFF.md.

**One-line goal:** every camera stop on the cork board reads as photographed
paper at final zoom, proven by a screenshot set the user can approve, with zero
pushes until they do.

Note: the dev server now runs on an auto-assigned port via the `whittworks`
launch entry (currently 8941; another chat's server holds 8940). Always load
pages with a unique `?v=` query string; the server sends no cache headers.

## Interview Ledger
- Q1 mobile scope: deferred until desktop approval (user)
- Q2 pins/string: leave untouched, no asset searches anywhere; critique focuses
  on sticky notes, polaroids, index cards, cork surface, postcards, in that
  priority order (user)
- Q3 plan approved (user)

## Goal & Success Criteria
- All 8 camera stops screenshot-verified at 1440x900 with no text overflowing
  its paper's writable inset
- Each stop's target element fully in frame with visible margin at rest
- Contact postcard back legible at zoom: message left, circled email on the
  address lines, stamp in the corner
- The five priority elements survive an adversarial "what reads as fake?"
  critique, residual flaws documented rather than hidden
- Console clean at every stop
- Visible copy word-for-word identical before and after (user constraint)
- Final screenshot set of all 8 stops delivered for approval; nothing pushed

## Scope (v1)
HANDOFF.md "What is left" minus mobile: zoomed verification of all 8 stops,
contact postcard layout at zoom, camera stop framing retune, realism critique on
the five priority elements, resulting fixes, final screenshot set.

## Out of Scope & Parked Items
- Mobile: deferred until desktop approval (user)
- Pins and red string: user is happy with both; untouched (user)
- Any new asset hunt or download: forbidden (user)
- Push to GitHub: forbidden until user approves the design (user)
- Dropping stash@{0}: forbidden until the branch is confirmed good (HANDOFF.md)
- Copy edits of any kind: presentation only (user)

## Approach
Multi-agent pass directed by the session model (manager, director, final
checker only; no file edits by the director). Opus agents take judgment-heavy
work: realism critique, nontrivial CSS/layout fixes on paper elements. Sonnet
agents take mechanical work: server checks, per-stop capture, text-fit
inspection, STOPS retuning in js/board.js. Cheapest capable model per task.

Single Browser pane: browser-driving stages run serialized, one agent at a
time. Jump to stop n (0..7) with:
`window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * n/7)`

Executor's choice: agent count per phase, fix batching, screenshot filenames.

## Requirements
- R1: WHEN any of the 8 stops renders at 1440x900, all hand-lettered and typed
  text SHALL fit inside its paper's writable inset with no overflow or clipping.
- R2: WHEN the camera rests at a stop, the target element SHALL be fully in
  frame with visible margin (retune STOPS spans in js/board.js where not).
- R3: WHEN the camera rests at the contact stop, the postcard back SHALL show
  the message on the left, the circled email on the address lines, and the
  stamp in the corner, all legible.
- R4: WHEN any stop is visited, the console SHALL show zero errors or warnings.
- R5: WHEN all fixes land, visible text content SHALL be byte-identical to the
  pre-pass extraction.
- R6: WHEN the critique completes, each of the five priority elements SHALL
  either pass "reads as photographed" or carry a documented, accepted residual.
- R7: WHEN the pass completes, no push has occurred and all work sits on
  corkboard-realism.

## Key Decisions
- Judging viewport: 1440x900 [assumed: matches the only prior careful check]
- Cache busting: bump ?v= on the stylesheet link on every CSS edit; unique
  query strings on every page load (HANDOFF.md trap 2)
- New paper sizing: --sz custom property, never raw percentages on absolutely
  positioned elements (HANDOFF.md trap 1)
- Fixes commit incrementally on corkboard-realism [assumed: matches branch
  pattern]

## Edge Cases & Failure Handling
- Stale serving despite query strings: restart via the whittworks launch entry
- A fix breaks text fit on another stop (shared CSS): recapture every stop the
  touched selector affects
- hand.js glyph collides with a paper edge: adjust the writable inset
  (--wx/--wy/--ww/--wh or --sz), never the text
- Unexpected dirty files (possible second session): stop and report, do not
  commit over them
- Opus fix stalls after two attempts: document as residual, move on

## Assumptions Ledger
| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | 1440x900 judging viewport | prior check used it (HANDOFF.md) | recapture, minutes | user veto at approval |
| A2 | Session-owned server on auto port is usable | started fresh this session | restart, trivial | Phase 1 |
| A3 | Efficiency = cheapest capable model, not thinner coverage | user + ultracode | rebalance tiers | user veto |
| A4 | Director reviews only, never edits files | user's role assignment | none | standing |
| A5 | Incremental commits on the branch | existing commit pattern | git reset, cheap | user veto |

## Verification
- Per stop n in 0..7: load with unique ?v=, jump, screenshot, read console
- Copy freeze: document.body.innerText extracted before fixes and after, diff
  must be empty
- git status clean, stash@{0} intact, git log shows no push
- Human check: user reviews the 8-stop set and approves or lists changes

## Build Phases
- [ ] Phase 1: Preflight (Sonnet)
      Done when: server serves current files, console clean at overview,
      baseline text extraction saved, tree state recorded
      Steps: load with unique query string; screenshot stop 0; read console;
      save innerText extraction and git status to scratchpad
      Covers: R4, R5 baseline; checks: A2
- [ ] Phase 2: Capture and inspect all 8 stops (Sonnet, serialized)
      Done when: 8 screenshots at 1440x900 with a per-stop defect log
      Steps: per stop: jump, screenshot, read console, log defects against
      R1/R2/R3/R4; flag STOPS entries needing retune
      Covers: R1, R2, R3, R4; checks: A1
- [ ] Phase 3: Realism critique (Opus, serialized browser access)
      Done when: ranked "reads as fake" report covering, in priority order,
      sticky notes, polaroids, index cards, cork surface, postcards; pins and
      string explicitly excluded
      Steps: revisit each stop at rest zoom; judge adversarially; rank by
      severity; propose a concrete CSS-only fix per finding
      Covers: R6
- [ ] Phase 4: Fixes (Opus for paper CSS, Sonnet for STOPS and mechanical)
      Done when: every defect and finding fixed or documented as accepted
      residual; touched stops recaptured clean; ?v= bumped; committed
      Steps: batch by file; --sz rule for sizing; recapture affected stops per
      batch; retune flagged STOPS spans; commit with precise file lists
      Covers: R1, R2, R3, R6; checks: A5
- [ ] Phase 5: Director's final check (Fable, no edits)
      Done when: copy diff empty, git verified (no push, stash intact), final
      8-stop set plus one zoom-out captured, summary delivered for approval
      Steps: re-extract innerText and diff; run git checks; assemble final set;
      report residuals honestly; request approval
      Covers: R5, R7; checks: A4
