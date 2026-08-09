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

  var board = document.getElementById("board");
  /* The solid sheet behind the board. It takes every transform the board
     takes, so an unrasterised board tile shows cork colour at ANY zoom rather
     than the wall. There was briefly a second, cork-TEXTURED sheet here too;
     it was deleted once photographs showed it failing in the same frames as
     the board, because anything carrying an image has to be rasterised and can
     therefore miss. See the .board-floor rule in css/style.css. */
  var floor = document.querySelector(".board-floor");
  var stringsSvg = document.getElementById("strings");
  /* The bottom cluster: the scroll instruction and the motion toggle. Faded as
     one unit, because they are one piece of chrome. */
  var hint = document.querySelector(".board-chrome");
  var motionBtn = document.querySelector(".motion-toggle");

  /* ==================================================================
     PREFERS-REDUCED-MOTION
     ==================================================================
     The CSS media query at the end of style.css only ever killed
     transitions, and this page's transitions are a fading hint. The motion
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
     THE VISITOR CAN DISAGREE WITH THE OS, IN EITHER DIRECTION
     ==================================================================
     Honouring prefers-reduced-motion is right and stays the default. What was
     missing is that the substitution is INVISIBLE: the snap mode above is a
     considered composition, but on screen it is indistinguishable from a page
     whose animation is broken. This site's own owner hit exactly that — a new
     Windows machine with animation effects switched off, and the report that
     came back was "the scroll animation is not working at all". Someone who
     knows the codebase read hard cuts as a defect in seconds. A visitor has no
     chance, and their conclusion is that the site is broken, not that it is
     considerate.

     So the preference becomes a default rather than a verdict. An explicit
     choice wins over the OS and is remembered for the visit; with no explicit
     choice, the OS still decides and still tracks live. sessionStorage and not
     localStorage matches js/peek.js: the choice belongs to this visit. The
     try/catch matches it too, because Safari in private mode throws on access
     and a storage failure must not cost the control.

     The classes exist so the toggle steers CSS as well as the camera. The
     stylesheet's suppression is scoped to html:not(.motion-on) inside the media
     query, so with no JS at all a reduced-motion visitor still gets it.
     ================================================================== */
  var MOTION_KEY = "ww-motion";
  function storedMotion() {
    try { return sessionStorage.getItem(MOTION_KEY); } catch (e) { return null; }
  }
  function storeMotion(v) {
    try { sessionStorage.setItem(MOTION_KEY, v); } catch (e) {}
  }

  var override = storedMotion();
  if (override !== "on" && override !== "off") override = null;

  function osReduced() { return !!(motionQuery && motionQuery.matches); }
  var reduced = override ? override === "off" : osReduced();

  /* Camera stops: board-space center (x, y) and the span to fit (w, h).
     Stop 0's four numbers are mirrored by the --first-frame math in the
     inline head script in index.html, which frames the board before this
     file has executed. Retune stop 0 and that copy must move with it. */
  var STOPS = [
    { x: 1800, y: 1200, w: 3860, h: 2620 },  /* 0 whole board */
    { x: 1800, y: 1070, w: 1080, h: 740 },   /* 1 title card */
    { x: 926,  y: 803,  w: 1340, h: 900 },   /* 2 about + polaroid */
    { x: 2745, y: 765,  w: 1050, h: 1000 },  /* 3 services cluster, four stickies */
    { x: 2800, y: 1600, w: 1420, h: 1000 },  /* 4 work pane: postcard + room below for future products */
    { x: 1690, y: 1910, w: 1200, h: 1010 },  /* 5 reviews: chad row over annie row */
    { x: 700,  y: 1783, w: 1040, h: 650 },   /* 6 contact card */
    { x: 1800, y: 1200, w: 3860, h: 2620 }   /* 7 pull back out */
  ];

  /* Pins: board-space points. Strings run pin to pin with a little sag. */
  /* pins land where a hand put them, not dead center */
  var PINS = [
    { x: 1783, y: 815 },  /* 0 title */
    { x: 741,  y: 494 },  /* 1 about */
    { x: 1236, y: 636 },  /* 2 caden polaroid */
    { x: 2547, y: 335 },  /* 3 services s1 */
    { x: 2934, y: 1318 }, /* 4 work postcard */
    { x: 1977, y: 1523 }, /* 5 quote card (reviews row 1, right) */
    { x: 1430, y: 1466 }, /* 6 chad polaroid (reviews row 1, left) */
    { x: 694,  y: 1544 }, /* 7 contact */
    { x: 3092, y: 2078 }, /* 8 stray pin, nothing under it */
    { x: 442,  y: 268 }   /* 9 stray pin */
  ];

  /* empty holes from whatever hung here before */
  var HOLES = [
    { x: 980, y: 1490 }, { x: 2350, y: 470 }, { x: 3210, y: 890 },
    { x: 2620, y: 2140 }, { x: 260, y: 780 }, { x: 2900, y: 2240 }
  ];

  var STRINGS = [
    [0, 1], [0, 3], [0, 4], [0, 7],
    [4, 5], [5, 6], [1, 2]
  ];

  /* Build string paths + pin elements once. */
  var frag = document.createDocumentFragment();
  STRINGS.forEach(function (s) {
    var a = PINS[s[0]], b = PINS[s[1]];
    var dx = b.x - a.x, dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var sag = 24 + dist * 0.055;
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
    var idle = Date.now() - lastMove;
    if (idle < MOVE_SETTLE) {
      moveTimer = setTimeout(settle, MOVE_SETTLE - idle);
      return;
    }
    moveTimer = null;
    board.classList.remove("moving");
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

  function update() {
    if (!cameraActive()) {
      /* Clear anything a previous frame wrote, or the column inherits a
         transform from whichever stop the camera was resting on when the
         window crossed the threshold. The stylesheet also carries
         `transform: none !important` for the case where this script is stale
         or never ran; this line is what makes the live switch clean. */
      if (board.style.transform) board.style.transform = "";
      if (floor && floor.style.transform) floor.style.transform = "";
      if (hint) hint.classList.remove("faded");
      return;
    }

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var max = maxScroll;
    var p = max > 0 ? (window.scrollY / max) * (STOPS.length - 1) : 0;
    p = Math.max(0, Math.min(STOPS.length - 1, p));

    var x, y, s;

    if (reduced) {
      /* Nearest stop, taken whole. No lerp on x/y and no exp/log ramp on
         scale, so there is no in-between frame to sit through: the view is
         one of the eight compositions and then it is the next one. */
      var stop = STOPS[Math.round(p)];
      x = stop.x;
      y = stop.y;
      s = scaleFor(stop, vw, vh);
    } else {
      var i = Math.min(Math.floor(p), STOPS.length - 2);
      var f = ease(p - i);
      var a = STOPS[i], b = STOPS[i + 1];

      x = lerp(a.x, b.x, f);
      y = lerp(a.y, b.y, f);
      /* log-space scale so long zooms feel even */
      s = Math.exp(lerp(Math.log(scaleFor(a, vw, vh)), Math.log(scaleFor(b, vw, vh)), f));
    }

    /* keep the camera on the cork: clamp view to board bounds */
    var BW = 3600, BH = 2400;
    var visW = vw / s, visH = vh / s;
    if (visW < BW) { x = Math.max(visW / 2, Math.min(BW - visW / 2, x)); }
    else { x = BW / 2; }
    if (visH < BH) { y = Math.max(visH / 2, Math.min(BH - visH / 2, y)); }
    else { y = BH / 2; }

    var t =
      "translate(" + (vw / 2 - x * s) + "px," + (vh / 2 - y * s) + "px) scale(" + s + ")";
    board.style.transform = t;
    if (floor) floor.style.transform = t;

    /* Fade on PROGRESS, not on pixels. This was `scrollY > vh * 0.4`, which
       retired the page's only instruction after 40% of one viewport — before
       the camera has finished its first move, so the words vanish while the
       visitor is still working out what the gesture did. Keyed to p instead,
       it holds until the camera has actually arrived at stop 1, which is the
       first moment the connection has been demonstrated rather than claimed.
       It also comes back on the way up, for anyone still lost. */
    if (hint) hint.classList.toggle("faded", p > 1);
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
    markMoving();
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(frame);
    }
  }

  function onResize() {
    measure();
    onScroll();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
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
     the camera's own flag, the two <html> classes the stylesheet reads, and
     the button's pressed state. Called on load, on OS change, and on click, so
     those four can never disagree with each other. */
  function applyMotion() {
    reduced = override ? override === "off" : osReduced();

    var root = document.documentElement;
    root.classList.toggle("motion-on", override === "on");
    root.classList.toggle("motion-off", override === "off");

    if (motionBtn) motionBtn.setAttribute("aria-pressed", reduced ? "false" : "true");

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
    /* An explicit choice outranks the OS for the rest of the visit. Without
       this guard, flipping the system setting would silently overwrite a
       decision the visitor made on purpose. */
    if (override) return;
    applyMotion();
  }
  if (motionQuery) {
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", onMotionChange);
    } else if (motionQuery.addListener) {
      motionQuery.addListener(onMotionChange);
    }
  }

  if (motionBtn) {
    motionBtn.addEventListener("click", function () {
      override = reduced ? "on" : "off";
      storeMotion(override);
      applyMotion();
    });
  }
  applyMotion();

  /* Which piece of paper each nav link is really pointing at. The camera path
     below reaches it by stop index; reading mode has no stops, no runway and
     therefore a maxScroll of 0, so every link would have scrolled to the top
     of the page and looked broken. Same four destinations either way. */
  var STOP_TARGET = {
    2: ".about-card",
    3: ".service-sticky",
    4: ".work-postcard",
    6: ".contact-postcard"
  };

  /* Nav links jump the camera to a stop. */
  document.querySelectorAll(".deskbar a[data-stop]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var stop = parseInt(link.getAttribute("data-stop"), 10);

      if (!cameraActive()) {
        var target = document.querySelector(STOP_TARGET[stop] || "");
        if (target) {
          target.scrollIntoView({
            behavior: reduced ? "auto" : "smooth",
            block: "start"
          });
        }
        return;
      }

      window.scrollTo({
        top: (stop / (STOPS.length - 1)) * maxScroll,
        /* a smooth scroll in reduced mode would drag the snap through every
           stop between here and there, which is the one thing worse than the
           zoom it replaced: a burst of hard cuts instead of one. Land on it. */
        behavior: reduced ? "auto" : "smooth"
      });
    });
  });

  /* Drive the camera once, immediately. Nothing waits on the fade: the board
     is already at stop 0 the first time it is painted, faded or not. */
  measure();
  update();
})();
