/* Ad-hoc Phase 7 verification, built on top of tools/verify/cdp.mjs's own
   run() helper. Not part of the permanent harness (cdp.mjs's own CHECKS
   object is), just a scratch script for this phase's numeric acceptance
   checks: board-space clearances after moving the doodles and placing the
   form sheet, computed font sizes under the retuned stop 6, and the
   validation behavior for three invalid submissions, all with the network
   request itself intercepted so nothing can reach Formspree. */
import { run } from "./cdp.mjs";

function parseMatrix(t) {
  // "matrix(a, b, c, d, e, f)" or "none"
  var m = /matrix\(([^)]+)\)/.exec(t);
  if (!m) return null;
  var p = m[1].split(",").map(Number);
  return { a: p[0], b: p[1], c: p[2], d: p[3], e: p[4], f: p[5] };
}

await run(async ({ s, base, viewport, motion, goto, atFraction }) => {
  await viewport(s, 1440, 900);
  await motion(s, "no-preference");
  await goto(s, base + "/index.html");

  console.log("=== 1. Board-space clearances (stop 0 transform) ===");
  var t0 = (await atFraction(s, 0 / 7)).t;
  var mtx = parseMatrix(t0);
  console.log("stop0 transform:", t0, "parsed:", JSON.stringify(mtx));

  var rects = await s.eval(`
    function sel(q) { var e = document.querySelector(q); if (!e) return null; var r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; }
    var out = {
      airplane: sel('.doodle.paper-7'),
      chart2: sel('.doodle.paper-3.flip.c-green'),
      monitor: sel('.doodle.paper-4'),
      bulb: sel('.doodle.paper-2.flip'),
      about: sel('.about-card'),
      form: sel('.contact-form'),
      postcard: sel('.contact-postcard'),
      polaroid: sel('.caden-polaroid'),
      trimLeft: sel('.trim-left'),
      trimTop: sel('.trim-top')
    };
    return out;
  `);

  function toBoard(screenRect, m) {
    if (!screenRect) return null;
    return {
      left: (screenRect.left - m.e) / m.a,
      top: (screenRect.top - m.f) / m.d,
      right: (screenRect.right - m.e) / m.a,
      bottom: (screenRect.bottom - m.f) / m.d,
    };
  }
  var board = {};
  for (var k in rects) board[k] = toBoard(rects[k], mtx);
  console.log("board-space rects:", JSON.stringify(board, null, 2));

  function gap(a, b) {
    // minimum separating gap between two axis-aligned rects, or negative if overlapping
    var xGap = Math.max(a.left - b.right, b.left - a.right);
    var yGap = Math.max(a.top - b.bottom, b.top - a.bottom);
    return Math.max(xGap, yGap);
  }
  console.log("airplane vs monitor gap:", gap(board.airplane, board.monitor).toFixed(1));
  console.log("airplane vs about gap:", gap(board.airplane, board.about).toFixed(1));
  console.log("airplane vs trimTop gap:", (board.airplane.top - board.trimTop.bottom).toFixed(1));
  console.log("airplane vs trimLeft gap:", (board.airplane.left - board.trimLeft.right).toFixed(1));
  console.log("chart2 vs monitor gap:", gap(board.chart2, board.monitor).toFixed(1));
  console.log("chart2 vs about gap:", gap(board.chart2, board.about).toFixed(1));
  console.log("chart2 vs airplane gap:", gap(board.chart2, board.airplane).toFixed(1));
  console.log("chart2 vs trimTop gap:", (board.chart2.top - board.trimTop.bottom).toFixed(1));
  console.log("form vs about gap:", gap(board.form, board.about).toFixed(1));
  console.log("form vs postcard gap:", gap(board.form, board.postcard).toFixed(1));
  console.log("form vs polaroid gap:", gap(board.form, board.polaroid).toFixed(1));
  console.log("form vs trimLeft gap:", (board.form.left - board.trimLeft.right).toFixed(1));

  console.log("\n=== 2. Stop 6 scale + font sizes ===");
  var t6 = (await atFraction(s, 6 / 7)).t;
  var m6 = parseMatrix(t6);
  console.log("stop6 transform:", t6, "scale (a):", m6.a);

  var sizes = await s.eval(`
    function fs(q) { var e = document.querySelector(q); return e ? getComputedStyle(e).fontSize : null; }
    return {
      label: fs('.cf-label[for="cf-name"]'),
      input: fs('#cf-name'),
      consent: fs('.cf-consent'),
      heading: fs('.cf-head'),
      submit: fs('.cf-submit'),
      privacy: fs('.cf-privacy'),
      error: fs('.cf-error')
    };
  `);
  console.log("computed font-size at 1440x900, stop 6 in view:", JSON.stringify(sizes, null, 2));

  console.log("\n=== 3. Form sheet overflow check ===");
  var overflow = await s.eval(`
    var form = document.querySelector('.contact-form form');
    var sheet = document.querySelector('.contact-form');
    return {
      sheetClientHeight: sheet.clientHeight,
      formScrollHeight: form.scrollHeight,
      formOffsetHeight: form.offsetHeight,
      overflowsSheet: form.scrollHeight > sheet.clientHeight
    };
  `);
  console.log(JSON.stringify(overflow, null, 2));

  console.log("\n=== 4. Validation, network intercepted ===");
  // Capture-phase listener that prevents the actual navigation/submit no
  // matter what, so even a bug in our own validation cannot let a request
  // leave the machine while we drive these three deliberately-invalid cases.
  await s.eval(`
    var form = document.querySelector('.contact-form form');
    window.__submitted = false;
    form.addEventListener('submit', function (e) { window.__submitted = true; e.preventDefault(); }, true);
    return 1;
  `);

  /* fields: array of { id, value } to type via CDP Input.insertText after
     focusing each in turn. Setting .value directly from JS does NOT set the
     control's "dirty value flag", and tooShort/tooLong (minlength/maxlength)
     are specced to only fire once that flag is true, so a script-assigned
     .value silently never trips minlength no matter how short it is. Real
     typing does dirty it, and Input.insertText is the CDP equivalent of
     real typing (focus + insert), so this is what actually exercises the
     same path a visitor's keystrokes would. */
  async function reportCase(label, fields) {
    await s.eval(`document.querySelector('.contact-form form').reset(); return 1;`);
    for (var i = 0; i < fields.length; i++) {
      await s.eval(`document.getElementById(${JSON.stringify(fields[i].id)}).focus(); return 1;`);
      if (fields[i].value) await s.send("Input.insertText", { text: fields[i].value });
    }
    await s.eval(`window.__submitted = false; return 1;`);
    await s.eval(`document.querySelector('.contact-form form').requestSubmit(document.querySelector('.cf-submit')); return 1;`);
    var r = await s.eval(`
      var active = document.activeElement;
      var errEl = active && document.getElementById(active.id + '-error');
      return {
        submitted: window.__submitted,
        focusedId: active ? active.id : null,
        ariaInvalid: active ? active.getAttribute('aria-invalid') : null,
        ariaDescribedby: active ? active.getAttribute('aria-describedby') : null,
        message: errEl ? errEl.textContent : null
      };
    `);
    console.log(label, JSON.stringify(r));
  }

  // Case A: everything empty, nothing typed at all
  await reportCase("empty submit ->", []);

  // Case B: invalid email, name + project filled validly
  await reportCase("invalid email ->", [
    { id: "cf-name", value: "Test Person" },
    { id: "cf-email", value: "not-an-email" },
    { id: "cf-project", value: "This is a project description with enough length." },
  ]);

  // Case C: 5-character project description, name + email valid
  await reportCase("short project ->", [
    { id: "cf-name", value: "Test Person" },
    { id: "cf-email", value: "test@example.com" },
    { id: "cf-project", value: "short" },
  ]);

  console.log("\n=== 5. privacy.html ===");
  await goto(s, base + "/privacy.html");
  var priv = await s.eval(`return { title: document.title, h1: (document.querySelector('h1')||{}).textContent, hasBack: !!document.querySelector('a[href="index.html"]') };`);
  console.log(JSON.stringify(priv));

  await goto(s, base + "/index.html");
  var linkHref = await s.eval(`var a = document.querySelector('.cf-privacy a'); return a ? a.getAttribute('href') : null;`);
  console.log("form privacy link href:", linkHref);
});
