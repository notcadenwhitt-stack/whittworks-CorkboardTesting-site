# Plan: Clear the doodle, center Level Up in its pane, push everything except Annie

Approved 2026-08-09 in chat. Replaces the executed events/testimonial/
legibility plan.

**Status: EXECUTED and DEPLOYED.** All five phases are complete; reconciled
against the repo and the live remotes 2026-08-09 (see "Where this actually
landed"). One follow-on fix that was NOT in this plan — the chunk-loading
backstop, two rounds — shipped inside the same arc and is recorded below so
this file matches the tree. The only thing still outstanding is the owner's
confirmation that opening-frame chunks are gone on his hardware. Per the
HANDOFF convention this file gets REPLACED by the next approved plan at the
start of the next work arc; until then it stands as the executed record.

**One-line goal:** the pushed site shows the split board with the postcard
centered between Chad's review and the frame, the green doodle covering
nothing, and bare cork where Annie's placeholder sits — while her worked-out
placement survives locally for one-command restoration.

## Classification
Track: Feature — three geometry adjustments plus a content-gated deploy on a
working site. Parked secondary asks: Annie's real quote/photo fill-in
(deferred by the owner until her materials are verified).

## Interview Ledger
- Q1 approve → "Run it" (owner). Count: 1.

## Goal & Success Criteria
- Green chart doodle overlaps zero papers at every stop and the overview.
- Postcard's horizontal center at x=2920: midpoint of Chad's card right edge
  (1600+700=2300) and the cork's inner right edge (3600 − 30px frame ≈ 3540;
  border verified in css/style.css:444-452).
- Pink sticky, caption strip, and pin travel with the postcard (+120); the
  approved corner tuck is preserved (same relative offsets).
- The pushed branch tip renders no Annie content in any surface: board,
  editorial, reading mode, no-JS.
- Her placement is preserved locally; when the owner next mentions her
  review/picture, the assistant recites the stored coordinates and the owner
  confirms or denies the fill-in. Nothing is restored or pushed before that.
- Staging serves the new build; console clean; tripwires re-baselined.

## State at approval (superseded — kept as the starting point)
- Branch corkboard-realism at ec6b710, 6 commits ahead of origin, clean.
- Annie placeholder: card (1300,1955,−1.2°) + tape (1282,1912), blank
  polaroid (1940,1925,2.2°) + tape (2222,1869), editorial "Quote on its
  way." figure. CSS: .annie-card, .pencil-note, .annie-polaroid rules.
- Postcard (2400,1300), mini sticky (3095,1705), pin 4 (2814,1318), doodle
  (980,1300).
- Deploy convention (HANDOFF.md): push branch, rebuild staging main from it,
  delete CNAME, insert noindex meta above the canonical link.

## Where this actually landed (verified 2026-08-09)
- `corkboard-realism` tip **351e5bb** ("Add the agent handoff"), pushed;
  origin matches. Staging `main` **637c77a** ("Rebuild staging from
  corkboard-realism: seamless cork backstop"), serving.
- Staging fixups confirmed on `main`: **no CNAME** (404 on the path) and
  `<meta name="robots" content="noindex, nofollow">` present above the
  canonical link.
- Tripwires at the tip: **1487 board / 1807 editorial / 1506 reading /
  1791 no-JS**. Versions: style.css **v=59**, board.js v=16.
- Geometry as specified: doodle (620,1120); postcard (2520,1300) centered at
  x=2920; pink sticky (3215,1705); pin 4 (2934,1318).
- Second testimonial: bare cork on the tip. Only a RESERVED-CORK **HTML
  comment** sits at the spot (index.html:570-577).

### Shipped in this arc but not in this plan: the chunk-loading backstop
The owner reported dark tile chunks while scrolling staging, twice. Two
rounds, both deployed:
- **915ee80** — replaced the fixed screen rect (`.viewport::before`, sized to
  the FIRST frame only) with `.board-underlay`, a real 3600x2400 element in
  board space written the identical matrix as `.board` every camera frame.
  Verified transform-equal and rect-zero-delta at five scroll positions.
- **d306be3** — a flat-colour sheet still drew a visible seam against
  rasterized tiles, so the underlay now shares `.board`'s ENTIRE background
  stack via one grouped rule (`.board, .board-underlay`). Verified computed
  background image/position/size/blend/colour byte-identical.
- **Never give `.board-underlay` a `background` shorthand** — it resets the
  shared stack and the seam returns.
- Identified but NOT shipped: a "warming" class from the head script holding
  the `.moving` shadow-stack collapse through initial load, removed by
  board.js after settle. This is the next lever if chunks persist.

## Scope (v1)
The three moves, the Annie trim, the WIP preservation, the push, the staging
rebuild, the live check.

## Out of Scope & Parked Items
- Annie fill-in — parked until the owner raises it (confirm/deny gate).
- Production repo whittworks-site (live whittworkstudios.com) — untouched.
- Known residuals, unchanged: caden.jpg source photo, string stub near
  sticky 1, caption arrow on its own line, ungated cork.webp preload.

## Approach
Geometry first (shared by both variants), then branch `annie-wip` to freeze
the full version locally, then a trim commit on corkboard-realism, then
deploy. The placeholder's CSS stays in the tree (unused, small) so
restoration is a markup paste plus tripwire bump. Executor's choice:
screenshot filenames.

## Requirements
- R1: WHEN any stop renders, the doodle SHALL overlap no paper. New spot
  (620,1120): clear of the sketch doodle (ends x 556), the about card
  (bottom ≈950), the contact postcard (top 1530).
- R2: WHEN the work stop renders, the postcard center SHALL sit at x=2920,
  sticky at (3215,1705), pin 4 at (2934,1318), tuck preserved.
- R3: WHEN the pushed tip is served, innerText SHALL contain no "ANNIE",
  "MEISSNER", or "quote on its way" in any mode.
- R4: WHEN the trim lands, tripwires SHALL be re-measured and re-documented
  in HANDOFF.md and GOALS.md (annie-wip keeps 1593/1899).
- R5: WHEN staging rebuilds, CNAME SHALL be absent and the noindex meta
  present, and the live page SHALL serve the new markup.

## Key Decisions
- Push semantics: the pushed TIP is Annie-free; the pushed HISTORY contains
  this week's WIP commits, and HANDOFF keeps her name/coordinates as parked
  documentation [assumed: owner means the rendered site, not git forensics —
  if wrong: history rewrite + force-push later].
- WIP home: local branch `annie-wip` (never pushed) + assistant memory +
  HANDOFF parked section.
  **Corrected 2026-08-09:** `annie-wip` was created on the Mac and is
  machine-local, so it does NOT exist on other workstations — treat it as a
  convenience, never as the source of truth. The full worked-out markup is in
  PUSHED history at **681d2da** ("Move the doodle..."), which every clone has,
  so restoration never depended on that branch. Assistant memory is likewise
  per-machine and was re-created on the Windows box on 2026-08-09.
- STOPS[5] framing stays as-is; the empty cork below Chad reads as reserved
  space and avoids re-retuning at restore [assumed — if wrong: one-line stop
  tweak].
- Postcard target uses the cork's inner edge (3540), not the board edge
  (3600) [user's words: "edge of the right side of the cork board"].

## Data & State Changes
None — static site, no storage. Git: one local-only branch created.

## Interfaces, Integrations & Credentials
- Push over https to origin (github.com/notcadenwhitt-stack/
  whittworks-CorkboardTesting-site). Credentials come from the macOS
  keychain via git's credential helper; no secrets in chat or files.
  **Machine-dependent:** on the Windows workstation the credential source is
  the `gh` CLI keyring instead. No secrets in chat or files either way.
- GitHub Pages serves staging from main; deploys lag pushes by ~1 minute.

## Edge Cases & Failure Handling
- Push rejected (auth): stop, report; do not paste tokens anywhere.
- Pages slow to deploy: poll the staging URL briefly; report last state
  rather than declaring failure.
- Tripwire mismatch after trim: re-measure, fix docs before pushing.

## Assumptions Ledger
| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Pushed history may contain Annie WIP commits | owner's words target the rendered site | history rewrite later | owner veto |
| A2 | Cork inner edge = 3540 | 30px border, border-box, screenshot concordance | few-px recenter | Phase 2 screenshot |
| A3 | STOPS[5] unchanged reads as reserved space | matches work-pane story | one-line retune | Phase 3 screenshot |
| A4 | Keychain credentials can push | prior pushes from this repo exist | push fails loudly | Phase 4 first step |

**Outcomes (2026-08-09):** A1 HELD — the owner has not objected to WIP commits
in pushed history; no rewrite needed. A2 HELD — 3540 confirmed by screenshot;
no recenter. A3 HELD — STOPS[5] untouched; the empty cork reads as reserved.
A4 HELD — the push succeeded. One assumption the plan did NOT record turned out
to matter: that `annie-wip` and assistant memory would travel with the project.
Neither does; see the corrected WIP-home decision above.

## Open Items
- **Owner confirmation that opening-frame chunks are gone on his hardware.**
  Not blocking anything else; the warming-class lever above is the next move
  if they persist.

## Verification
- Headless captures at 1440x900 (stops 0, 2, 4, 5), 390x844 editorial,
  no-JS spot check; console clean; innerText re-measured.
- grep the pushed tip for ANNIE/MEISSNER/"quote on its way" → zero hits in
  index.html.
  **Restated 2026-08-09 (the original wording was wrong):** a literal grep
  returns THREE hits, all inside the RESERVED-CORK comment at
  index.html:570-577, which names `annie-wip` and the CSS hooks on purpose.
  Comments do not render, so R3 — which is scoped to innerText — holds. The
  correct check is innerText, not grep.
- curl staging for style.css?v= bump and absence of MEISSNER; headless
  screenshot of the live staging URL.

## Build Phases
- [x] Phase 1: Replace PLAN.md with this plan
      Done when: committed on corkboard-realism
      Steps: write file; commit
- [x] Phase 2: Shared geometry
      Done when: doodle at (620,1120); postcard (2520,1300), sticky
      (3215,1705), pin 4 (2934,1318); board.js ?v=16; stops 0/2/4/5 capture
      clean; committed
      Covers: R1, R2; checks: A2
- [x] Phase 3: Freeze and trim
      Done when: branch annie-wip exists at the geometry commit; tip has no
      Annie markup (board pair + tapes, editorial figure); reserved-cork
      comment in place; tripwires re-measured and re-documented; captures
      clean; committed
      Covers: R3, R4; checks: A3
- [x] Phase 4: Push and rebuild staging
      Done when: origin/corkboard-realism == local tip; staging main rebuilt
      with CNAME deleted and noindex inserted; live URL serves the new build
      Covers: R5; checks: A4, A1
      Verified 2026-08-09: origin tip 351e5bb, staging main 637c77a, CNAME
      absent (404), noindex meta present, live-verified through headless
      Chrome (never curl — the shell sandbox cannot reach *.github.io).
- [x] Phase 5: Preserve the reminder
      Done when: assistant memory holds annie-wip coordinates + the
      confirm/deny protocol; final report with screenshots delivered
      Verified 2026-08-09: report delivered on the Mac session. The memory
      leg is PER-MACHINE and was found empty on the Windows workstation, so
      it was re-created there the same day. Anyone picking this up on a new
      machine should assume that memory is absent and re-read the parked
      section in HANDOFF.md instead — that file is the durable copy.

- [ ] Follow-on (outside this plan's phases): owner confirmation on the
      chunk fix. Done when: the owner reports the opening frame is clean on
      his hardware, or the warming class ships and he confirms.
