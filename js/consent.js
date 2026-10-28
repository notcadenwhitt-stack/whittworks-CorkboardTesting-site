(function () {
  "use strict";

  var KEY = "ww-analytics";
  var buttons = document.querySelectorAll("[data-consent]");
  var bars = document.querySelectorAll("[data-consent-bar]");
  var corkboard = document.getElementById("corkboard");

  var forced = false;

  var confirming = false;
  var choice = read();

  function read() {
    try {
      var value = localStorage.getItem(KEY);
      return value === "granted" || value === "denied" ? value : null;
    } catch (e) { return null; }
  }
  window.wwAnalyticsGranted = function () { return choice === "granted"; };

  function boardShowing() {
    return !!corkboard && getComputedStyle(corkboard).display !== "none";
  }

  function render() {
    buttons.forEach(function (button) {
      var chosen = button.getAttribute("data-consent") === choice;
      button.classList.toggle("is-chosen", chosen);
      button.setAttribute("aria-pressed", chosen ? "true" : "false");
    });
    var hide = !forced && !confirming && (!!choice || boardShowing());
    bars.forEach(function (bar) {
      bar.hidden = hide;
      var question = bar.querySelector("[data-cookie-question]");
      var done = bar.querySelector("[data-cookie-done]");
      if (question) question.hidden = confirming;
      if (done) done.hidden = !confirming;
    });
  }

  function confirm(bar, value) {
    var message = bar.querySelector("[data-cookie-message]");
    var done = bar.querySelector("[data-cookie-done]");
    if (!message || !done) return;
    message.textContent = (value === "granted" ? "You've accepted analytics cookies." :
      "You've rejected analytics cookies.") + " You can change your cookie settings at any time.";
    confirming = true;
    render();
    done.focus();
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-consent");
      if (value !== "granted" && value !== "denied") return;
      choice = value;
      try { localStorage.setItem(KEY, value); } catch (e) {}
      forced = false;
      var bar = button.closest("[data-consent-bar]");
      if (bar) confirm(bar, value);
      else render();
      window.dispatchEvent(new CustomEvent("ww-consent", { detail: { value: value } }));
    });
  });

  document.querySelectorAll("[data-cookie-hide]").forEach(function (button) {
    button.addEventListener("click", function () {
      confirming = false;
      forced = false;
      render();
    });
  });

  document.querySelectorAll("[data-consent-open]").forEach(function (button) {
    button.addEventListener("click", function () {
      forced = true;
      confirming = false;
      render();
      var first = bars.length && bars[0].querySelector("button");
      if (first) first.focus();
    });
  });

  window.addEventListener("resize", render);

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
