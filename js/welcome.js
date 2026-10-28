/* The board welcome panel: open, close, focus and remember a visit. */
(function () {
  "use strict";

  var backdrop = document.getElementById("welcome-backdrop");
  var panel = document.getElementById("welcome-panel");
  if (!backdrop || !panel) return;

  var closeBtn = panel.querySelector(".welcome-close");
  var helpBtn = document.querySelector(".board-help-btn");
  var corkboard = document.getElementById("corkboard");

  function boardShowing() {
    return !!corkboard && getComputedStyle(corkboard).display !== "none";
  }

  var SEEN_KEY = "ww-welcome-seen";
  function markSeen() {
    try { localStorage.setItem(SEEN_KEY, "1"); } catch (e) {}
  }
  function seenAlready() {
    try { return localStorage.getItem(SEEN_KEY) === "1"; } catch (e) { return false; }
  }

  var focusables = [];
  var opener = null;

  function refreshFocusables() {
    focusables = Array.prototype.slice.call(
      panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    );
  }

  function open(fromOpener) {
    opener = fromOpener || null;
    backdrop.classList.add("is-open");
    panel.classList.add("is-open");
    refreshFocusables();
    document.addEventListener("keydown", onKeydown);
    if (focusables.length) focusables[0].focus();
    else panel.focus();
  }

  function close() {
    if (!isOpen()) return;
    backdrop.classList.remove("is-open");
    panel.classList.remove("is-open");
    document.removeEventListener("keydown", onKeydown);
    if (opener && typeof opener.focus === "function") opener.focus();
    opener = null;
  }

  function isOpen() { return panel.classList.contains("is-open"); }

  function onKeydown(e) {
    if (e.key === "Escape" || e.keyCode === 27) {
      close();
      return;
    }
    if (e.key !== "Tab") return;
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  }

  if (closeBtn) closeBtn.addEventListener("click", function () { close(); });
  if (helpBtn) helpBtn.addEventListener("click", function () { open(helpBtn); });
  backdrop.addEventListener("click", function () { close(); });


  if (boardShowing() && !seenAlready()) {
    markSeen();
    open(null);
  }
})();
