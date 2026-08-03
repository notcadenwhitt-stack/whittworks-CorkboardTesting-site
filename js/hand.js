/* Handwriting variance: no two letterforms render identically, but it all
   stays one hand. Seeded so every visit draws the same letters. */
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

    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var txt = ch.nodeValue;
          var frag = document.createDocumentFragment();
          for (var i = 0; i < txt.length; i++) {
            var c = txt.charAt(i);
            if (/\s/.test(c)) { frag.appendChild(document.createTextNode(c)); continue; }
            var rnd = mulberry32(seed + txt.charCodeAt(i) * 131 + (counter++) * 7919);
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
              s.style.setProperty("--o", (0.86 + rnd() * 0.14).toFixed(3));
            }
            frag.appendChild(s);
          }
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && !/^(svg|img|br)$/i.test(ch.tagName)) {
          wrap(ch);
        }
      });
    })(el);

    el.dataset.jittered = "1";
  });
})();
