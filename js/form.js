/* Each contact form keeps its own status and submission state. */
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

    function show(text, isError) {
      if (!status) return;
      status.textContent = text;
      status.hidden = false;
      status.classList.toggle("cf-status-error", !!isError);
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
      status.hidden = false;
      status.classList.add("cf-status-error");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var data = new FormData(form);

      if ((data.get("_gotcha") || "").length) {
        form.hidden = true;
        show("Thank you. Your message is on its way.", false);
        report(true);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending";
      }
      show("Sending your message.", false);

      fetch(ENDPOINT, {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" }
      }).then(function (res) {
        if (!res.ok) throw new Error("Formspree returned " + res.status);
        form.hidden = true;
        show("Thank you. Your message is on its way, and I will reply to the email address you gave.", false);
        report(true);
      }).catch(function () {
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
