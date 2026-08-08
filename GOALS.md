# WhittWorks cork board — goals and constraints

Written 2026-08-07 for a fresh pair of eyes. This states **what needs to be
true**, not how anyone has approached it. Solve it however you think is right,
including by changing the design.

---

## What this is

`whittworkstudios.com` is the one-page site of WhittWorks Studios, a solo web
design and consulting business owned by Caden Whitt. It is a portfolio and a
contact route; it sells services to businesses and organizations.

The design is a photorealistic cork "conspiracy board": a fixed camera over a
3600×2400 board, scroll-driven through 8 stops (overview, title, about, three
service notes, a work sample, a testimonial, contact, back to overview). The
paper is photographed scans, not CSS gradients. A blue world map wall sits
behind the board.

No build step. Static HTML, CSS and two small scripts. Deploys to GitHub Pages.

Repos:
- `whittworks-site` (this one) — production. **Currently `main` serves an older
  editorial design, not the cork board.** The cork board lives on branch
  `corkboard-realism`.
- `whittworks-CorkboardTesting-site` — staging, at
  `https://notcadenwhitt-stack.github.io/whittworks-CorkboardTesting-site/`

---

## Goals

### 1. The board must not visibly assemble itself while it loads

This is the open problem and the reason you are reading this.

The page pulls about 1.8 MB across ~38 files. Left alone, a visitor watches the
board build piece by piece: cork appears, then a portrait, then sticky notes in
groups, over several seconds on a normal connection and far longer on a poor
one. The owner's words: *"the assets are trying to load THEN ... they load
again."*

**What "solved" looks like:** a visitor never watches the board come together.
Either it is simply there, or whatever they see first resolves into the finished
board without a step change that draws the eye.

Two things the owner has explicitly rejected, so you know the bar:
- A dark hold before reveal. The board should not be hidden while a visitor
  waits.
- A placeholder that is obviously a placeholder, so that its replacement by the
  real asset is itself the jarring event.

The dominant surface is the cork (`assets/cork.webp`, ~304 KB) because it is the
entire background. Whatever happens to the cork dominates the perceived load.

### 2. The board must be smooth to scroll

The camera translates and scales a very large layer continuously as the visitor
scrolls. It must hold a steady frame rate on ordinary hardware, with no hitching.

### 3. It must never fail closed

A visitor must never be left looking at a blank, hidden, or permanently
incomplete page. This holds with JavaScript disabled, with a strict Content
Security Policy, with any single asset 404ing or hanging forever, with a
third-party host unreachable, and on a slow or intermittent connection. A slow
visitor is not a broken visitor and must not be treated as one.

### 4. Photographic realism must survive

The owner judges this design on whether it reads as photographed reality rather
than CSS. Specific things they have called out and approved, which must not
degrade: photographed paper texture on the sticky notes, clean bright portraits
(not grey, washed or soft), clean polaroid frames (not dirty), the postcards'
print treatment, cork texture, contact shadows where paper meets cork and where
paper overlaps paper, the title in solid black marker, the hand-drawn circle
around the email address, index card grain and cut edges, masking tape, and five
hand-drawn doodles.

Performance work that costs realism is not a good trade here unless it is
invisible at rest.

### 5. Every asset must be legally clean

This site sells commercial services. Every image needs a verified source and a
commercial-use license recorded in `assets/paper/SOURCES.md`. Verify licenses by
reading the asset's own source page, not by inference from a site's reputation
or an aggregator's badge. Re-uploads of someone else's work stamped
public-domain by a third party, with no named original author, do not count as
verified.

### 6. It must work on phones

Currently it functions on mobile but was never designed for portrait: the camera
framing drifts and each stop shows more surrounding clutter than intended. This
is open work.

### 7. It must be accessible

WCAG 2.1 AA is the working benchmark. The content is real text in the DOM and
should stay that way. Motion-sensitive visitors must have a usable path through
the site. Automated checks were run; a human screen-reader pass has not been
done.

---

## Hard constraints

Break these and something real breaks.

- **`will-change: transform` on `#board` is load-bearing.** It promotes a
  compositor layer that is the only reason the camera holds 60fps. Removing it
  as an "optimization" destroys scroll performance: measured 2026-08-07,
  renderer CPU gets 9.7-11.7x worse, p95 frame time goes 65.8 to 166.8ms, and
  80 of 121 frames blow past 33ms. `Performance.LayoutCount` does not move, so
  the work is migrating from the compositor onto the main paint path exactly as
  expected. It costs nothing in sharpness at rest.
  Correction to the old wording, which said "measured at zero cost": that holds
  for CPU, not for memory. It costs roughly +38MB of compositor tile memory
  (+51%) and +93MB total GPU (+29%) at 1440x900. Quote the range and the
  viewport, not a single number.
- **Do not change the `STOPS` array values or the camera easing in
  `js/board.js`** without a specific reason. The framing at each stop was tuned
  by eye.
- **Visible text must stay byte-identical.** `document.body.innerText.length`
  is exactly **1593** on the board and **1899** on the editorial, re-baselined
  2026-08-08 when the owner-approved events/testimonial content landed
  (previously 1387/1707). Copy changes are the owner's call, not an
  implementation detail.
- **No `CNAME` file in the staging repo.** `CNAME` claims a custom domain for
  GitHub Pages. Both repos carrying one naming `whittworkstudios.com` is a
  conflict that can break or hijack the live site. The file belongs only in
  `whittworks-site`. It reappears every time staging is rebuilt from this
  branch, so it must be removed again each time.
- **Fonts are self-hosted and the page has zero third-party requests.** Keep it
  that way. Two of the four families are Apache 2.0, which requires the license
  text to ship alongside; it is in `assets/fonts/`.
- **Do not push to `whittworks-site`.** The live site is currently the older
  editorial design and the owner decides when that changes. Staging pushes are
  fine.

---

## Environment facts that will cost you time if you do not know them

- **The dev server sends no cache headers.** `python3 -m http.server` on port
  8941. A returning browser silently serves stale bytes from disk cache. This
  has produced measurably wrong conclusions more than once. Always load with a
  unique `?v=` query string. For any payload or timing measurement, serve a
  clean `git archive` export on a fresh port with `Cache-Control: no-store` and
  use `Network.setCacheDisabled` in real Chrome over CDP.
- **The in-app browser preview pane paints an all-background frame at
  `scrollY > 0`** and hard-throttles `requestAnimationFrame`. To inspect a
  camera stop, stay at scroll 0 and set `board.style.transform` yourself using
  the `STOPS` math in `js/board.js`. Use real Chrome over CDP for anything
  timing-sensitive.
- **Percentage padding on absolutely positioned elements resolves against the
  3600px board**, not the element. A `7%` padding becomes 250px and the element
  renders thousands of pixels tall. Sizing uses a `--sz` custom property
  instead.
- **CSS `url()` inside a custom property resolves relative to the stylesheet
  that *uses* the variable**, not the one that declares it.
- Screenshots of this page over CDP occasionally return a half-rastered near
  black frame at extreme scroll positions. It is a capture artifact of the large
  compositor layer, not a page defect. Take frames until two agree.

---

## Current state

Branch `corkboard-realism`, tip `48c1f2a`. Working tree clean. Staging is
serving this build.

- ~38 referenced files, about 1.8 MB, 34 requests, zero third-party hosts.
- Console clean, no 404s.
- `robots.txt`, `404.html`, a canonical URL and self-hosted fonts are in place.
- `prefers-reduced-motion` is honoured by the camera.
- A CSS-only placeholder system paints before the photographs arrive.
- Live site headers: the production domain sends no security headers, including
  no HSTS, no CSP, no `X-Content-Type-Options` and no `Referrer-Policy`. GitHub
  Pages cannot set headers from the repo, so the remaining options are putting
  Cloudflare in front or moving hosts.
  Correction, verified 2026-08-07: **"Enforce HTTPS" is already on.**
  `http://whittworkstudios.com` returns a 301 to `https://`. This list used to
  offer it as an available option; it is done. (Staging does send HSTS, but only
  because `*.github.io` is in the browser preload list, which the custom domain
  is not.)

### Running it

```bash
python3 -m http.server 8941 --directory "<this directory>"
```

Jump the camera to stop *n* of 0..7:

```js
window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * n/7)
```

### Files worth reading first

- `index.html` — one page, inline SVG filter definitions, the board markup
- `css/style.css` — everything visual
- `js/board.js` — the camera: `STOPS`, the scale/translate math, and a class
  toggled during motion that simplifies expensive rendering
- `js/hand.js` — splits hand-lettered text into per-character spans, seeded from
  a hash of the text so the same letters draw every visit
- `assets/paper/SOURCES.md` — every asset's provenance and license
- `PLAN.md` — the plan this work was executed against
