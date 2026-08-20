/* The welcome panel: an instruction sheet over the board, shown once on a
   visitor's first visit and reachable afterwards from the help button at
   the top right. Deliberately its own file, the same reasoning js/peek.js
   and js/menu.js already carry: small and separate, so a failure in
   board.js or hand.js -- which touch far more of the page and are far more
   likely to be the thing that breaks on a given change -- cannot also trap
   a visitor behind a dialog they cannot close, or strand a help button that
   never opens one.

   This file does not know what a camera stop is and does not need to. Its
   only job is opening, closing, focus, and the two small localStorage
   flags described below. */
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

  /* ==================================================================
     THE ANALYTICS CONSENT GATE
     ==================================================================
     Two buttons record a plain "granted" or "denied" under ww-analytics.
     analyticsGranted() is the ONE function a future analytics snippet is
     required to check before it does anything at all. Nothing beyond the
     gate itself is built here -- no snippet is installed, and none should
     be added by copying this comment. When one lands:

       1. It must call window.wwAnalyticsGranted() and do nothing at all
          if that returns false. Consent can also change mid-visit (the
          buttons below fire while the tab is open), so anything already
          loaded must be able to react to a later "No thanks" too, not
          only gate its own initial load.
       2. index.html's Content-Security-Policy currently reads
          connect-src https://formspree.io and script-src 'self'
          'unsafe-inline' -- Formspree only. The provider's origin has to
          be added to BOTH script-src (to load the snippet at all) and
          connect-src (for whatever it reports back) before anything will
          load; without that the CSP silently blocks it exactly the way it
          silently blocked the contact form's fetch before Phase 8 widened
          connect-src for Formspree. */
  var CONSENT_KEY = "ww-analytics";
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
    renderConsentStatus();
  }
  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  /* window-scoped because the snippet that needs it, when it exists, is a
     different script entirely and has no other way to reach this one. */
  window.wwAnalyticsGranted = function () { return getConsent() === "granted"; };

  /* THE POINT WHERE A FUTURE ANALYTICS SNIPPET GETS INITIALISED.
     if (window.wwAnalyticsGranted()) {
       // load it here, and only here. Nothing above this line loads
       // anything today -- see the long comment above this block. */

  /* The choice used to be reported as a sentence under the buttons. It now
     shows as shading ON the chosen button, which the owner asked for and
     which is also less to read: the answer lives on the control that set
     it rather than in a line of prose restating it.

     aria-pressed carries the same fact to a screen reader, and it is the
     right attribute rather than a visually-hidden status line, because
     these two buttons ARE a two-state choice and aria-pressed is how that
     is spelled. It also means the state is announced when a visitor tabs
     onto the button later, not only in the moment it changed -- which the
     old role="status" line could not do. */
  var consentBtns = panel.querySelectorAll(".welcome-consent-btn");
  function renderConsentStatus() {
    var v = getConsent();
    consentBtns.forEach(function (btn) {
      var on = v !== null && btn.getAttribute("data-consent") === v;
      btn.classList.toggle("is-chosen", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  consentBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setConsent(btn.getAttribute("data-consent"));
    });
  });

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
    renderConsentStatus();
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

  /* Render the current choice on load even when the panel itself is not
     about to open, so a returning visitor who reopens it later from the
     help button sees an accurate status the first time it appears rather
     than a blank line that only fills in after their next click. */
  renderConsentStatus();

  if (boardShowing() && !seenAlready()) {
    /* Marked the instant the panel is decided to be shown, not on close --
       a visitor who never explicitly dismisses it (closes the tab, clicks
       a link, whatever) has still been shown it once, which is all the
       brief asks for. */
    markSeen();
    open(null);
  }
})();
