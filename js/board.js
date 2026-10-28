(function () {
  "use strict";

  if (!getComputedStyle(document.documentElement)
        .getPropertyValue("--camera").trim()) return;

  document.documentElement.classList.add("board-live");

  (function () {
    var root = document.documentElement;
    var wide = window.matchMedia("(min-width: 901px)");
    var started = false;
    var watcher = null;
    function start() {
      if (started) return;
      started = true;
      if (watcher) watcher.disconnect();
      if (wide.removeEventListener) wide.removeEventListener("change", check);
      var srcs = ["assets/cork.webp", "assets/board-key-light.webp",
                  "assets/board-shadow-pools.webp"];

      var shown = false;
      var ready = function () {
        if (shown) return;
        shown = true;
        root.classList.add("board-shown");
      };

      var since = window.performance && performance.now ? performance.now() : 0;
      setTimeout(ready, Math.max(0, 1500 - since));
      if (!window.Promise || !new Image().decode) {
        var cork = new Image();
        cork.src = srcs[0];
        cork.onload = cork.onerror = ready;
        return;
      }
      Promise.all(srcs.map(function (s) {
        var i = new Image();
        i.src = s;
        return i.decode();
      })).then(ready, ready);
    }
    function check() {
      if (wide.matches || root.classList.contains("board-open")) start();
    }
    check();
    if (started) return;
    if (wide.addEventListener) wide.addEventListener("change", check);
    if (window.MutationObserver) {
      watcher = new MutationObserver(check);
      watcher.observe(root, { attributes: true, attributeFilter: ["class"] });
    }
  })();

  var board = document.getElementById("board");

  var floor = document.querySelector(".board-floor");
  var stringsSvg = document.getElementById("strings");

  var motionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  function osReduced() { return !!(motionQuery && motionQuery.matches); }
  var reduced = osReduced();

  var STOPS = [
    { x: 1800, y: 1200, w: 3860, h: 2620 },
    { x: 1800, y: 1100, w: 900,  h: 700 },

    { x: 896,  y: 554,  w: 1440, h: 900 },
    { x: 2816, y: 723,  w: 1260, h: 1035 },
    { x: 2920, y: 1527, w: 1440, h: 900 },
    { x: 1708, y: 1661, w: 1440, h: 900 },

    { x: 575,  y: 1489, w: 980,  h: 1050 },
    { x: 1800, y: 1200, w: 3860, h: 2620 }
  ];

  var PINS = [

    { x: 1800, y: 855 },
    { x: 741,  y: 304 },
    { x: 1236, y: 446 },
    { x: 2547, y: 335 },
    { x: 2934, y: 1318 },
    { x: 1977, y: 1523 },
    { x: 1309, y: 1466 },
    { x: 694,  y: 1544 },

    { x: 952,  y: 1024 }
  ];

  var HOLES = [
    { x: 980, y: 1490 }, { x: 2350, y: 470 }, { x: 3210, y: 890 },
    { x: 2620, y: 2140 }, { x: 260, y: 780 }, { x: 2900, y: 2240 }
  ];

  var STRINGS = [

    [0, 3], [0, 4], [0, 8],
    [4, 5], [5, 6], [1, 2],

    [1, 3]
  ];

  var frag = document.createDocumentFragment();
  STRINGS.forEach(function (s) {
    var a = PINS[s[0]], b = PINS[s[1]];
    var dx = b.x - a.x, dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

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

  var DWELL = 0.22;
  function ease(t) {
    if (t <= DWELL) return 0;
    if (t >= 1 - DWELL) return 1;
    var u = (t - DWELL) / (1 - 2 * DWELL);
    return u * u * u * (u * (u * 6 - 15) + 10);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function scaleFor(stop, vw, vh) {
    return Math.min(vw / stop.w, vh / stop.h);
  }

  var ticking = false;

  var MOVE_SETTLE = 600;
  var moveTimer = null;
  var lastMove = 0;

  function settle() {

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

    var restore = function () {
      board.classList.remove("moving");
      document.documentElement.classList.remove("board-moving-scene");
    };
    if (window.requestIdleCallback) window.requestIdleCallback(restore, { timeout: 400 });
    else setTimeout(restore, 60);
  }

  function markMoving() {

    if (reduced) return;

    if (!cameraActive()) return;
    lastMove = Date.now();
    if (moveTimer === null) {
      board.classList.add("moving");

      document.documentElement.classList.add("board-moving-scene");
      moveTimer = setTimeout(settle, MOVE_SETTLE);
    }
  }

  var maxScroll = 0;

  function measure() {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  }

  function cameraActive() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--camera-active").trim() !== "0";
  }

  function progressNow() {
    var max = maxScroll;
    var p = max > 0 ? (window.scrollY / max) * (STOPS.length - 1) : 0;
    return Math.max(0, Math.min(STOPS.length - 1, p));
  }

  function framingFor(p) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    if (reduced) {

      var stop = STOPS[Math.round(p)];
      return { x: stop.x, y: stop.y, s: scaleFor(stop, vw, vh) };
    }

    var i = Math.min(Math.floor(p), STOPS.length - 2);
    var f = ease(p - i);
    var a = STOPS[i], b = STOPS[i + 1];

    return {
      x: lerp(a.x, b.x, f),
      y: lerp(a.y, b.y, f),

      s: Math.exp(lerp(Math.log(scaleFor(a, vw, vh)), Math.log(scaleFor(b, vw, vh)), f))
    };
  }

  var FAR_SCALE = 0.6;
  var isFar = null;

  var ZOOMED_RATIO = 1.5;
  var isZoomed = null;

  function setFar(s, vw, vh) {
    var far = s < FAR_SCALE;
    if (far !== isFar) {
      isFar = far;
      board.classList.toggle("far", far);
    }

    var whole = scaleFor(STOPS[0], vw, vh);
    var zoomed = whole > 0 && s > whole * ZOOMED_RATIO;
    if (zoomed !== isZoomed) {
      isZoomed = zoomed;
      document.documentElement.classList.toggle("board-zoomed", zoomed);
    }
  }

  function writeFraming(x, y, s) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    setFar(s, vw, vh);

    var BW = board.clientWidth || 3408;
    var BH = board.clientHeight || 2208;
    var visW = vw / s, visH = vh / s;

    var rim = parseFloat(getComputedStyle(board).borderLeftWidth) || 0;
    if (visW < BW) { x = Math.max(visW / 2 - rim, Math.min(BW + rim - visW / 2, x)); }
    else { x = BW / 2; }
    if (visH < BH) { y = Math.max(visH / 2 - rim, Math.min(BH + rim - visH / 2, y)); }
    else { y = BH / 2; }

    var edge = parseFloat(getComputedStyle(board).borderLeftWidth) || 0;
    var t =
      "translate(" + (vw / 2 - (x + edge) * s) + "px," +
                     (vh / 2 - (y + edge) * s) + "px) scale(" + s + ")";
    board.style.transform = t;
    if (floor) floor.style.transform = t;
  }

  function update() {
    if (!cameraActive()) {

      if (board.style.transform) board.style.transform = "";
      if (floor && floor.style.transform) floor.style.transform = "";
      return;
    }

    var f = framingFor(progressNow());
    writeFraming(f.x, f.y, f.s);
  }

  function frame() {
    ticking = false;

    markMoving();
    update();
  }

  function onScroll() {

    if (flying) return;
    markMoving();
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(frame);
    }
  }

  function onResize() {

    cancelFlight(false);
    measure();
    onScroll();
  }

  function onUserScrollIntent() { cancelFlight(true); }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", onUserScrollIntent, { passive: true });
  window.addEventListener("touchstart", onUserScrollIntent, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("load", function () {
    measure();
    update();

    setTimeout(function () {
      document.documentElement.classList.remove("warming");
    }, MOVE_SETTLE);
  });

  function applyMotion() {
    reduced = osReduced();

    if (reduced && moveTimer !== null) {

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

  var STOP_TARGET = {
    2: ".about-card",
    3: ".service-sticky",
    4: ".work-postcard",
    5: ".quote-card",
    6: ".contact-postcard"
  };

  var FLY_MS = 750;

  var FLY_EASE = "cubic-bezier(0.42, 0, 0.58, 1)";

  var FLY_EASE_IN = "cubic-bezier(0.42, 0, 0.58, 1)";
  var flying = false;
  var flyTimer = null;

  function setFlyTransition(on, ease) {
    var v = on ? "transform " + FLY_MS + "ms " + (ease || FLY_EASE) : "";
    board.style.transition = v;
    if (floor) floor.style.transition = v;
  }

  function landFlight() {
    if (!flying) return;
    flying = false;
    if (flyTimer !== null) { clearTimeout(flyTimer); flyTimer = null; }
    board.removeEventListener("transitionend", onFlyEnd);
    setFlyTransition(false);

    lastMove = Date.now();
    update();
  }

  function onFlyEnd(e) {

    if (e.target !== board || e.propertyName !== "transform") return;
    landFlight();
  }

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

  function goToStop(stop) {
    if (!cameraActive()) {

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

    if (reduced || FLY_MS <= 0) {
      cancelFlight(false);
      window.scrollTo({ top: target, behavior: "auto" });
      update();
      return;
    }

    var from = framingFor(progressNow());

    var to = framingFor(stop);

    cancelFlight(false);

    flying = true;

    setFlyTransition(false);
    writeFraming(from.x, from.y, from.s);

    window.scrollTo({ top: target, behavior: "auto" });

    void board.offsetWidth;

    markMoving();

    setFlyTransition(true, to.s > from.s ? FLY_EASE_IN : FLY_EASE);
    writeFraming(to.x, to.y, to.s);

    board.addEventListener("transitionend", onFlyEnd);

    flyTimer = setTimeout(landFlight, FLY_MS + 150);
  }

  document.querySelectorAll("[data-stop]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      goToStop(parseInt(link.getAttribute("data-stop"), 10));
    });
  });

  board.addEventListener("click", function (e) {
    if (e.target.closest("a[href], button, input, select, textarea, label, [tabindex]")) return;
    var paper = e.target.closest("[data-zone-stop]");
    if (!paper) return;
    goToStop(parseInt(paper.getAttribute("data-zone-stop"), 10));
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;

    var corkboard = document.getElementById("corkboard");
    if (!corkboard || getComputedStyle(corkboard).display === "none") return;
    if (e.target && e.target.closest && e.target.closest("input, textarea, select")) return;
    var menuBtn = document.querySelector(".board-menu-btn");
    if (menuBtn && menuBtn.getAttribute("aria-expanded") === "true") return;
    var welcomePanel = document.getElementById("welcome-panel");
    if (welcomePanel && welcomePanel.classList.contains("is-open")) return;
    goToStop(0);
  });

  measure();
  update();
})();
