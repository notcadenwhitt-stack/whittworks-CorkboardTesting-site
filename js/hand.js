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
    ".pc-caption, .pc-head, .pc-msg, .pc-msg-small, .email-link, " +
    ".pencil-note";

  var counter = 0;

  document.querySelectorAll(SELECTORS).forEach(function (el, ei) {
    if (el.dataset.jittered) return;

    var seedText = (el.textContent || "").replace(/\s+/g, " ").trim();
    var label = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    if (!seedText) return;

    var cs = window.getComputedStyle(el);
    var fam = cs.fontFamily.toLowerCase();

    if (fam.indexOf("caveat") === -1) return;

    var bold = parseInt(cs.fontWeight, 10) >= 600;
    var base = bold ? 600 : 470;
    var span = 110;

    var seed = fnv(seedText) ^ Math.imul(ei + 1, 2654435761);

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
      s.style.setProperty("--w", String(Math.round(base - span / 2 + rnd() * span)));
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

    var jit = document.createElement("span");
    jit.className = "jit";

    if (!el.querySelector("a[href], button, input, select, textarea, [tabindex]")) {
      jit.setAttribute("aria-hidden", "true");
    }
    while (el.firstChild) jit.appendChild(el.firstChild);
    el.appendChild(jit);

    el.dataset.jittered = "1";
  });
})();
