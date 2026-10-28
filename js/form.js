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
      if (e.target !== form.querySelector(":invalid")) return;
      window.dispatchEvent(new CustomEvent("ww-form-invalid", { detail: { form: identity } }));
    }, true);

    if (!window.fetch || !window.FormData) return;

    var status = document.getElementById(form.getAttribute("data-status"));
    var submitBtn = form.querySelector(".cf-submit");

    if (status) status.hidden = false;
    function show(text, isError) {
      if (!status) return;
      status.textContent = text;
      status.classList.toggle("cf-status-error", !!isError);
    }

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

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending";
      }
      show("Sending your message.", false);

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
