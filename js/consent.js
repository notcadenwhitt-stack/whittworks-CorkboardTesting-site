/* One consent choice, shared by every control on either design. */
(function () {
  "use strict";

  var KEY = "ww-analytics";
  var root = document.documentElement;
  var buttons = document.querySelectorAll("[data-consent]");
  var bars = document.querySelectorAll("[data-consent-bar]");
  var forced = false;
  var choice = read();

  function read() {
    try {
      var value = localStorage.getItem(KEY);
      return value === "granted" || value === "denied" ? value : null;
    } catch (e) { return null; }
  }
  window.wwAnalyticsGranted = function () { return choice === "granted"; };

  function render() {
    buttons.forEach(function (button) {
      var chosen = button.getAttribute("data-consent") === choice;
      button.classList.toggle("is-chosen", chosen);
      button.setAttribute("aria-pressed", chosen ? "true" : "false");
    });
    var editorial = !root.classList.contains("board-live") || root.classList.contains("no-board");
    bars.forEach(function (bar) {
      bar.hidden = !forced && (!!choice || !editorial || root.classList.contains("board-open"));
    });
  }
  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-consent");
      if (value !== "granted" && value !== "denied") return;
      choice = value;
      try { localStorage.setItem(KEY, value); } catch (e) {}
      forced = false;
      render();
      window.dispatchEvent(new CustomEvent("ww-consent", { detail: { value: value } }));
    });
  });
  document.querySelectorAll("[data-consent-open]").forEach(function (button) {
    button.addEventListener("click", function () {
      forced = true;
      render();
      if (!bars.length) return;
      var first = bars[0].querySelector("button");
      if (first) first.focus();
    });
  });
  window.addEventListener("resize", render);
  window.addEventListener("storage", function (e) {
    if (e.key !== KEY && e.key !== null) return;
    choice = read();
    forced = false;
    render();
    window.dispatchEvent(new CustomEvent("ww-consent", { detail: { value: choice } }));
  });
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ["class"] });
  render();
})();
