/* Capture API and SDK sources checked 2026-10-28:
   https://posthog.com/docs/api/capture
   https://github.com/PostHog/posthog-js/blob/main/packages/browser/src/request.ts
   https://github.com/PostHog/posthog-js/blob/main/packages/browser/src/extensions/web-vitals/index.ts
   https://github.com/PostHog/posthog-js/blob/main/packages/browser-common/src/utils/event-utils.ts
   https://github.com/PostHog/posthog/blob/master/rust/capture/src/router.rs
   https://github.com/PostHog/posthog/blob/master/rust/capture/src/v0_request.rs
   POST /i/v0/e/ takes api_key, event, distinct_id, properties, timestamp.
   POST /batch/ takes api_key and batch of events. CORS allows JSON POSTs.
   Raw JSON is decoded from bytes; text/plain beacons avoid JSON preflight.
   No provider SDK, cookies, field values or DOM text are collected.

   Why no SDK: posthog-js's standalone bundle is about 680KB raw and 209KB
   gzipped (npm 1.441.1, measured 2026-10-28) to send a handful of events.
   This file talks to the same public capture endpoint directly, so
   script-src stays 'self' and the only new origin is connect-src for the
   ingestion host. Nothing here runs at all until the visitor clicks Allow
   (window.wwAnalyticsGranted from js/consent.js), and a later Deny stops
   capture and deletes this file's two storage keys.

   The key is PostHog's public, write-only project key, made to ship in page
   source. The project lives in PostHog's US region (verified 2026-10-28:
   /decide answered 200 on us.i.posthog.com and 401 on eu.i.posthog.com). */
(function () {
  "use strict";

  var POSTHOG_KEY = "phc_vYnZPGSe2BsqmGJyf6TrdAJT5YXw2N847aQxHPsG33YU";
  var POSTHOG_HOST = "https://us.i.posthog.com";
  /* Test hook for tools/verify/analytics-check.mjs, which injects a fake key
     so its checks never write into the real project. */
  if (typeof window.__WW_PH_TEST_KEY === "string") POSTHOG_KEY = window.__WW_PH_TEST_KEY;
  if (!POSTHOG_KEY) return;

  var active = false;
  var queue = [];
  var pending = [];
  var generation = 0;
  var timer;
  var id;
  var session;
  var windowId;
  var observers = [];
  var metrics = {};
  var vitalsSent = false;
  var cls = { start: 0, last: 0, value: 0 };
  var interactions = {};

  /* Which design the visitor is looking at, read the same way js/consent.js
     and js/welcome.js decide it: from #corkboard's computed display. */
  var corkboard = document.getElementById("corkboard");
  /* "reading" only when the board is on screen WITHOUT its camera (a phone
     that opened it, or a short window). board-open alone is not enough:
     peek.js sets it on desktop too, where the camera board is running. */
  function design() {
    var root = document.documentElement;
    if (!corkboard || getComputedStyle(corkboard).display === "none") return "editorial";
    return getComputedStyle(root).getPropertyValue("--camera-active").trim() === "0" ? "reading" : "board";
  }

  function granted() {
    return !!window.wwAnalyticsGranted && window.wwAnalyticsGranted();
  }
  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var n = Math.floor(Math.random() * 16);
      return (c === "x" ? n : (n & 3) | 8).toString(16);
    });
  }
  function touch() {
    var now = Date.now();
    if (!session || now - session.time > 1800000) session = { id: uuid(), time: now };
    session.time = now;
    try { sessionStorage.setItem("ww-ph-session", JSON.stringify(session)); } catch (e) {}
  }
  /* Origin plus path only, never the query or hash. An app referral such as
     android-app://com.google.android.gm/ has the opaque origin "null"; it is
     reported as direct rather than parsed again, which used to throw and stop
     analytics for the whole visit. */
  function clean(url) {
    try {
      var parsed = new URL(url);
      if (parsed.origin === "null") return "$direct";
      return parsed.origin + parsed.pathname;
    } catch (e) { return "$direct"; }
  }
  function capture(event, extra) {
    if (!active || !granted()) return;
    /* One malformed property must never take analytics down for the visit. */
    try {
      queueEvent(event, extra);
    } catch (e) {}
  }
  function queueEvent(event, extra) {
    touch();
    var referrer = clean(document.referrer);
    var referringDomain = "$direct";
    if (referrer !== "$direct") {
      try { referringDomain = new URL(referrer).host; } catch (e) {}
    }
    var props = {
      design: design(),
      $current_url: clean(location.href), $host: location.host, $pathname: location.pathname,
      $referrer: referrer, $referring_domain: referringDomain,
      $screen_width: screen.width, $screen_height: screen.height,
      $viewport_width: innerWidth, $viewport_height: innerHeight,
      $session_id: session.id, $window_id: windowId, $lib: "web", $process_person_profile: false
    };
    Object.keys(extra || {}).forEach(function (key) { props[key] = extra[key]; });
    queue.push({ event: event, distinct_id: id, properties: props, timestamp: new Date().toISOString() });
    if (queue.length > 200) queue.shift();
  }
  function send(batch, beacon, retry, epoch) {
    if (!active || !granted() || epoch !== generation) return;
    var body = JSON.stringify({ api_key: POSTHOG_KEY, batch: batch });
    var url = POSTHOG_HOST + "/batch/";
    if (beacon && navigator.sendBeacon) {
      try { if (navigator.sendBeacon(url, new Blob([body], { type: "text/plain" }))) return; } catch (e) {}
    }
    if (!window.fetch) return;
    var controller = window.AbortController ? new AbortController() : null;
    if (controller) pending.push(controller);
    fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: body,
      credentials: "omit", keepalive: !!beacon, signal: controller ? controller.signal : undefined
    }).then(function (response) {
      if (!response.ok) throw new Error("Capture failed");
    }).catch(function () {
      if (!retry) send(batch, beacon, true, epoch);
    }).then(function () {
      var index = pending.indexOf(controller);
      if (index !== -1) pending.splice(index, 1);
    });
  }
  function flush(beacon) {
    if (!active || !granted() || !queue.length) return;
    send(queue.splice(0, 20), beacon, false, generation);
  }
  function observe(type, consume) {
    if (!window.PerformanceObserver || !PerformanceObserver.supportedEntryTypes ||
        PerformanceObserver.supportedEntryTypes.indexOf(type) === -1) return;
    try {
      var observer = new PerformanceObserver(function (list) {
        if (active) consume(list.getEntries());
      });
      observer.observe({ type: type, buffered: true, durationThreshold: 40 });
      observers.push({ observer: observer, consume: consume });
    } catch (e) {}
  }
  function startVitals() {
    metrics = {};
    if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes &&
        PerformanceObserver.supportedEntryTypes.indexOf("layout-shift") !== -1) metrics.CLS = 0;
    cls = { start: 0, last: 0, value: 0 };
    interactions = {};
    observe("largest-contentful-paint", function (entries) {
      entries.forEach(function (entry) { metrics.LCP = entry.startTime; });
    });
    observe("paint", function (entries) {
      entries.forEach(function (entry) { if (entry.name === "first-contentful-paint") metrics.FCP = entry.startTime; });
    });
    observe("layout-shift", function (entries) {
      if (metrics.CLS === undefined) metrics.CLS = 0;
      entries.forEach(function (entry) {
        if (entry.hadRecentInput) return;
        if (entry.startTime - cls.last > 1000 || entry.startTime - cls.start > 5000) {
          cls.start = entry.startTime;
          cls.value = 0;
        }
        cls.last = entry.startTime;
        cls.value += entry.value;
        metrics.CLS = Math.max(metrics.CLS, cls.value);
      });
    });
    observe("event", function (entries) {
      entries.forEach(function (entry) {
        if (entry.interactionId) interactions[entry.interactionId] = Math.max(interactions[entry.interactionId] || 0, entry.duration);
      });
      var values = Object.keys(interactions).map(function (key) { return interactions[key]; });
      values.sort(function (a, b) { return b - a; });
      if (values.length) metrics.INP = values[Math.min(values.length - 1, Math.floor((performance.interactionCount || values.length) / 50))];
    });
  }
  function vitals() {
    if (!active || vitalsSent) return;
    observers.forEach(function (item) { item.consume(item.observer.takeRecords()); });
    var props = {};
    Object.keys(metrics).forEach(function (name) {
      var value = metrics[name];
      props["$web_vitals_" + name + "_value"] = value;
      props["$web_vitals_" + name + "_event"] = { name: name, value: value };
    });
    capture("$web_vitals", props);
    vitalsSent = true;
  }
  function stop() {
    active = false;
    generation++;
    clearInterval(timer);
    queue = [];
    pending.forEach(function (controller) { controller.abort(); });
    pending = [];
    observers.forEach(function (item) { item.observer.disconnect(); });
    observers = [];
    id = session = windowId = null;
    try { localStorage.removeItem("ww-ph-id"); } catch (e) {}
    try { sessionStorage.removeItem("ww-ph-session"); } catch (e) {}
  }
  function start() {
    if (active || !granted()) return;
    active = true;
    try { id = localStorage.getItem("ww-ph-id"); } catch (e) {}
    if (!id) id = uuid();
    try { localStorage.setItem("ww-ph-id", id); } catch (e) {}
    try { session = JSON.parse(sessionStorage.getItem("ww-ph-session")); } catch (e) {}
    if (!session || typeof session.id !== "string" || typeof session.time !== "number") session = null;
    windowId = uuid();
    touch();
    startVitals();
    capture("$pageview");
    flush(false);
    timer = setInterval(function () { if (queue.length) flush(false); }, 5000);
  }
  window.addEventListener("ww-consent", function (e) {
    if (e.detail && e.detail.value === "granted") start();
    else stop();
  });
  document.addEventListener("click", function (e) {
    if (!active || !granted() || !e.target.closest) return;
    var zone = e.target.closest("[data-zone-stop]");
    var menu = e.target.closest("[data-stop]");
    if (zone) capture("zone_click", { stop: zone.getAttribute("data-zone-stop") });
    if (menu) capture("menu_jump", { stop: menu.getAttribute("data-stop") });
    if (e.target.closest(".board-peek, .board-exit")) capture("view_toggle");
  }, true);
  window.addEventListener("ww-form-start", function (e) {
    if (e.detail) capture("form_start", { form: e.detail.form });
  });
  window.addEventListener("ww-form", function (e) {
    if (e.detail) capture("form_submit", { form: e.detail.form, ok: e.detail.ok === true });
  });
  /* Kept apart from form_submit so a blocked empty field never reads as a
     failed send in the dashboard. */
  window.addEventListener("ww-form-invalid", function (e) {
    if (e.detail) capture("form_invalid", { form: e.detail.form });
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") { vitals(); if (queue.length) flush(true); }
  });
  window.addEventListener("pagehide", function () {
    capture("$pageleave");
    vitals();
    while (active && granted() && queue.length) flush(true);
  });
  start();
})();
