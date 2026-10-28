/* Sends the contact forms to Formspree without leaving the page.

   Pure enhancement: each form's own action and method still post natively
   if this script is blocked, missing or throws, and it stands down entirely
   where fetch or FormData is absent. It cannot run on an invalid form,
   because the browser does not fire submit when its own constraint
   validation fails (js/validate.js only dresses those errors up).

   There are two copies of the form since 2026-10-28, the board's and the
   phone page's, so everything is scoped per form[data-cf]: each one names
   its own status line in data-status, which sits OUTSIDE the form because
   success hides the form and a status inside it would vanish with it.

   Accept: application/json keeps the visitor here instead of landing on
   Formspree's confirmation page. connect-src in index.html's CSP must list
   formspree.io or the fetch dies silently. */
(function () {
  "use strict";

  var ENDPOINT = "https://formspree.io/f/xyegnvzd";
  var STUDIO_EMAIL = "caden@whittworkstudios.com";

  document.querySelectorAll("form[data-cf]").forEach(function (form, index) {
    var identity = form.id || "form-" + index;
    var started = false;
    function report(ok) {
      window.dispatchEvent(new CustomEvent("ww-form", { detail: { form: identity, ok: ok } }));
    }
    form.addEventListener("input", function () {
      if (started) return;
      started = true;
      window.dispatchEvent(new CustomEvent("ww-form-start", { detail: { form: identity } }));
    });
    form.addEventListener("invalid", function (e) {
      if (e.target === form.querySelector(":invalid")) report(false);
    }, true);

    if (!window.fetch || !window.FormData) return;

    var status = document.getElementById(form.getAttribute("data-status"));
    var submitBtn = form.querySelector(".cf-submit");

    /* The status line stays rendered and only its text changes: a live
       region that appears in the same turn as its content is skipped by
       many screen reader and browser pairs. */
    if (status) status.hidden = false;
    function show(text, isError) {
      if (!status) return;
      status.textContent = text;
      status.classList.toggle("cf-status-error", !!isError);
    }
    /* After success the form is hidden while focus sits on Send, which
       would drop focus to the top of the page. It goes to the message. */
    function settleFocus() {
      if (!status) return;
      status.setAttribute("tabindex", "-1");
      status.focus();
    }

    function mailtoFallback(data) {
      var prefix = [
        "Name: " + (data.get("name") || ""),
        "Email: " + (data.get("email") || ""),
        "Phone: " + (data.get("phone") || ""),
        "How they found the studio: " + (data.get("heard-from") || ""),
        "",
        ""
      ].join("\n");
      var project = String(data.get("project") || "");
      var suffix = " [truncated]";
      var body = prefix + project;
      if (body.length > 1800) {
        prefix = prefix.slice(0, 1800 - suffix.length);
        body = (prefix + project.slice(0, 1800 - prefix.length - suffix.length))
          .replace(/[\uD800-\uDBFF]$/, "") + suffix;
      }
      return "mailto:" + STUDIO_EMAIL +
        "?subject=" + encodeURIComponent("Project inquiry from the WhittWorks site") +
        "&body=" + encodeURIComponent(body);
    }

    function showFailure(data) {
      if (!status) return;
      status.textContent = "That did not send. ";
      var a = document.createElement("a");
      a.setAttribute("href", mailtoFallback(data));
      a.textContent = "Email it to me directly instead";
      status.appendChild(a);
      status.appendChild(document.createTextNode("; your message is already in it."));
      status.classList.add("cf-status-error");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var data = new FormData(form);
      /* The _gotcha honeypot is sent, not short-circuited here. Formspree
         drops a submission with it filled, and some password managers fill
         hidden fields anyway, so judging it client-side could thank a real
         visitor while silently discarding their message. */

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending";
      }
      show("Sending your message.", false);

      /* A stalled connection used to leave Send disabled on "Sending"
         forever. After 15 seconds it falls through to the same failure path,
         which keeps everything typed and offers the mailto fallback. */
      var controller = window.AbortController ? new AbortController() : null;
      var timeout = controller ? setTimeout(function () { controller.abort(); }, 15000) : null;

      fetch(ENDPOINT, {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" },
        signal: controller ? controller.signal : undefined
      }).then(function (res) {
        clearTimeout(timeout);
        if (!res.ok) throw new Error("Formspree returned " + res.status);
        form.hidden = true;
        show("Thank you. Your message is on its way, and I will reply to the email address you gave.", false);
        settleFocus();
        report(true);
      }).catch(function () {
        clearTimeout(timeout);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send";
        }
        showFailure(data);
        report(false);
      });
    });
  });
})();
