# Agent handoff: WhittWorks cork-board project

Written 2026-08-09 for the next AI sessions working this project. This file
covers how the work has gone: what we built, what broke, what we tried, and
what actually worked. The site's mechanics, traps, and current tripwire
values live in HANDOFF.md; the current approved plan lives in PLAN.md; read
both before touching anything. Nothing here supersedes them.

## Model routing (owner's standing instruction)

- **Opus 5 manages.** Planning, judgment calls, review passes, and the
  final word on what ships come from an Opus 5 session or subagent.
- **Sonnet 5 codes.** Implementation work goes to Sonnet 5 by default.
- **Escalation rule:** if Sonnet 5 struggles with the same sector of code
  numerous times (repeated failed attempts at the same file or subsystem,
  not one flubbed edit), hand THAT SECTOR to Opus 5 and leave the rest with
  Sonnet 5. Do not silently retry forever and do not escalate everything.

## What this project is

The owner's studio site (WhittWorks Studios) rebuilt as a photographed cork
board: a 3600x2400 board of scanned paper, driven by a camera that scrolls
through eight stops. The tan editorial design is the BASE at all times; the
board is an enhancement for wide screens with working JS. Repo
`notcadenwhitt-stack/whittworks-CorkboardTesting-site`, working branch
`corkboard-realism`. `main` is an unrelated staging-rebuild history: never
merge or rebase into it, only rebuild it from the branch (delete CNAME, add
the noindex meta, push). Staging is GitHub Pages off `main`. The separate
`whittworks-site` repo is LIVE PRODUCTION at whittworkstudios.com and this
project never touches it.

Conventions that bite if skipped: bump `?v=` on every edited linked file;
size paper with `--sz`, never raw percentages; innerText tripwires are
re-measured and re-documented whenever visible text changes; PLAN.md gets
replaced with the next approved plan at the start of each work arc; every
visual change is screenshot-verified at 1440x900 before the owner sees it.

## The work so far, in order

1. **Events sticky, testimonial placeholder, legibility pass.** Added a
   fourth service sticky ("Event Management & Coordination") to the board
   and editorial, built a second-testimonial placeholder (typed name/title
   over empty ruled lines, graphite "quote on its way" note, blank grey
   polaroid film, zero invented quote words), retuned camera stops 3 and 5,
   and stepped up type that had gone small at the wider testimonial zoom.
2. **Board split into panes (owner-directed).** Reviews became a stacked
   column: Chad's row on top (polaroid left, card right), second row below
   (card left, polaroid right). The work pane moved right with the cork
   below it deliberately left empty for future product cards. Pins moved
   WITH their papers (the strings follow pins automatically). The Level Up
   postcard print was darkened three times on request; final grade is
   saturate .78 / contrast .96 / brightness .9 with the ink-density ceiling
   halved to 0.07.
3. **Postcard centered by rule:** its middle sits at the midpoint of Chad's
   card's right edge (2300) and the cork's inner right edge (3540; the
   frame border is 30px). The pink mini-sticky tucks its top-left quadrant
   over the postcard's bottom-right corner. The green chart doodle sits at
   (620, 1120) on open cork, overlapping nothing, per the owner.
4. **The second testimonial is PARKED.** The owner wants bare cork there
   until a verified quote and photo arrive. Full placement is frozen on the
   local-only branch `annie-wip` and documented in HANDOFF.md ("Parked").
   Standing protocol: when the owner mentions that review or picture,
   recite the stored placement and get an explicit yes before restoring or
   pushing anything. Do not fill that cork with anything else.
5. **Deployed.** Branch pushed, staging rebuilt and live-verified several
   times. Current state at writing: tip d306be3, staging 637c77a, style.css
   v=59, board innerText 1487.

## Problems, what we tried, and how it went

**Chunk loading (the big one, two rounds, owner-reported twice).**
Unrasterized compositor tiles draw NOTHING of the board layer, so whatever
sits behind shows through. History: an earlier session put a flat cork
rectangle behind the board's FIRST frame only. Round one (this arc): the
owner saw dark chunks while scrolling staging; diagnosis was that at every
zoomed stop the viewport's edge bands sat over bare wall, exactly where
fresh tiles rasterize mid-gesture at retina density. Fix: `.board-underlay`,
a real element in board space that receives the camera's exact transform
every frame. Effective against the WALL showing, verified transform- and
rect-identical at five scroll positions, locally and live. But the owner
still saw chunks on the opening frame, because a flat-colour sheet draws a
visible SEAM against every tile that has rasterized (flat orange vs
textured cork). Round two: the underlay now shares .board's entire
background stack through one grouped rule (`.board, .board-underlay`), so
a late tile shows the same pixels its neighbours show: the LQIP composite
before cork.webp decodes, real cork after. Verified byte-identical computed
backgrounds, live. Status: shipped; awaiting the owner's confirmation on
his hardware. If chunks persist, the next lever we identified but did NOT
ship: a "warming" class from the head script that holds the `.moving`
shadow-stack collapse through initial load so first rasters are cheap,
removed by board.js after settle. Never give `.board-underlay` a
`background` shorthand; it resets the shared stack.

**hand.js jitter is document-order dependent.** The per-letter jitter seeds
from a GLOBAL counter, so adding any lettered element re-rolls every
letterform after it in the document. That re-roll pushed the Level Up
caption off its tape strip (glyph-box-tight sizing). Fix: real slack in the
strip (484px wide, asymmetric 44/68 padding because the tape scan's torn
right end reaches further into the box than its left). Effective. Expect
letterform drift any time you add hand-lettered content before existing
lettering; give lettered containers slack, never exact glyph-box sizes.

**Tape on filtered/clipped paper.** The index cards clip children
(`overflow: hidden`) and cards and polaroids carry filter stacks that
re-shadow and displace anything inside them, so tape strips holding the
parked testimonial are SIBLINGS positioned in board coordinates, not
children. Reading mode hides bare-sibling tape (`.board > .tape`).
Effective, and the pattern to reuse for any future taped paper.

**Verification tooling (the Browser pane lies when hidden).** The in-app
Browser pane produces black screenshots and times out on input whenever its
panel is hidden; page JS still executes, which makes it look like a site
bug. All screenshot verification runs through headless Chrome over CDP
instead (launch with --headless=new and --remote-debugging-port=0, emulate
1440x900, navigate with a unique ?v=, await fonts, scroll to each stop,
sleep ~3s, capture). The same rig does narrow-viewport, reading-mode
(dispatch a click on .board-peek), and no-JS legs
(Emulation.setScriptExecutionDisabled). Effective and fast; the recipe also
lives in the assistant memory. Two probe gotchas learned the hard way:
headless wheel-event dispatch is UNRELIABLE (scrollY sometimes never moves;
one probe "proved" the camera dead when the camera was fine), so treat
wheel-probe results with suspicion and prefer scrollTo plus samplers; and
the shell sandbox cannot reach *.github.io (instant exit code 000) while
github.com works, so verify staging through headless Chrome or the pane,
never curl.

**Design-review quality.** For the placeholder/legibility arc we ran
adversarial multi-agent review passes (independent judges per camera stop
plus code-level checkers, then re-judge after fixes). They caught real
shippable-quality issues the builder missed: text overrunning paper, a
card slicing caption descenders, dead-flat placeholder film reading as a
failed image load, screen-reader semantics (a blockquote announcing a
status line as a quotation), and a camera retune that went the wrong
direction. Highly effective; the pattern is worth repeating for any
design-level change. Two caveats: judges also flag pre-existing accepted
things (pins, string, the founder headshot's blown-white source photo), so
give them an explicit out-of-scope list; and one judge's pixel claims can
be measurement-frame confused, so confirm coordinates before acting.

**Known accepted residuals (do not re-litigate without the owner):**
caden.jpg's blown-white background reads as a cutout at zoom (it is the
source photograph; only a new photo fixes it); the red string near sticky 1
ends short of its pin; the caption's arrow sits on its own line; reading
mode's typed lines float slightly off the ruled lines; phones fetch the
~304KB cork texture they never paint (an ungated preload; a task chip
exists for gating it behind the 901px media query).

## Open threads

- Owner confirmation that opening-frame chunks are gone on his machine;
  the warming-class lever is next if not.
- The parked second testimonial: wait for the owner to raise it, recite,
  confirm, restore from `annie-wip`, re-baseline tripwires, deploy.
- Future product cards in the work pane's reserved cork, whenever the owner
  brings a product.
- Parked from earlier: mobile/tablet polish; the eventual decide-and-merge
  to production (whittworks-site), which nothing forces.
