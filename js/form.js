/* Submitting the contact form without leaving the board.

   This file is an ENHANCEMENT and nothing here is load bearing. The form
   already carries a real action and method (index.html, .cf), so with this
   script blocked, missing, or thrown mid-run the browser posts to Formspree
   itself and the visitor lands on Formspree's own confirmation page. That is
   a worse experience and a working one. Everything below exists to keep the
   visitor on the cork board instead.

   It also never runs on an invalid form. The browser does not fire "submit"
   at all when its own constraint validation fails, so js/validate.js has
   already had its say by the time anything here executes; there is no
   novalidate anywhere and no second copy of the rules. */
(function () {
  "use strict";

  /* Public by design and public on purpose: a Formspree form id is not a
     secret, it is the address of a mailbox that only accepts POSTs. It ships
     in the page rather than in an environment variable for exactly that
     reason. Changing where the form delivers is this one line. */
  var ENDPOINT = "https://formspree.io/f/xyegnvzd";
  var STUDIO_EMAIL = "caden@whittworkstudios.com";

  var form = document.querySelector(".contact-form form");
  if (!form) return;

  /* No fetch or no FormData means an old browser, and an old browser is
     exactly the case where the native POST above is the right answer. Stand
     down entirely rather than half-intercept the submission. */
  if (!window.fetch || !window.FormData) return;

  var status = document.getElementById("cf-status");
  var submitBtn = form.querySelector(".cf-submit");

  function show(text, isError) {
    if (!status) return;
    status.textContent = text;
    status.hidden = false;
    status.classList.toggle("cf-status-error", !!isError);
  }

  /* The failure path's whole job is to not lose what the visitor typed. They
     have already written a description of a project; telling them "try again
     later" and dropping it on the floor is the one outcome worth engineering
     against, so the fallback link opens their mail client with the message
     already in it. */
  function mailtoFallback(data) {
    var body = [
      "Name: " + (data.get("name") || ""),
      "Email: " + (data.get("email") || ""),
      "Phone: " + (data.get("phone") || ""),
      "How they found the studio: " + (data.get("heard-from") || ""),
      "",
      data.get("project") || ""
    ].join("\n");
    return "mailto:" + STUDIO_EMAIL +
      "?subject=" + encodeURIComponent("Project inquiry from the WhittWorks site") +
      "&body=" + encodeURIComponent(body);
  }

  function showFailure(data) {
    if (!status) return;
    status.textContent = "That did not send. ";
    var a = document.createElement("a");
    a.href = mailtoFallback(data);
    a.textContent = "Email it to me directly instead";
    /* The link carries the typed message, so it must be built AFTER the
       failure, from the values in hand, not wired up at load. */
    status.appendChild(a);
    status.appendChild(document.createTextNode("; your message is already in it."));
    status.hidden = false;
    status.classList.add("cf-status-error");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var data = new FormData(form);

    /* The honeypot. Formspree filters these server side too, but answering
       the bot with the same acknowledgement a person gets, and sending
       nothing, costs one request less and gives it nothing to learn from. */
    if ((data.get("_gotcha") || "").length) {
      form.hidden = true;
      show("Thank you. Your message is on its way.", false);
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
    }).catch(function () {
      /* One catch for both halves on purpose: a rejected fetch (offline, DNS,
         a blocked request) and a non-ok response are the same thing to the
         visitor, and the same thing to do about it. */
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send";
      }
      showFailure(data);
    });
  });
})();
