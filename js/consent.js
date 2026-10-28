/* The analytics consent choice, shared by every control on both designs.

   Moved out of js/welcome.js on 2026-10-28. The board asks in its welcome
   panel, but that panel lives inside #corkboard, which is display:none on a
   phone, so a phone visitor could never answer and analytics could never
   load for most of the audience. This file owns the stored answer and binds
   every [data-consent] button on the page (the panel's two and the phone
   consent bar's two), so both designs read and write the same choice.

   js/analytics.js is the only consumer. It calls window.wwAnalyticsGranted()
   before sending anything, and listens for "ww-consent" so a mid-visit Deny
   stops it at once. Loaded before both welcome.js and analytics.js. */
(function () {
  "use strict";

  var KEY = "ww-analytics";
  var buttons = document.querySelectorAll("[data-consent]");
  var bars = document.querySelectorAll("[data-consent-bar]");
  var corkboard = document.getElementById("corkboard");
  /* Set by a footer "Cookie settings" press: shows the bar even when a
     choice is already stored, so a visitor can change their mind. */
  var forced = false;
  var choice = read();

  /* Every storage access is wrapped: Safari in private mode throws on
     access, and a storage failure must leave analytics OFF, never on. */
  function read() {
    try {
      var value = localStorage.getItem(KEY);
      return value === "granted" || value === "denied" ? value : null;
    } catch (e) { return null; }
  }
  window.wwAnalyticsGranted = function () { return choice === "granted"; };

  /* Same test js/welcome.js uses: read #corkboard's computed display instead
     of re-deriving "is the board on screen" from classes. board-live is set
     on phones too (board.js runs everywhere and stands its camera down), so
     reading that class here hid the bar from exactly the visitors it is for. */
  function boardShowing() {
    return !!corkboard && getComputedStyle(corkboard).display !== "none";
  }

  function render() {
    buttons.forEach(function (button) {
      var chosen = button.getAttribute("data-consent") === choice;
      button.classList.toggle("is-chosen", chosen);
      button.setAttribute("aria-pressed", chosen ? "true" : "false");
    });
    var hide = !forced && (!!choice || boardShowing());
    bars.forEach(function (bar) {
      bar.hidden = hide;
    });
  }

  /* A choice closes the banner straight away (the owner's call, 2026-10-28).
     Focus moves to the page title rather than being dropped on <body>, so a
     keyboard or screen reader visitor is not left nowhere. */
  function close() {
    forced = false;
    render();
    var title = document.querySelector(".wordmark");
    if (title) {
      title.setAttribute("tabindex", "-1");
      try { title.focus({ preventScroll: true }); } catch (e) { title.focus(); }
    }
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-consent");
      if (value !== "granted" && value !== "denied") return;
      choice = value;
      try { localStorage.setItem(KEY, value); } catch (e) {}
      forced = false;
      if (button.closest("[data-consent-bar]")) close();
      else render();
      window.dispatchEvent(new CustomEvent("ww-consent", { detail: { value: value } }));
    });
  });

  document.querySelectorAll("[data-consent-open]").forEach(function (button) {
    button.addEventListener("click", function () {
      forced = true;
      render();
      var first = bars.length && bars[0].querySelector("button");
      if (first) first.focus();
    });
  });

  /* A window can cross the 901px breakpoint, and the sticky note can swap
     designs, without a reload; both change whether the bar belongs on
     screen. A choice made in another tab is honoured here too. */
  window.addEventListener("resize", render);
  /* Only the classes that can swap the design matter. board.js toggles other
     classes on <html> at the start and end of every camera move, and a style
     read on each of those would sit on the zoom's frame budget. */
  var DESIGN_CLASSES = /\b(board-open|board-shut|no-board|board-first|board-live)\b/g;
  function designKey(cls) { return (String(cls || "").match(DESIGN_CLASSES) || []).sort().join(" "); }
  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      if (designKey(records[i].oldValue) !== designKey(document.documentElement.className)) {
        render();
        return;
      }
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"], attributeOldValue: true });
  window.addEventListener("storage", function (e) {
    if (e.key !== KEY && e.key !== null) return;
    choice = read();
    forced = false;
    render();
    window.dispatchEvent(new CustomEvent("ww-consent", { detail: { value: choice } }));
  });

  render();
})();
