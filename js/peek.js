(function () {
  "use strict";

  var root = document.documentElement;
  var peek = document.querySelector(".board-peek");
  var exit = document.querySelector(".board-exit");
  if (!peek && !exit) return;

  var KEY = "ww-board-open";
  function remember(open) {
    try { open ? sessionStorage.setItem(KEY, "1") : sessionStorage.removeItem(KEY); }
    catch (e) {}
  }
  function remembered() {
    try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }

  function set(open, focusBack) {
    root.classList.toggle("board-open", open);
    root.classList.toggle("board-shut", !open);
    remember(open);

    window.scrollTo(0, 0);

    var target = focusBack ? peek : exit;
    if (target && target.getClientRects().length) target.focus();

    window.dispatchEvent(new Event("resize"));
  }

  if (peek) peek.addEventListener("click", function () { set(true, false); });
  if (exit) exit.addEventListener("click", function () { set(false, true); });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" && e.keyCode !== 27) return;
    if (!root.classList.contains("board-open")) return;
    if (window.matchMedia && !window.matchMedia("(max-width: 900px)").matches) return;
    set(false, true);
  });

  if (remembered()) set(true, false);

  function auditCamera() {
    if (root.classList.contains("board-live")) return;
    root.classList.add("no-board");

    root.classList.remove("board-first");
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
