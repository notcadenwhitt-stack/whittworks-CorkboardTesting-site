/* Cork board camera: scroll drives zoom stops across the board. */
(function () {
  "use strict";

  var board = document.getElementById("board");
  var stringsSvg = document.getElementById("strings");
  var hint = document.querySelector(".scroll-hint");

  /* Camera stops: board-space center (x, y) and the span to fit (w, h). */
  var STOPS = [
    { x: 1800, y: 1200, w: 3860, h: 2620 },  /* 0 whole board */
    { x: 1800, y: 1045, w: 1080, h: 740 },   /* 1 title card */
    { x: 890,  y: 800,  w: 1520, h: 1060 },  /* 2 about + polaroid */
    { x: 2745, y: 720,  w: 1320, h: 1000 },  /* 3 services cluster */
    { x: 2660, y: 1560, w: 1420, h: 1060 },  /* 4 work photo */
    { x: 1850, y: 1980, w: 1420, h: 880 },   /* 5 testimonial + chad */
    { x: 660,  y: 1770, w: 1040, h: 820 },   /* 6 contact card */
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

  function update() {
    ticking = false;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var doc = document.documentElement;
    var max = doc.scrollHeight - vh;
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

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  /* Nav links jump the camera to a stop. */
  document.querySelectorAll(".deskbar a[data-stop]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var stop = parseInt(link.getAttribute("data-stop"), 10);
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: (stop / (STOPS.length - 1)) * max,
        behavior: "smooth"
      });
    });
  });

  update();
})();
