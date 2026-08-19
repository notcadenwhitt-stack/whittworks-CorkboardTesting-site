/* Contact form validation: custom messages layered ON TOP of native
   constraint validation, never in place of it.

   The form (index.html, .contact-form) carries no novalidate, and every
   constraint it enforces (required, type="email", minlength="20" on the
   project field) is a plain HTML attribute. That is deliberate and it is
   the whole answer to "the no-JS path must work": with this file blocked,
   missing, or thrown mid-run, the browser's own pre-submit validation still
   runs on its own, still refuses to submit, and still moves focus to the
   first offending field with its own native bubble. Nothing here is load
   bearing for that.

   What this file adds only matters once a script IS running: it swaps the
   browser's bubble for an inline message written in the sheet's own hand,
   associated to its field the accessible way (aria-describedby, plus
   aria-invalid on the field itself), and it is riding the "invalid" event
   every field already fires during that same native pre-submit check, not
   a "submit" handler paired with novalidate, which is the more common
   version of this pattern and the wrong one for a public contact form: it
   would drop native enforcement completely the instant the script failed to
   run, which is exactly the moment this form most needs it. */
(function () {
  "use strict";

  var form = document.querySelector(".contact-form form");
  if (!form) return;

  function messageFor(field) {
    var v = field.validity;
    if (v.valueMissing) return "This field is required.";
    if (v.typeMismatch) return "Enter a valid email address.";
    if (v.tooShort) return "Say a little more: at least 20 characters.";
    return field.validationMessage || "Please check this field.";
  }

  /* "invalid" does not bubble, so this has to be capture-phase to catch it
     at the form level instead of adding a listener per field. The browser
     fires one of these for every offending control before it cancels the
     submission, not only the first: messageFor/aria wiring below runs for
     each, and the focus move is the one thing scoped to just the first. */
  form.addEventListener("invalid", function (e) {
    var field = e.target;
    /* Suppresses the browser's own bubble for this field only. The
       submission itself stays cancelled either way: that part is the
       browser's constraint validation, not this preventDefault. */
    e.preventDefault();

    var errorEl = document.getElementById(field.id + "-error");
    if (errorEl) {
      errorEl.textContent = messageFor(field);
      errorEl.hidden = false;
      field.setAttribute("aria-describedby", errorEl.id);
    }
    field.setAttribute("aria-invalid", "true");

    /* validity is a static read of the field's current value, unchanged by
       anything else in this pass, so querying it again here rather than
       tracking state across events always names the same element: the
       first invalid control in document order. Suppressing this field's
       bubble above also suppressed the browser's own auto-focus for it, so
       this is the only place focus gets set. */
    if (field === form.querySelector(":invalid")) field.focus();
  }, true);

  /* Clears a field's custom error state the moment it becomes valid again,
     rather than waiting for another submit attempt to notice. */
  form.addEventListener("input", function (e) {
    var field = e.target;
    if (!field.checkValidity || !field.checkValidity()) return;
    field.removeAttribute("aria-invalid");
    var errorEl = document.getElementById(field.id + "-error");
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }
  });
})();
