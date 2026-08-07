/* The sticky note in the corner: swap between the editorial site and the
   cork board. Deliberately its own file, and deliberately tiny.

   It is NOT part of board.js. board.js is the camera, it is 300 lines, and it
   stands down entirely when there is no stage to point at — no stylesheet, or
   a viewport too narrow to frame anything. This has to keep working in exactly
   those conditions, because the narrow viewport IS the case where somebody
   needs a way onto the board. Two jobs, two files, neither able to break the
   other. It also means the toggle survives board.js failing to parse. */
(function () {
  "use strict";

  var root = document.documentElement;
  var peek = document.querySelector(".board-peek");
  var exit = document.querySelector(".board-exit");
  if (!peek && !exit) return;

  /* The board is a different enough experience that landing back on the
     editorial after a reload, having chosen the board, would read as the site
     losing the visitor's place. sessionStorage and not localStorage: the
     choice belongs to this visit. Wrapped because Safari in private mode
     throws on access, and a storage failure must not cost the button. */
  var KEY = "ww-board-open";
  function remember(open) {
    try { open ? sessionStorage.setItem(KEY, "1") : sessionStorage.removeItem(KEY); }
    catch (e) {}
  }
  function remembered() {
    try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }

  /* board-shut is a real class, not the absence of board-open, because above
     900px the board is the default and "closed" has to be able to say so. */
  function set(open, focusBack) {
    root.classList.toggle("board-open", open);
    root.classList.toggle("board-shut", !open);
    remember(open);

    /* The two designs are different documents' worth of layout. Whichever one
       just appeared starts at the top, or the visitor arrives halfway down a
       page they have not seen. */
    window.scrollTo(0, 0);

    /* Moving focus is the part that is easy to skip and the part a keyboard or
       screen reader visitor actually needs: the control they just pressed has
       gone display:none, and focus would otherwise fall back to <body> with no
       announcement that anything happened. */
    /* Move focus NOW, in this same synchronous turn, not from a frame callback.

       The control that was just pressed has become display:none on the line
       above, and the browser answers that by resetting focus to <body> itself.
       Racing that reset from requestAnimationFrame does not work: traced with a
       focusin/focusout log, the sequence read focusout(board-peek) -> BODY and
       the queued callback never landed a focus at all, through one frame and
       through two. Doing it synchronously means focus is already on the new
       control before the reset has anything to reclaim.

       getClientRects() does double duty: it forces the pending style and layout
       from the class change to flush, so the target really is laid out by the
       time focus() is called, AND it is the correct visibility test. Not
       offsetParent — both controls are position: fixed, and a fixed element's
       offsetParent is null whether it is on screen or not, so that check calls
       every visible button hidden. An empty rect list means genuinely absent. */
    var target = focusBack ? peek : exit;
    if (target && target.getClientRects().length) target.focus();

    /* board.js caches maxScroll and only re-measures on load and resize.
       Revealing 1300vh of runway is neither, so tell it the page changed
       shape or the camera maps the whole board onto a stale scroll height. */
    window.dispatchEvent(new Event("resize"));
  }

  if (peek) peek.addEventListener("click", function () { set(true, false); });
  if (exit) exit.addEventListener("click", function () { set(false, true); });

  /* Escape closes it, the way it closes anything else that took over the
     screen. Only below 900px: above that the board is the site, and there is
     nothing to escape to. */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" && e.keyCode !== 27) return;
    if (!root.classList.contains("board-open")) return;
    if (window.matchMedia && !window.matchMedia("(max-width: 900px)").matches) return;
    set(false, true);
  });

  if (remembered()) set(true, false);

  /* ==================================================================
     IS THERE ACTUALLY A CAMERA BACK THERE?
     ==================================================================
     board.js sets board-live once it has passed its own guards, and the
     stylesheet requires that class before it will show the cork board. This
     file is loaded BEFORE board.js, so at this point in execution the class is
     legitimately not set yet and its absence proves nothing.

     DOMContentLoaded is the signal, and setTimeout(0) is NOT — that was tried
     and it is wrong. Classic scripts execute in document order, but the parser
     still has to FETCH board.js after running this file, and the event loop
     services timers during that wait. So a zero-delay timer fires in the gap
     between the two scripts and reports a perfectly healthy board as dead.
     Measured: it set no-board on every clean load. DOMContentLoaded cannot
     fire until the parser has finished, which means every classic script in
     the document has already run.

     The fast path costs nothing: on a healthy load the class is already there
     and this does nothing at all. Only a broken deploy pays, and what it pays
     is falling back to the editorial design, which is the whole point.
     ================================================================== */
  function auditCamera() {
    if (root.classList.contains("board-live")) return;
    root.classList.add("no-board");
    root.classList.remove("board-open");
    root.classList.add("board-shut");
    remember(false);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", auditCamera);
  } else {
    auditCamera();
  }
})();
