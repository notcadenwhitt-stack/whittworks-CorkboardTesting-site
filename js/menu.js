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

  links.forEach(function (link) {
    link.addEventListener("click", function () { close(false); });
  });

  function onKeydown(e) {
    if (e.key === "Escape" || e.keyCode === 27) {
      close(true);
      return;
    }
    if (e.key !== "Tab") return;

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

  function onOutsideClick(e) {
    if (menu.contains(e.target) || btn.contains(e.target)) return;
    close(false);
  }
})();
