/* The welcome panel: an instruction sheet over the board, shown once on a
   visitor's first visit and reachable afterwards from the help button at
   the top right. Deliberately its own file, the same reasoning js/peek.js
   and js/menu.js already carry: small and separate, so a failure in
   board.js or hand.js -- which touch far more of the page and are far more
   likely to be the thing that breaks on a given change -- cannot also trap
   a visitor behind a dialog they cannot close, or strand a help button that
   never opens one.

   This file does not know what a camera stop is and does not need to. Its
   only job is opening, closing, focus, and the one small localStorage
   flag described below. */
(function () {
  "use strict";

  var backdrop = document.getElementById("welcome-backdrop");
  var panel = document.getElementById("welcome-panel");
  if (!backdrop || !panel) return;

  var closeBtn = panel.querySelector(".welcome-close");
  var helpBtn = document.querySelector(".board-help-btn");
  var corkboard = document.getElementById("corkboard");

  /* ==================================================================
     BOARD-ONLY, READ FROM THE COMPUTED STYLE RATHER THAN GUESSED AT
     ==================================================================
     #corkboard is display:none below 901px, and without a working camera,
     by css/style.css's own "WHICH DESIGN IS ON SCREEN" rules -- the panel
     and its backdrop are both descendants of #corkboard in the markup, so
     a hidden ancestor already keeps them off screen there for free.

     What that gate does NOT do on its own is stop this script from
     marking the panel "seen" on a visit where nobody could have actually
     seen it. If the auto-open below fired unconditionally, a visitor on a
     phone would have the localStorage flag written on page load, and the
     SAME visitor widening that window to desktop later, or opening the
     board in a real browser after a narrow first look, would silently
     never get the explanation at all. Reading the ancestor's own computed
     display, rather than re-deriving "is the board showing" from width or
     from board-live a second time, means this can never disagree with the
     one rule that actually decides it. */
  function boardShowing() {
    return !!corkboard && getComputedStyle(corkboard).display !== "none";
  }

  /* ==================================================================
     FIRST VISIT ONLY, REMEMBERED IN localStorage
     ==================================================================
     sessionStorage (which js/peek.js uses for the editorial/board choice)
     is wrong here: that choice belongs to one visit, this one is meant to
     stick across visits, which is what the brief means by "remembered so
     returning visitors go straight to the board." localStorage is that,
     and every access is wrapped in try/catch for the identical reason
     js/peek.js's own KEY functions are -- Safari in private mode throws on
     access, and a storage failure must not cost the panel. Failing OPEN
     (treat an unreadable flag as "not seen yet") rather than failing shut
     is the deliberate choice: worst case with storage broken is the panel
     offers its explanation more than once, not that a first-time visitor
     who needed it silently never gets it. */
  var SEEN_KEY = "ww-welcome-seen";
  function markSeen() {
    try { localStorage.setItem(SEEN_KEY, "1"); } catch (e) {}
  }
  function seenAlready() {
    try { return localStorage.getItem(SEEN_KEY) === "1"; } catch (e) { return false; }
  }

  /* The analytics consent choice used to live here. It moved to
     js/consent.js on 2026-10-28, because the phone design never shows this
     panel and needs to ask the same question from its own consent bar. */

  /* ==================================================================
     OPEN, CLOSE, FOCUS
     ==================================================================
     Modeled on js/menu.js's open()/close(), which already solves the same
     three problems for the kebab dropdown: land focus inside the thing
     that just opened, trap Tab while it is open, and give focus back to
     whatever asked for it to open in the first place. */
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
    /* Synchronous, in this same turn, not from a frame callback -- the
       same "move focus NOW" reasoning js/peek.js's set() documents at
       length: whatever the visitor's browser would otherwise do with
       focus on an element that just changed visibility is not what a
       keyboard or screen reader visitor needs here. */
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

  /* Escape closes the panel. js/board.js's own Escape handler is
     registered earlier (a classic script, further up the document, runs
     before this deferred one ever does) and would otherwise fire first on
     every keypress for the rest of the page's life -- stopPropagation
     from here cannot reach backward in time to stop something that has
     already run. So js/board.js checks THIS panel's own .is-open class
     directly instead of relying on an event order this file cannot
     guarantee; see the comment beside that check for the full reasoning.
     This handler only has to close the panel, not also worry about the
     camera. */
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
  /* A click on the dimmed backdrop closes it too, the same courtesy every
     other overlay on this page already gives (js/menu.js's own outside-
     click handler for the kebab dropdown). The backdrop is a sibling of
     the panel, not an ancestor, so there is no bubbling concern here the
     way there was for js/menu.js's capture-phase listener on document. */
  backdrop.addEventListener("click", function () { close(); });

  if (boardShowing() && !seenAlready()) {
    /* Marked the instant the panel is decided to be shown, not on close --
       a visitor who never explicitly dismisses it (closes the tab, clicks
       a link, whatever) has still been shown it once, which is all the
       brief asks for. */
    markSeen();
    open(null);
  }
})();
