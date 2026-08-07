/* Cork board camera: scroll drives zoom stops across the board. */
(function () {
  "use strict";

  var board = document.getElementById("board");
  var stringsSvg = document.getElementById("strings");
  var hint = document.querySelector(".scroll-hint");

  /* Camera stops: board-space center (x, y) and the span to fit (w, h). */
  var STOPS = [
    { x: 1800, y: 1200, w: 3860, h: 2620 },  /* 0 whole board */
    { x: 1800, y: 1070, w: 1080, h: 740 },   /* 1 title card */
    { x: 926,  y: 803,  w: 1340, h: 900 },   /* 2 about + polaroid */
    { x: 2788, y: 722,  w: 1000, h: 950 },   /* 3 services cluster */
    { x: 2660, y: 1587, w: 1420, h: 1060 },  /* 4 work photo */
    { x: 1870, y: 1990, w: 1290, h: 820 },   /* 5 testimonial + chad */
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
    { x: 2634, y: 1318 }, /* 4 work postcard */
    { x: 1697, y: 1749 }, /* 5 quote card */
    { x: 2180, y: 1861 }, /* 6 chad polaroid */
    { x: 694,  y: 1544 }, /* 7 contact */
    { x: 3092, y: 2078 }, /* 8 stray pin, nothing under it */
    { x: 442,  y: 268 }   /* 9 stray pin */
  ];

  /* empty holes from whatever hung here before */
  var HOLES = [
    { x: 980, y: 1490 }, { x: 2350, y: 470 }, { x: 3210, y: 890 },
    { x: 1540, y: 2210 }, { x: 260, y: 780 }, { x: 2900, y: 2240 }
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
     sits. The class is cleared on a short timer once scrolling settles, which
     puts the full stacks back before the eye has anything to study. */
  var MOVE_SETTLE = 160;
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

  function update() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var max = maxScroll;
    var p = max > 0 ? (window.scrollY / max) * (STOPS.length - 1) : 0;
    p = Math.max(0, Math.min(STOPS.length - 1, p));

    var i = Math.min(Math.floor(p), STOPS.length - 2);
    var f = ease(p - i);
    var a = STOPS[i], b = STOPS[i + 1];

    var x = lerp(a.x, b.x, f);
    var y = lerp(a.y, b.y, f);
    /* log-space scale so long zooms feel even */
    var s = Math.exp(lerp(Math.log(scaleFor(a, vw, vh)), Math.log(scaleFor(b, vw, vh)), f));

    /* keep the camera on the cork: clamp view to board bounds */
    var BW = 3600, BH = 2400;
    var visW = vw / s, visH = vh / s;
    if (visW < BW) { x = Math.max(visW / 2, Math.min(BW - visW / 2, x)); }
    else { x = BW / 2; }
    if (visH < BH) { y = Math.max(visH / 2, Math.min(BH - visH / 2, y)); }
    else { y = BH / 2; }

    board.style.transform =
      "translate(" + (vw / 2 - x * s) + "px," + (vh / 2 - y * s) + "px) scale(" + s + ")";

    if (hint) hint.classList.toggle("faded", window.scrollY > vh * 0.4);
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
  window.addEventListener("load", function () { measure(); update(); });

  /* Nav links jump the camera to a stop. */
  document.querySelectorAll(".deskbar a[data-stop]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var stop = parseInt(link.getAttribute("data-stop"), 10);
      window.scrollTo({
        top: (stop / (STOPS.length - 1)) * maxScroll,
        behavior: "smooth"
      });
    });
  });

  measure();
  update();

  /* Readiness signal for the loading overlay. It is set here, after the camera
     has actually been driven once, so it means "the board works" rather than
     "the file arrived": if anything above throws, this line never runs, the
     overlay never sees a camera, and the visitor gets the error card instead
     of a page where scrolling does nothing. The overlay checks the transform
     on #board as well, so a stray global cannot fake it. */
  try {
    window.__wwBoardReady = true;
    document.dispatchEvent(new CustomEvent("ww:board-ready"));
  } catch (e) { window.__wwBoardReady = true; }
})();
