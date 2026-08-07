/* Handwriting variance: no two letterforms render identically, but it all
   stays one hand. Seeded so every visit draws the same letters.
   Structure per element: one .jit wrapper (single flex/inline item), words
   as .wd spans (atomic, so lines break only at spaces), chars as .ch. */
(function () {
  "use strict";

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function fnv(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  var SELECTORS = ".sticky-title, .sticky-note, .polaroid figcaption, " +
    ".pc-caption, .pc-head, .pc-msg, .pc-msg-small, .email-link, .marker";

  var counter = 0;

  document.querySelectorAll(SELECTORS).forEach(function (el, ei) {
    if (el.dataset.jittered) return;

    var label = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!label) return;

    var cs = window.getComputedStyle(el);
    var fam = cs.fontFamily.toLowerCase();
    var isMarker = fam.indexOf("permanent") !== -1;
    var isCaveat = fam.indexOf("caveat") !== -1;
    if (!isMarker && !isCaveat) return;

    /* ink pressure band: bolder text swings around a heavier center */
    var bold = parseInt(cs.fontWeight, 10) >= 600;
    var base = bold ? 600 : 470;
    var span = 110;

    var seed = fnv(label) ^ Math.imul(ei + 1, 2654435761);

    /* screen readers get whole words, not letters */
    el.setAttribute("aria-label", label);
    el.querySelectorAll("a").forEach(function (a) {
      a.setAttribute("aria-label", (a.textContent || "").replace(/\s+/g, " ").trim());
    });

    function jitterChar(c, code) {
      var rnd = mulberry32(seed + code * 131 + (counter++) * 7919);
      var s = document.createElement("span");
      s.className = "ch";
      s.setAttribute("aria-hidden", "true");
      s.textContent = c;
      s.style.setProperty("--r", ((rnd() * 2 - 1) * 2.05).toFixed(2) + "deg");
      s.style.setProperty("--y", ((rnd() * 2 - 1) * 0.05).toFixed(3) + "em");
      s.style.setProperty("--s", (0.968 + rnd() * 0.064).toFixed(3));
      if (isCaveat) {
        s.style.setProperty("--w", String(Math.round(base - span / 2 + rnd() * span)));
      } else {
        /* one marker stroke never lays down evenly: some glyphs go down dry.
           same rnd() call count, so the seeded layout is unchanged. */
        s.style.setProperty("--o", (0.93 + rnd() * 0.07).toFixed(3));
      }
      return s;
    }

    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var txt = ch.nodeValue;
          var frag = document.createDocumentFragment();
          var wd = null;
          for (var i = 0; i < txt.length; i++) {
            var c = txt.charAt(i);
            if (/\s/.test(c)) {
              wd = null;
              frag.appendChild(document.createTextNode(c));
              continue;
            }
            if (!wd) {
              wd = document.createElement("span");
              wd.className = "wd";
              wd.setAttribute("aria-hidden", "true");
              frag.appendChild(wd);
            }
            wd.appendChild(jitterChar(c, txt.charCodeAt(i)));
          }
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && !/^(svg|img|br)$/i.test(ch.tagName)) {
          wrap(ch);
        }
      });
    })(el);

    /* one wrapper so flex/grid parents see a single item and keep spaces */
    var jit = document.createElement("span");
    jit.className = "jit";
    jit.setAttribute("aria-hidden", "true");
    while (el.firstChild) jit.appendChild(el.firstChild);
    el.appendChild(jit);

    el.dataset.jittered = "1";
  });

  /* Readiness signal for the loading overlay: the lettering has been walked.
     Set last, so a throw partway through leaves it unset and the overlay
     treats it as the hard failure it is rather than revealing half-jittered
     handwriting. */
  try {
    window.__wwHandReady = true;
    document.dispatchEvent(new CustomEvent("ww:hand-ready"));
  } catch (e) { window.__wwHandReady = true; }
})();
