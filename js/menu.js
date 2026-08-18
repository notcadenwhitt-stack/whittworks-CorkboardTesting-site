/* The kebab dropdown at the top right of the board. Deliberately its own
   file, the same reasoning as js/peek.js: this has to keep working even if
   board.js or hand.js throws partway through, because those two touch far
   more of the page and are far more likely to be the thing that breaks on
   a given change. Two independent failures should not be able to trap a
   visitor behind a menu they cannot close, or strand a button that never
   opens one.

   The links inside the dropdown are plain a[data-stop] elements and
   js/board.js is what actually moves the camera when one is clicked; this
   file only ever opens, closes, and manages focus. It does not know what a
   "stop" is and does not need to. */
(function () {
  "use strict";

  var btn = document.querySelector(".board-menu-btn");
  var menu = document.getElementById("board-menu");
  if (!btn || !menu) return;

  var links = menu.querySelectorAll("a");
  if (!links.length) return;

  function isOpen() { return menu.classList.contains("is-open"); }

  function open() {
    menu.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("click", onOutsideClick, true);
    /* Land the visitor on the first entry, the same "move focus now, in
       this synchronous turn" reasoning js/peek.js already relies on: wait
       a frame and there is no guarantee anything is still there to focus. */
    links[0].focus();
  }

  function close(returnFocus) {
    menu.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("click", onOutsideClick, true);
    if (returnFocus) btn.focus();
  }

  btn.addEventListener("click", function () {
    if (isOpen()) close(true);
    else open();
  });

  /* Chosen entries close the menu themselves instead of waiting on the
     outside-click handler, so the visitor sees the camera move rather than
     a dropdown sitting on top of it. board.js's own click handler on these
     same links is what actually drives the camera; this one only tidies
     the menu up and runs whether or not the camera is active. */
  links.forEach(function (link) {
    link.addEventListener("click", function () { close(false); });
  });

  function onKeydown(e) {
    if (e.key === "Escape" || e.keyCode === 27) {
      close(true);
      return;
    }
    if (e.key !== "Tab") return;

    /* Trap Tab inside the open menu: last entry forward wraps to the
       first, first entry backward wraps to the last. Anything else (Tab
       from a middle entry) is left alone to move normally. */
    var first = links[0];
    var last = links[links.length - 1];
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  }

  /* Registered from open(), not once up front, and that timing is what
     makes this safe: a listener added while an event is already dispatching
     is not invoked for that same event, so the click on the button that
     just called open() cannot immediately turn around and close what it
     opened. */
  function onOutsideClick(e) {
    if (menu.contains(e.target) || btn.contains(e.target)) return;
    close(false);
  }
})();
