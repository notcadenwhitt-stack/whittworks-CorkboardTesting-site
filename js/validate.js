(function () {
  "use strict";

  document.querySelectorAll("form[data-cf]").forEach(function (form) {

    function addDescribedBy(field, id) {
      var ids = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
      if (ids.indexOf(id) === -1) ids.push(id);
      field.setAttribute("aria-describedby", ids.join(" "));
    }
    function removeDescribedBy(field, id) {
      var ids = (field.getAttribute("aria-describedby") || "").split(/\s+/)
        .filter(Boolean)
        .filter(function (t) { return t !== id; });
      if (ids.length) field.setAttribute("aria-describedby", ids.join(" "));
      else field.removeAttribute("aria-describedby");
    }

    function messageFor(field) {
      var v = field.validity;
      if (v.valueMissing) return "This field is required.";
      if (v.typeMismatch) return "Enter a valid email address.";
      if (v.tooShort) return "Say a little more: at least 20 characters.";
      return field.validationMessage || "Please check this field.";
    }

    form.addEventListener("invalid", function (e) {
      var field = e.target;
      e.preventDefault();

      var errorEl = form.querySelector("[id=\"" + field.id + "-error\"]");
      if (errorEl) {
        errorEl.textContent = messageFor(field);
        errorEl.hidden = false;
        addDescribedBy(field, errorEl.id);
      }
      field.setAttribute("aria-invalid", "true");

      if (field === form.querySelector(":invalid")) field.focus();
    }, true);

    form.addEventListener("input", function (e) {
      var field = e.target;
      if (!field.checkValidity || !field.validity.valid) return;
      field.removeAttribute("aria-invalid");
      var errorEl = form.querySelector("[id=\"" + field.id + "-error\"]");
      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = "";
        removeDescribedBy(field, errorEl.id);
      }
    });
  });
})();
