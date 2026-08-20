/* Cork board camera: scroll drives zoom stops across the board. */
(function () {
  "use strict";

  /* ==================================================================
     DO NOT DRIVE A CAMERA THAT HAS NO STAGE
     ==================================================================
     If css/style.css never arrives — a bad deploy, a 404, a style-src that
     rejects it — this script used to keep running, and that was strictly
     worse than not running at all. The board becomes a plain <main> with no
     .viewport clipping it and no absolute positioning, and the camera then
     translates that ordinary document by thousands of pixels: measured across
     the eight stops, 0/3/2/0/0/1/1/0 of 16 elements were on screen, and the
     About card's top ran 4617 -> -2300 -> -9186 -> -6931, so content left the
     top of the window and never came back at any scroll position. With the
     same 404 and scripting OFF, the visitor gets a plain, complete, readable,
     scrollable document.

     So: read a custom property that exists only in the stylesheet, and if it
     is not there, do nothing at all. The failure mode collapses to the no-JS
     one, which is the better of the two. Cheap enough to sit above every
     other line here — one getComputedStyle at startup.
     ================================================================== */
  if (!getComputedStyle(document.documentElement)
        .getPropertyValue("--camera").trim()) return;

  /* ==================================================================
     PROOF OF LIFE
     ==================================================================
     The `js` class on <html> says a script ran. It does not say THIS script
     ran, and the cork board is unusable without this one specifically: nothing
     else ever writes #board's transform. If board.js 404s after a bad deploy,
     or a strict CSP rejects it, `js` is still set by the inline head script and
     by js/peek.js, and the board would be shown with no camera pointed at it —
     the exact top-left-corner failure the sentinel above exists to prevent,
     arriving by a different door.

     So the stylesheet requires board-live, and only this line sets it, and only
     after the guard above has passed. No camera, no board, and the editorial
     design stays on screen instead. js/peek.js re-checks on a timer for the
     case where this file loads but throws part-way through.
     ================================================================== */
  document.documentElement.classList.add("board-live");

  /* Announce when cork.webp has actually DECODED, not merely arrived. Until
     then the board paints from two inlined placeholder layers; after it, those
     two are covered by an opaque layer and are pure composite cost on every
     rasterisation. css/style.css drops them under html.cork-ready. decode()
     rather than onload because onload fires before the bitmap is ready, and a
     catch because a failed decode must leave the placeholders in place. */
  (function () {
    var cork = new Image();
    cork.src = "assets/cork.webp";
    var ready = function () { document.documentElement.classList.add("cork-ready"); };
    if (cork.decode) cork.decode().then(ready).catch(function () {});
    else cork.onload = ready;
  })();

  var board = document.getElementById("board");
  /* The solid sheet behind the board. It takes every transform the board
     takes, so an unrasterised board tile shows cork colour at ANY zoom rather
     than the wall. There was briefly a second, cork-TEXTURED sheet here too;
     it was deleted once photographs showed it failing in the same frames as
     the board, because anything carrying an image has to be rasterised and can
     therefore miss. See the .board-floor rule in css/style.css. */
  var floor = document.querySelector(".board-floor");
  var stringsSvg = document.getElementById("strings");

  /* ==================================================================
     PREFERS-REDUCED-MOTION
     ==================================================================
     The CSS media query at the end of style.css only ever killed
     transitions, and this page has almost none left worth killing. The motion
     that actually matters is right here: a 3600x2400 layer translated and
     scaled continuously under the scroll, 41 megapixels of it sweeping and
     zooming across the whole viewport. Large-area zoom and parallax are a
     documented vestibular trigger — dizziness, nausea, migraine — and WCAG
     2.1 (2.3.3 Animation from Interactions) asks for a way to turn off
     motion that is not essential to the content. It is not essential here:
     the board is a layout, and every word on it is in the DOM either way.

     WHAT REDUCED MODE DOES: the camera snaps to the NEAREST stop instead of
     interpolating towards it. Same eight STOPS, same framing, same clamp,
     same nav links — scrolling still walks the whole board, but the picture
     cuts from one composed view to the next the way slides do, and there is
     no continuous scale ramp anywhere. Nothing is laid out differently, so
     nothing can end up blank, clipped, or off the cork that would not
     already be so in normal mode, at any viewport.

     WHY SNAPPING AND NOT A STATIC FULL-BOARD PAGE: a static board would have
     to reflow eight framings into one readable column, which means a second
     layout to keep correct and a second set of ways for the board to break.
     Snapping reuses the framing that is already known to work at every
     viewport and removes exactly the thing that causes the harm.

     The query is live. Flipping the OS setting re-reads it and repaints
     without a reload; nothing here is decided once at load. When it does NOT
     match, every line below runs exactly as it did before this block existed.
     ================================================================== */
  var motionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  /* ==================================================================
     THE OS SETTING IS THE ONLY AUTHORITY
     ==================================================================
     prefers-reduced-motion decides this outright; there is no way for a
     visitor to disagree with it from inside the page. Snap mode above is a
     considered composition, but on screen a hard cut between stops still
     reads like broken animation to someone who has not opened dev tools —
     this site's own owner mistook it for exactly that on a machine with
     Windows animation effects switched off. That risk is accepted rather
     than worked around: no in-page control exists to correct it, so the OS
     preference is the whole of the decision.

     It is not a load-time constant, though. Someone can flip the setting
     while the page is open — a scroll animation is exactly the kind of thing
     a visitor reaches for that control halfway through, mid-zoom — so the
     query below is read live via a change listener further down this file,
     and the camera repaints into the other mode on the spot.
     ================================================================== */
  function osReduced() { return !!(motionQuery && motionQuery.matches); }
  var reduced = osReduced();

  /* Camera stops: board-space center (x, y) and the span to fit (w, h).
     Stop 0's four numbers are mirrored by the --first-frame math in the
     inline head script in index.html, which frames the board before this
     file has executed. Retune stop 0 and that copy must move with it. */
  /* EXPERIMENT (branch smoother-zoom): stops 2 through 5 widened so each one
     rests at scale 0.75 instead of 0.89-1.00. The board needs a texture of
     3600 x scale x devicePixelRatio to draw sharply, so dropping the resting
     scale from 1.00 to 0.75 takes the About framing from about 132MB to 74MB
     and gives the compositor far less to re-raster mid-flight.

     Stop 6 is deliberately NOT widened. The contact form's labels and inputs
     are 19 board px, which clear the 15 CSS px legibility floor only because
     that stop rests at 0.857; at 0.75 they would render at 14.25 and fail it.
     Contact therefore stays closer than its neighbours on purpose.

     Restore point for the previous framings: tag known-good-zoom-20260819. */
  var STOPS = [
    { x: 1800, y: 1200, w: 3860, h: 2620 },  /* 0 whole board */
    { x: 1800, y: 1100, w: 900,  h: 700 },   /* 1 circular sticker */
    { x: 926,  y: 613,  w: 1785, h: 1200 },  /* 2 about + polaroid, lifted 190 with them */
    { x: 2745, y: 765,  w: 1260, h: 1200 },  /* 3 services cluster, four stickies */
    { x: 2800, y: 1600, w: 1704, h: 1200 },  /* 4 work pane: postcard + room below for future products */
    { x: 1640, y: 1910, w: 1428, h: 1200 },  /* 5 reviews: chad row over annie row */
    /* 6 contact: Phase 7 retuned this to frame the new form sheet AND the
       postcard together, not the postcard alone. Their combined extent is
       NOT the two papers' nominal left/top/width/height added up: both
       carry a small --rot, and getBoundingClientRect() on the live page
       (tools/verify/phase7-check.mjs) is what actually measured it, at
       roughly x 118-1032 y 997-1980. Centered on that with a little margin
       (about 30px a side) gives the numbers below. Scale at 1440x900 comes
       out to min(1440/980, 900/1050) = ~0.857, so 15 screen px needs
       ~17.5 board px of font-size to clear; every field label, input, and
       the consent notice in .contact-form (css/style.css) is 19px, and the
       acceptance pass measures the actual computed value in the browser
       rather than trusting this arithmetic. */
    { x: 575,  y: 1489, w: 980,  h: 1050 },  /* 6 contact: form sheet + postcard */
    { x: 1800, y: 1200, w: 3860, h: 2620 }   /* 7 pull back out */
  ];

  /* Pins: board-space points. Strings run pin to pin with a little sag. */
  /* pins land where a hand put them, not dead center */
  var PINS = [
    /* 0 sticker. CENTRED on the sticker's vertical axis, not carried over from
       the old notecard's hand-placed pin. The sticker spans x1540-2060 so its
       centreline is 1800, which is the board's horizontal centre; sitting 47px left
       of that read as skewed on a circle in a way it never did on a rectangle.
       y955 puts it just inside the top edge, where a pin would bite.

       Every string on the board originates here, so this pin and the sticker
       have to move together or all four strings strand on bare cork. */
    { x: 1800, y: 855 },
    { x: 741,  y: 304 },  /* 1 about, lifted 190 with the card */
    { x: 1236, y: 446 },  /* 2 caden polaroid, lifted 190 with it */
    { x: 2547, y: 335 },  /* 3 services s1 */
    { x: 2934, y: 1318 }, /* 4 work postcard */
    { x: 1977, y: 1523 }, /* 5 quote card (reviews row 1, right) */
    { x: 1309, y: 1466 }, /* 6 chad polaroid, moved left with it */
    { x: 694,  y: 1544 }, /* 7 contact */
    /* The two stray pins that used to sit here, at (3092, 2078) and (442, 268),
       are gone. They were deliberate realism, leftovers from whatever hung on
       the board before, and they read fine while the papers were arranged
       around them. Lifting the About group 190 put one of them directly above
       that card with nothing under it, and the owner read it, fairly, as a
       mistake rather than as character. The .hole elements still carry that
       idea without looking like a pin holding nothing.

       DELETING A PIN RENUMBERS EVERY PIN AFTER IT, and STRINGS indexes into
       this array. The form sheet's pin moved from 10 to 8 and the string that
       reaches it moved with it. */
    /* 10 form sheet. Deliberately at the sheet's TOP-RIGHT corner, not its
       top-left. The string that reaches it comes down from the sticker at
       (1783, 815), so a pin on this side lets the line arrive over open cork
       and stop at the corner. A pin on the left corner would have dragged that
       same line diagonally across the fields the visitor has to read. */
    { x: 952,  y: 1024 }
  ];

  /* empty holes from whatever hung here before */
  var HOLES = [
    { x: 980, y: 1490 }, { x: 2350, y: 470 }, { x: 3210, y: 890 },
    { x: 2620, y: 2140 }, { x: 260, y: 780 }, { x: 2900, y: 2240 }
  ];

  /* [0, 10] replaces what used to be [0, 7]. The sticker's line to the contact
     zone used to end on the postcard's pin, and the Phase 7 form sheet now sits
     squarely between the two, so that line crossed the sheet through the Email
     field and the description box. Ending it on the form's own pin instead
     reaches the same zone and arrives over open cork.

     There is deliberately no string from the form down to the postcard. Any
     line between those two pins has to cross one sheet or the other, and a
     string lying over a decorative card is charming where a string lying over
     an input someone has to fill is just in the way. The postcard keeps its
     pin unstrung, like the two stray pins already on the board. */
  var STRINGS = [
    /* [0, 1], the sticker to the About card, is deliberately absent. The
       founder polaroid sits squarely between those two pins, so ANY line
       between them crosses it: measured, that one ran from (1445, 670) to
       (1064, 472), straight over the photograph's face. There is no routing
       that avoids it, because a string here is a straight run between two
       fixed points and the photo is in the middle of it. The About corner
       keeps its own [1, 2], which clips only the polaroid's top edge above
       the picture. Do not "restore the missing string". */
    [0, 3], [0, 4], [0, 8],
    [4, 5], [5, 6], [1, 2],
    /* About across to the services cluster. Runs high, above the founder
       polaroid rather than over it, which is why this pairing works where the
       sticker-to-About line did not. */
    [1, 3]
  ];

  /* Build string paths + pin elements once. */
  var frag = document.createDocumentFragment();
  STRINGS.forEach(function (s) {
    var a = PINS[s[0]], b = PINS[s[1]];
    var dx = b.x - a.x, dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    /* Taut, not swagged. This was 24 + dist * 0.055, which on a typical
       1090px run put 84 board pixels of droop into the curve: enough that the
       line arrived at its pin from a steep angle, well below the straight
       path between the two, and read as a decorative squiggle that happened
       to pass near a pin rather than a string pulled between two of them. The
       owner's report was that they "are connected to nothing". A little sag
       still says string rather than wire; this is about a third of it. */
    var sag = 10 + dist * 0.02;
    var d = "M" + a.x + " " + a.y +
      " Q" + (a.x + dx / 2) + " " + (a.y + dy / 2 + sag) +
      " " + b.x + " " + b.y;
    ["string-core", "string-hi"].forEach(function (cls) {
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("class", cls);
      frag.appendChild(path);
    });
  });
  stringsSvg.appendChild(frag);

  PINS.forEach(function (p) {
    var el = document.createElement("div");
    el.className = "pin";
    el.style.left = p.x + "px";
    el.style.top = p.y + "px";
    board.appendChild(el);
  });

  HOLES.forEach(function (h) {
    var el = document.createElement("div");
    el.className = "hole";
    el.style.left = h.x + "px";
    el.style.top = h.y + "px";
    board.appendChild(el);
  });

  /* Dwell easing: the camera rests at each stop for the first and last
     stretch of a segment, then glides with a heavy ease between them. */
  var DWELL = 0.22;
  function ease(t) {
    if (t <= DWELL) return 0;
    if (t >= 1 - DWELL) return 1;
    var u = (t - DWELL) / (1 - 2 * DWELL);
    return u * u * u * (u * (u * 6 - 15) + 10); /* smootherstep */
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function scaleFor(stop, vw, vh) {
    return Math.min(vw / stop.w, vh / stop.h);
  }

  var ticking = false;

  /* The board reads at rest and only at rest. Every piece of paper carries a
     stack of four or five drop-shadow()s, and each one re-blurs the whole
     accumulated result over an expanded filter region, so the stacks cost
     ~173ms of the ~200ms it takes to actually draw a frame. While the camera
     is flying nobody is reading anything, so a .moving class collapses each
     stack to a single shadow tuned to sit where the stack's centre of mass
     sits. The class is cleared on a timer once scrolling settles, which puts
     the full stacks back before the eye has anything to study.

     600 AND NOT 160, AND THAT ONE NUMBER IS THE WHOLE FIX FOR A HALF-SECOND
     FREEZE. Collapsing the stacks is cheap. RESTORING them is not: it is a
     re-raster of every sheet on a board that may be entirely on screen, and a
     GPU trace puts the cost where no amount of staring at this file would have
     found it — not on the renderer main thread at all (BeginMainFrame totals
     219-254ms across 218 frames) but one blocked task on the GPU process,
     SwapBuffers -> ScheduleOverlays -> WaitForCommandsToBeScheduled, 428ms,
     waiting on raster.

     The gesture that makes it hurt is the one a mouse wheel actually produces:
     bursts of ticks separated by pauses. At 160ms the timer fires inside every
     one of those pauses, so the visitor pays the full restore over and over
     through a single flick. Measured on an M3 at 1512x982 dsf2, real wheel
     events, ten bursts of six ticks with 300ms pauses:

       160    p50 17.7ms   p95 882.5ms   worst 2598.5ms   31.8% of frames >100ms
       600    p50 16.7ms   p95  18.5ms   worst  216.7ms    0.3% of frames >100ms

     Nothing about the resting board changes — the restore still happens, and
     the full stacks are still what the eye studies. It just stops happening in
     the middle of a gesture that has not finished. Continuous scrolling was
     never affected either way, which is exactly why every scripted-scroll
     measurement of this page came back clean and hid the problem for weeks. */
  var MOVE_SETTLE = 600;
  var moveTimer = null;
  var lastMove = 0;

  /* settle() re-checks the clock instead of trusting that it was rescheduled.
     A frame of this board can take longer to draw than MOVE_SETTLE, and a
     plain clearTimeout/setTimeout debounce driven off rAF would then fire in
     the gap between two frames: the class would drop, the full shadow stacks
     would come back mid-flight, and the next frame would put the class on
     again, so the filters would flicker hardest exactly when the machine is
     already behind. Marking from the scroll event (which is input-driven, not
     render-driven) and re-arming from the real elapsed time makes the state
     independent of how slow a frame happens to be. */
  function settle() {
    /* NEVER restore the detail while a flight is still running. The settle
       timer is armed when a move BEGINS, so once FLY_MS grew past MOVE_SETTLE
       this fired mid-flight: at 660ms of flight against a 600ms settle it put
       the single most expensive frame on the page at about 97% of the way
       through the move, and the owner saw exactly that, a stutter just before
       the last sliver of a zoom out. Wait for the landing instead, and let
       landFlight() refresh lastMove so the full settle is measured from where
       the board actually stopped. */
    if (flying) {
      moveTimer = setTimeout(settle, 80);
      return;
    }
    var idle = Date.now() - lastMove;
    if (idle < MOVE_SETTLE) {
      moveTimer = setTimeout(settle, MOVE_SETTLE - idle);
      return;
    }
    moveTimer = null;

    /* Putting the detail back is the single most expensive frame this page
       ever draws: every procedural ink filter, every backdrop blend, every
       blur and the full shadow stacks all return at once, across whatever the
       camera is currently framing. On a fixed timer that frame lands 170ms
       after a 430ms flight has visibly finished, which reads as the board
       lagging right at the moment it should feel settled.

       requestIdleCallback hands it to the browser to place in a gap instead.
       Nothing about the picture depends on when it happens, only that it does,
       so there is no reason to insist on a particular millisecond. The 400ms
       timeout is the backstop for a main thread so busy that no idle period
       ever arrives, and the fallback covers Safari, which still ships no
       requestIdleCallback. */
    var restore = function () {
      board.classList.remove("moving");
      document.documentElement.classList.remove("board-moving-scene");
    };
    if (window.requestIdleCallback) window.requestIdleCallback(restore, { timeout: 400 });
    else setTimeout(restore, 60);
  }

  function markMoving() {
    /* Nothing is in flight in reduced mode: the board holds one composed
       stop and then holds the next one, so there is no fly-through to buy
       frames for. Toggling the shadow stacks anyway would swap every sheet's
       shading on and off under a picture that is otherwise standing still,
       which is a flicker with nothing to hide behind it. One guard here
       covers both call sites and leaves the normal-mode system untouched. */
    if (reduced) return;
    /* Reading mode scrolls the document, not the camera. Letting the class
       ride those scroll events would swap every sheet's shadow stack on and
       off while somebody is reading a stationary column. */
    if (!cameraActive()) return;
    lastMove = Date.now();
    if (moveTimer === null) {
      board.classList.add("moving");
      /* The room's grain-and-vignette overlay lives on .viewport::after, which
         is an ANCESTOR of .board, so .board.moving cannot reach it. This
         mirror on the root element is how that full-viewport composite gets
         switched off for the length of a move. */
      document.documentElement.classList.add("board-moving-scene");
      moveTimer = setTimeout(settle, MOVE_SETTLE);
    }
  }

  /* scrollHeight is a forced layout flush. The runway is .scroll-space at
     1300vh, so the value only ever changes with the viewport: measure it on
     resize and on load instead of on every frame. */
  var maxScroll = 0;

  function measure() {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  }

  /* Reading mode. Below 700px the stylesheet reflows the board into a column
     and sets --camera-active to 0; there is no stage left to point a camera
     at, and writing a transform would drag that column off screen. Read live
     rather than latched at load, because the viewport crossing the threshold
     is exactly the event that matters: rotating a phone, dragging a window
     narrow, or zooming the browser, which shrinks the CSS viewport and is the
     whole reason zoom now magnifies anything at all. */
  function cameraActive() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--camera-active").trim() !== "0";
  }

  /* progressNow(): where the scroll position says the camera is, on the same
     0..STOPS.length-1 scale the stops are indexed by. One reader, so the
     flight below and update() can never disagree about the current frame. */
  function progressNow() {
    var max = maxScroll;
    var p = max > 0 ? (window.scrollY / max) * (STOPS.length - 1) : 0;
    return Math.max(0, Math.min(STOPS.length - 1, p));
  }

  /* framingFor(p): the composition at a progress value, as a plain
     { x, y, s }. Lifted out of update() unchanged so the flight below can ask
     for the very frame update() would draw, both for where a flight begins
     and for where it has to land. Nothing about the maths moved. */
  function framingFor(p) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    if (reduced) {
      /* Nearest stop, taken whole. No lerp on x/y and no exp/log ramp on
         scale, so there is no in-between frame to sit through: the view is
         one of the eight compositions and then it is the next one. */
      var stop = STOPS[Math.round(p)];
      return { x: stop.x, y: stop.y, s: scaleFor(stop, vw, vh) };
    }

    var i = Math.min(Math.floor(p), STOPS.length - 2);
    var f = ease(p - i);
    var a = STOPS[i], b = STOPS[i + 1];

    return {
      x: lerp(a.x, b.x, f),
      y: lerp(a.y, b.y, f),
      /* log-space scale so long zooms feel even */
      s: Math.exp(lerp(Math.log(scaleFor(a, vw, vh)), Math.log(scaleFor(b, vw, vh)), f))
    };
  }

  /* writeFraming(): clamp the requested centre onto the cork, then publish
     one transform to the board and its floor. EVERY writer of #board's
     transform goes through here, so the clamp cannot be bypassed by a new
     caller and the two elements cannot drift apart. */
  /* Below this scale the board's handmade detail is physically too small to
     resolve, so it is not drawn at all. See setFar. */
  var FAR_SCALE = 0.6;
  var isFar = null;

  /* The expensive part of this page is not the camera, it is restoring 32
     procedural ink filters, 16 backdrop blends and 20 blur passes when the
     board settles. Tying that to motion alone put the whole cost at the END of
     a zoom OUT, which is the one framing where every paper is on screen at once
     and therefore every effect has to be rasterised together. The owner saw it
     exactly there: a pause, then the picture snapping into focus.

     Scale is the better gate. At the whole-board framing the board draws at
     about a third of size, where two displacement pixels of pen tremor and a
     three-pixel torn edge cannot be resolved on any display. So they stay off
     until the camera is close enough for them to mean something, and the
     settle after a zoom out has nothing expensive left to do.

     Measured at 1440x900: the whole board rests at 0.34 and every zone stop
     lands between 0.86 and 1.29, so 0.6 separates them with room either side
     and no stop sits near the boundary. */
  function setFar(s) {
    var far = s < FAR_SCALE;
    if (far === isFar) return;   /* only touch the DOM when it actually flips */
    isFar = far;
    board.classList.toggle("far", far);
  }

  function writeFraming(x, y, s) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    setFar(s);

    /* keep the camera on the cork: clamp view to board bounds */
    var BW = 3600, BH = 2400;
    var visW = vw / s, visH = vh / s;
    if (visW < BW) { x = Math.max(visW / 2, Math.min(BW - visW / 2, x)); }
    else { x = BW / 2; }
    if (visH < BH) { y = Math.max(visH / 2, Math.min(BH - visH / 2, y)); }
    else { y = BH / 2; }

    /* The board's transform moves the WHOLE element, border included, but every
       paper on it is positioned inside that border, so a paper's y and the
       camera's y were never the same number. The frame width is the gap: at
       30px it read as slack in the tuning, and thickening the walnut to 96
       shifted every stop 66 further and pushed the contact form's Send row out
       of frame. Adding the border here puts the camera and the papers in one
       coordinate space, so a stop's numbers mean what they say. Read from the
       element rather than hard-coded, or the next frame change reopens this. */
    var edge = parseFloat(getComputedStyle(board).borderLeftWidth) || 0;
    var t =
      "translate(" + (vw / 2 - (x + edge) * s) + "px," +
                     (vh / 2 - (y + edge) * s) + "px) scale(" + s + ")";
    board.style.transform = t;
    if (floor) floor.style.transform = t;
  }

  function update() {
    if (!cameraActive()) {
      /* Clear anything a previous frame wrote, or the column inherits a
         transform from whichever stop the camera was resting on when the
         window crossed the threshold. The stylesheet also carries
         `transform: none !important` for the case where this script is stale
         or never ran; this line is what makes the live switch clean. */
      if (board.style.transform) board.style.transform = "";
      if (floor && floor.style.transform) floor.style.transform = "";
      return;
    }

    var f = framingFor(progressNow());
    writeFraming(f.x, f.y, f.s);
  }

  /* rAF entry point. update() itself stays pure so the first paint can call
     it without ever flagging the board as moving. */
  function frame() {
    ticking = false;
    /* also mark here, not only on the scroll event: on a slow machine the
       main thread can be busy long enough that scroll events themselves
       arrive further apart than MOVE_SETTLE. Keeping the state alive from
       whichever of the two fired last means the collapse holds for the whole
       gesture instead of dropping out between frames. */
    markMoving();
    update();
  }

  function onScroll() {
    /* The instant jump inside goToStop fires this. Ignoring it while a flight
       is up is what lets the flight own the motion: repainting from the new
       scroll position here would draw the destination immediately. */
    if (flying) return;
    markMoving();
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(frame);
    }
  }

  function onResize() {
    /* maxScroll and every scaleFor result change here, so a tween captured
       against the old viewport is stale the moment the window moves. */
    cancelFlight(false);
    measure();
    onScroll();
  }

  /* Hand control back the instant the visitor reaches for the wheel, rather
     than making them wait out a flight they have changed their mind about.
     Bound to wheel and touchstart and NOT to scroll, because the programmatic
     jump above fires scroll too and the two cannot be told apart there. */
  function onUserScrollIntent() { cancelFlight(true); }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", onUserScrollIntent, { passive: true });
  window.addEventListener("touchstart", onUserScrollIntent, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("load", function () {
    measure();
    update();

    /* End the warm-up. The inline head script set html.warming so the board's
       first, coldest rasters could be drawn with collapsed shadow stacks; by
       `load` every asset has arrived and the expensive frames are behind us,
       so the full stacks come back.

       MOVE_SETTLE after load, not on it, and for the reason MOVE_SETTLE exists
       at all: restoring the stacks is a re-raster of every sheet on screen,
       measured as a 428ms blocked task on the GPU process. Doing that in the
       same turn as the load event stacks it on top of whatever else the
       browser is finishing. One settle-length of quiet first, and it lands on
       an idle machine.

       If the visitor is already scrolling by then, .moving is on the board and
       owns the collapse anyway, so this hands over rather than fighting. */
    setTimeout(function () {
      document.documentElement.classList.remove("warming");
    }, MOVE_SETTLE);
  });

  /* The preference is not a load-time constant. Someone can turn it on from
     the OS while the page is open — that is in fact when they are most likely
     to reach for it, halfway through a zoom that is making them ill — so the
     query is read live and the board repaints into the other mode on the
     spot. addListener is the pre-2021 Safari spelling of the same thing. */
  /* One place that turns the current preference into everything downstream:
     the camera's own flag. Called on load and on OS change, so the flag can
     never disagree with the query it comes from. */
  function applyMotion() {
    reduced = osReduced();

    if (reduced && moveTimer !== null) {
      /* drop a collapse that was armed by the mode we just left, so the
         shadow stacks come back on the still frame instead of 160ms into it */
      clearTimeout(moveTimer);
      moveTimer = null;
      board.classList.remove("moving");
    }
    update();
  }

  function onMotionChange() {
    applyMotion();
  }
  if (motionQuery) {
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", onMotionChange);
    } else if (motionQuery.addListener) {
      motionQuery.addListener(onMotionChange);
    }
  }

  applyMotion();

  /* Which piece of paper each nav link is really pointing at. The camera path
     below reaches it by stop index; reading mode has no stops, no runway and
     therefore a maxScroll of 0, so every link would have scrolled to the top
     of the page and looked broken. Same destinations either way.

     All SIX of the dropdown's stops are mapped, not just the four the old
     deskbar exposed. An entry that silently does nothing is worse than one
     that is absent: the visitor presses Reviews, the menu closes, and the
     page sits still, which reads as a broken link rather than as a mode that
     does not have zones. Stop 0 has no paper of its own to reach for, so it
     is handled separately below by going to the top of the document, which is
     what "the whole board" means once the board is a column. */
  var STOP_TARGET = {
    2: ".about-card",
    3: ".service-sticky",
    4: ".work-postcard",
    5: ".quote-card",
    6: ".contact-postcard"
  };

  /* ==================================================================
     DIRECT FLIGHT TO A STOP, RUN ON THE COMPOSITOR
     ==================================================================
     Two problems were solved here, and the second one is the reason this is
     a CSS transition rather than a requestAnimationFrame tween.

     FIRST, the tour. The camera is a pure function of scroll position, so
     reaching a stop by animating scroll meant the camera had to VISIT every
     stop on the way: clicking Contact from the opening frame toured About,
     Services, Portfolio and Reviews. Scroll is therefore set INSTANTLY now,
     carrying only the resting state, and the flight owns the visual motion
     along the straight line between two framings.

     SECOND, the lag. Writing a new transform from JS every frame looks like
     the obvious way to animate that line, and it is unusably slow here.
     .board is 3600x2400 with will-change: transform, and every frame of the
     flight hands the compositor a DIFFERENT SCALE. A composited layer has to
     be re-rasterised whenever its scale changes, so that is 41 megapixels of
     paper texture, filter stacks and blend modes re-rastered sixty times a
     second. It dropped so many frames that the owner read the result as a
     teleport even after the easing was fixed.

     A CSS transition avoids the whole problem: Chrome rasterises the layer
     once and animates the existing texture on the compositor thread, off the
     main thread entirely. The cost is that type goes slightly soft during the
     flight and snaps sharp when it lands, which is the normal trade and is
     invisible next to dropped frames.

     The easing below is a smooth ease-in-out. Note that it deliberately does
     NOT reuse ease(): that function carries a 0.22 DWELL at each end so the
     camera rests at a stop while the wheel carries you past it, which is
     right for scrolling and, applied to a flight, deletes the ease-in and
     ease-out and leaves a lunge in the middle.
     ================================================================== */
  /* The one dial worth turning. At 0 goToStop takes the hard-cut branch
     instead, which is also the path reduced motion takes. */
  /* 760 -> 430. This is not a taste knob any more, it is the re-raster count.
     The board is 3600x2400, so at a zone's scale on a 2x display a sharp
     texture is roughly 7200x4800, about 138MB. Chrome cannot hold one that big
     for the length of an animation, so instead of rasterising once and scaling
     that texture it RE-rasterises at intervals, and every one of those is a
     stall plus a visible pop. The owner described it exactly: "big zoom, click,
     little zoom, click, little zoom, stabilise". A shorter flight spans fewer
     of those intervals, so it collects fewer clicks.

     Raised 430 -> 600 once the zone framings widened. The re-raster count is
     driven mostly by how far the SCALE travels, not by how long the trip
     takes, and widening stops 2-5 cut the range from 0.34-1.00 down to
     0.34-0.75. A third less range is a third fewer thresholds to cross, which
     is the headroom this slower, easier pace is spending.

     750 was tried once and seemed to bring the clicks back, which is why this
     sat at 660 for a while. That reading was wrong: the settle timer was still
     firing mid-flight then, so at 750ms of flight against a 600ms settle the
     most expensive frame on the page landed 80% of the way through every move.
     With that fixed, the duration is free again, and a longer move is also a
     slower one, which is the jerk itself. If clicks ever genuinely return,
     check that settle is still refusing to run while flying BEFORE reaching
     for this number. */
  var FLY_MS = 750;
  /* A SYMMETRIC ease-in-out. The previous value here, cubic-bezier(0.45, 0,
     0.15, 1), had its second control point at x=0.15, BEFORE the first at
     x=0.45, which back-loads the curve badly: measured, it covered 20% of the
     distance in the first quarter of the duration, then 60% of it in the next
     quarter, then crawled through the last 20% for half the duration. The
     owner described exactly that, unprompted, as "a brief pause, then a quick
     zoom, then a stutter before it's done". This one is 50% of the way at 50%
     of the time, and never changes speed abruptly. */
  /* Zooming OUT and zooming IN are not the same problem, so they do not get
     the same curve.

     Out is cheap: the board is already drawn at the larger size, and the
     compositor only has to shrink a picture it already holds. The owner
     described it as one smooth zoom, and it is.

     In is not. It needs a NEW, larger drawing of a 3600x2400 layer before it
     can show anything, and that allocation lands on the first frame of the
     move. Starting at the same pace as the exit puts real motion under that
     spike, which is what he saw: "zoom, click, zoom". FLY_EASE_IN is the same
     shape with a much lazier opening, 2.3% of the distance in the first 15%
     of the duration against 4.6%, so the drawing finishes while almost
     nothing is moving and the eye has nothing to catch on. */
  var FLY_EASE = "cubic-bezier(0.42, 0, 0.58, 1)";
  /* Softened from cubic-bezier(0.62, 0, 0.62, 1), which bought its lazy
     opening at the price of a lurch: measured against a perfectly even move,
     it peaked at 2.06x the average speed and did so 63% of the way through,
     while the exit curve peaks at a gentler 1.72x dead in the middle. That
     20% faster, off-centre peak is what the owner felt as jerky. This one
     peaks at 1.91x at 53%, so it still opens more slowly than the exit, which
     is the point of having its own curve at all, without the surge. */
  var FLY_EASE_IN = "cubic-bezier(0.42, 0, 0.58, 1)";
  var flying = false;
  var flyTimer = null;

  function setFlyTransition(on, ease) {
    var v = on ? "transform " + FLY_MS + "ms " + (ease || FLY_EASE) : "";
    board.style.transition = v;
    if (floor) floor.style.transition = v;
  }

  /* Land: drop the transition, hand the camera back to scroll, and prove the
     resting frame is the one scroll draws at this offset rather than trusting
     the flight's own last frame to have been close enough. */
  function landFlight() {
    if (!flying) return;
    flying = false;
    if (flyTimer !== null) { clearTimeout(flyTimer); flyTimer = null; }
    board.removeEventListener("transitionend", onFlyEnd);
    setFlyTransition(false);
    /* Restart the settle clock from the landing, not from the take-off, so the
       detail comes back a clear interval AFTER the board has stopped rather
       than partway through the last of the move. */
    lastMove = Date.now();
    update();
  }

  function onFlyEnd(e) {
    /* Only this element's own transform. Papers inside the board have their
       own transitions, and a bubbled one from any of them would land the
       flight early. */
    if (e.target !== board || e.propertyName !== "transform") return;
    landFlight();
  }

  /* Cancel with resync=true when the visitor took over and the camera must go
     wherever scroll now says it is; with false when a caller is about to take
     the camera somewhere itself. Either way the in-flight transform is frozen
     to whatever is on screen at this instant before the transition comes off,
     or dropping it would snap the board back to the flight's start value. */
  function cancelFlight(resync) {
    if (!flying) return;
    flying = false;
    if (flyTimer !== null) { clearTimeout(flyTimer); flyTimer = null; }
    board.removeEventListener("transitionend", onFlyEnd);

    var frozen = getComputedStyle(board).transform;
    setFlyTransition(false);
    if (frozen && frozen !== "none") {
      board.style.transform = frozen;
      if (floor) floor.style.transform = frozen;
    }
    if (resync) update();
  }

  /* goToStop(stop): everything a[data-stop] click used to do inline, pulled
     out under its own name so a second entry point can reach the identical
     path instead of copying it. Two more callers arrive in this same phase
     (a click on a piece of paper, and Escape backing out to stop 0), and a
     pure refactor here means neither of them can drift from what the nav
     links have already done correctly. Nothing below changed behaviour. */
  function goToStop(stop) {
    if (!cameraActive()) {
      /* "Whole board" has no single paper to scroll to, so it means the top
         of the column. Checked before the lookup because 0 is a real stop
         index and would otherwise fall through as a missing key. */
      if (stop === 0) {
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
        return;
      }
      var target = document.querySelector(STOP_TARGET[stop] || "");
      if (target) {
        target.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "start"
        });
      }
      return;
    }

    var target = (stop / (STOPS.length - 1)) * maxScroll;

    /* A hard cut, for the two cases that must not animate at all. Reduced
       motion already means "compose, then compose the next one", and FLY_MS
       at 0 is the switch for anyone who wants that behaviour outright. */
    if (reduced || FLY_MS <= 0) {
      cancelFlight(false);
      window.scrollTo({ top: target, behavior: "auto" });
      update();
      return;
    }

    /* Where the camera is RIGHT NOW, read before scroll moves anywhere. Taken
       through framingFor rather than from a stop index, so a click landing
       mid-gesture flies from the frame actually on screen instead of jumping
       to the nearest stop first. */
    var from = framingFor(progressNow());

    /* And where it is going, from the SAME function, so the flight's last
       frame is byte-identical to the frame scroll draws at `target` and the
       handoff back to the wheel is invisible. Reading STOPS[stop] directly
       would be subtly wrong at the final stop, where framingFor clamps i and
       evaluates f = 1 rather than indexing i + 1. */
    var to = framingFor(stop);

    cancelFlight(false);

    /* flying goes up BEFORE scroll moves. The jump below fires a scroll
       event, and onScroll has to ignore it: repainting from the new position
       there would land on the destination instantly and there would be no
       flight left to watch. */
    flying = true;

    /* Pin the current frame with NO transition first. A transition needs a
       definite start value to interpolate from, and the browser will only use
       one it has actually recorded. */
    setFlyTransition(false);
    writeFraming(from.x, from.y, from.s);

    window.scrollTo({ top: target, behavior: "auto" });

    /* Force a style flush so the start value above is committed before the
       transition is armed. Without this the browser coalesces both writes and
       sees only the destination, so nothing animates at all. */
    void board.offsetWidth;

    /* Same shadow-stack collapse a scroll gesture gets, for the same reason:
       these are the frames that have to be cheap to draw. */
    markMoving();
    /* to.s > from.s is a zoom IN, the direction that has to allocate. */
    setFlyTransition(true, to.s > from.s ? FLY_EASE_IN : FLY_EASE);
    writeFraming(to.x, to.y, to.s);

    board.addEventListener("transitionend", onFlyEnd);
    /* Backstop. transitionend never fires when the two framings are identical,
       which happens whenever somebody clicks the zone they are already in, and
       flying would otherwise stay up forever and deafen every scroll event. */
    flyTimer = setTimeout(landFlight, FLY_MS + 150);
  }

  /* Nav links jump the camera to a stop. Selector widened from
     ".deskbar a[data-stop]" so this also drives the kebab dropdown's
     links now that they live outside .deskbar; nothing else in the
     document carries data-stop. */
  document.querySelectorAll("a[data-stop]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      goToStop(parseInt(link.getAttribute("data-stop"), 10));
    });
  });

  /* ==================================================================
     ZONE CLICKS: a piece of paper moves the camera the same way a nav
     link does
     ==================================================================
     One listener on #board, delegated, rather than one per paper: papers
     get added, removed, and re-tuned on this board often enough (see the
     parked second testimonial above) that a matching set of ten individual
     listeners would be one more thing to keep in sync with the markup.

     Order inside the handler matters:
       1. A real control inside the clicked element always wins, checked
          first and returned on before anything else runs. .work-postcard
          contains the Level Up caption's <a>, .contact-postcard contains
          the circled email's <a>, and the pink .mini-sticky is nothing BUT
          a mailto link (which is exactly why it is not in the zone list
          below at all). Without this check a click meant for one of those
          links would also re-frame the camera underneath it.
       2. Only then is [data-zone-stop] looked up. e.target.closest finds
          it whether the click landed on the paper itself or on a text node
          inside it, the same way it finds the interactive elements above.
       3. Bare cork (no data-zone-stop ancestor) does nothing; #board is not
          itself a target.
     No preventDefault: a div has no default action worth cancelling, and
     calling it on an event that does not need it is a documented way to
     interfere with focus handling for zero benefit. */
  board.addEventListener("click", function (e) {
    if (e.target.closest("a[href], button, input, select, textarea, label, [tabindex]")) return;
    var paper = e.target.closest("[data-zone-stop]");
    if (!paper) return;
    goToStop(parseInt(paper.getAttribute("data-zone-stop"), 10));
  });

  /* ==================================================================
     WHY THESE PAPERS GET NO tabindex AND NO ACCESSIBLE NAME
     ==================================================================
     PLAN.md's Phase 4 outline calls for making each zone target focusable,
     with an accessible name, so Enter/Space activate it the way a button
     would. Deliberately not done here, for two concrete reasons:

     1. Two of the ten ARE containers for real links: .work-postcard holds
        the Level Up caption anchor, .contact-postcard holds the circled
        email anchor. A button's accessible content is treated as its
        label and may not contain interactive descendants, so giving either
        of these a button role would be invalid ARIA. Making them merely
        focusable with no role instead announces as nothing a keyboard or
        screen-reader visitor can act on.
     2. tabindex on all ten papers would insert ten new tab stops whose
        only effect is re-framing the camera, and they would sit ahead of
        the three real links (Level Up, the mailto sticky, the email
        address) that a keyboard visitor is actually there to reach.

     The kebab dropdown already reaches all six framings, including Whole
     Board, and was built and verified for keyboard use in Phase 3. The
     underlying FUNCTION this click adds is therefore already keyboard-
     operable; the zone click is a redundant pointer shortcut to it, not a
     second path to something the keyboard could not otherwise reach.
     WCAG 2.1.1 asks for the functionality to be reachable by keyboard, not
     for every redundant pointer affordance to carry its own tab stop. */

  /* ==================================================================
     ESCAPE RETURNS TO THE WHOLE BOARD
     ==================================================================
     Beyond the original Phase 4 plan, added because it follows directly
     from adding zone clicks: once a visitor can click INTO a zone, the
     scroll wheel and the kebab menu are the only ways back OUT, and Escape
     already means "back out" everywhere else on this page (it closes the
     dropdown). Extending that same meaning to the camera keeps one escape
     hatch instead of adding a second, different one.

     This must not fight js/menu.js, which registers its own Escape handler
     on document but only for the lifetime of an open menu: added in its
     open(), removed in its close(). This handler, by contrast, is
     registered once, here, at load. That ordering is exactly why
     stopPropagation from inside menu.js would not reliably help: listeners
     on one target fire in the order they were registered, so this handler
     -- registered first, at load -- would already have run and moved the
     camera before menu.js's handler ever got a chance to call
     stopPropagation on it. Rather than have menu.js try to shout over a
     handler that has already fired, this handler instead checks the
     menu's own open/closed state -- aria-expanded is the flag menu.js
     already maintains for exactly this -- and does nothing while the menu
     is open, leaving menu.js's own handler to close it uncontested. */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var menuBtn = document.querySelector(".board-menu-btn");
    if (menuBtn && menuBtn.getAttribute("aria-expanded") === "true") return;
    goToStop(0);
  });

  /* Drive the camera once, immediately. Nothing waits on the fade: the board
     is already at stop 0 the first time it is painted, faded or not. */
  measure();
  update();
})();
