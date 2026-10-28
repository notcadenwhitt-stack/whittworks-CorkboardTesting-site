# Plan: Blue rebrand, deep overhaul, and production launch of the WhittWorks Studios site

Approved 2026-10-28 by the owner after the `metaprompt` interview. Replaces the 2026-08-18 cork board plan (all ten of its phases are done; it stays recoverable in git history at `board-edits` `fff2e63`).

Repository: `/Users/cadenwhitt/Desktop/Claude Code Projects/WhittWorks/whittworks-CorkboardTesting-site`, branch `board-edits`, tip `fff2e63`, tree clean (verified: `git status -sb`, `git log`).

**One-line goal:** whittworkstudios.com serves the cork board site rebranded to the blue W logo, hardened, measured, legally complete and tuned for phones, where today it serves the August 6 tan editorial page.

## Classification

Track: UI build plus Refactor and hardening, with one Integration (PostHog) and one production Migration (the live repo's contents get replaced). The UI build leads because the owner wants to judge the blue chrome before anything else is built on it. Parked secondary asks: Annie Meissner's testimonial, real security response headers (needs a proxy in front of GitHub Pages), product cards for the reserved cork.

## Interview Ledger

- Q1 brand depth → keep the cork board's materials; build the blue chrome as a preview the owner judges before it rolls out (user)
- Q2 ship route → one new commit on the live repo `whittworks-site` main, from a fresh clone, rollback tag first (user, accepted recommendation)
- Q3 mobile polish → logo in the phone header, the contact form on the phone page, tighter opening screen, checked at 360/390/430 (user, accepted)
- Q4 fonts → League Spartan, self-hosted, replaces Anton (user, accepted)
- Q5 Formspree inbox → not answered; the owner sent the overhaul request instead, so the default stands: a labeled test send gates go-live [A6]
- Q6 overhaul shape → deep hardening pass in place, no rewrite; camera and zoom untouched unless a measurement says otherwise (user, accepted)
- Q7 analytics → PostHog Cloud, loaded only after the visitor clicks Allow on the existing consent panel (user, accepted)
- Owner's added request, mid-interview: "a full code overhaul ... security measures, safety, tracking, metrics, legal, and full optimization ... use all of the new skills we've been developing since august" (user)

Questions spent: 7 of 14, plus this approval question.

## Goal & Success Criteria

1. The owner has seen the blue chrome preview at 1440x900 and on a 390px phone and approved it, in his own words, before any later phase starts.
2. The real W mark (traced from `~/Desktop/New WhittWorks Logo.png`) appears in the round sticker, the phone header, the favicon, the touch icon and the share image. No orange interim `W` survives anywhere (grep for `FFA92B` returns nothing).
3. No stamp red (`#C8331B`, `#b3271c`) remains as a brand accent; links, buttons, focus rings and headings use blue `#004AAD` and navy `#04367B`. Red string on the cork board is physical material and stays [A3].
4. Anton is gone from every page; headings use League Spartan.
5. A phone visitor can send the contact form from the editorial page, and it arrives in the same Formspree inbox as the board form.
6. With consent denied or never given, the page makes zero requests to any PostHog host. With consent allowed, PostHog receives pageviews, zone clicks, menu jumps, form starts, form sends and web-vitals events.
7. `privacy.html`, a Terms of Service page and an Accessibility statement exist, link from the welcome panel and the editorial footer, and describe what PostHog stores.
8. `sitecheck` reports no High findings; `security-review` and `code-review` findings are fixed or signed off by the owner.
9. The zoom does not regress: worst frame at or under 20ms in and out, measured the same way as the 2026-08-24 entry in `PROGRESS.md`.
10. The page weight a first-time visitor downloads before consent is at or below the Phase 1 baseline plus the new font file.
11. whittworkstudios.com serves the new build over HTTPS after the owner's explicit go-ahead, and a one-command rollback exists.

## Current State

- `index.html` 1459 lines, `css/style.css` 2811, `css/editorial.css` 466, `css/reading.css` 344, `js/board.js` 1096, plus `form.js`, `hand.js`, `menu.js`, `peek.js`, `validate.js`, `welcome.js` (verified: `wc -l`).
- Tripwires today, `document.body.innerText.length`: board 2418, editorial 1812, reading 1714, no-JS wide 1796, no-JS narrow 1796 (verified: `node tools/verify/cdp.mjs modes`, 2026-10-28). `HANDOFF.md` still says 1694 for the board; the welcome panel added since 2026-08-20 accounts for the drift (verified: `PROGRESS.md` session log), and the docs were never updated.
- Brand today: editorial paper `#EFEDE6`, ink `#141412`, stamp red `#C8331B`; board ink `#191919`, red `#b3271c`; `theme-color` `#8a6a44`; headings in Anton (verified: `css/editorial.css:36-44`, `css/style.css:240-256`, `index.html:106`). The gold and Didot look exists only on the business card, never on this site (verified: grep of the repo and `_archive/whittworks-site`).
- The sticker is a white ring and black disc holding the interim orange `W` from `assets/favicon.svg` (verified: `PROGRESS.md` Phase 5, `index.html:1066`).
- The contact form exists only on the board (`.contact-form form`); `js/form.js:24` and `js/validate.js:25` bind with `querySelector`, so they handle exactly one form (verified: grep).
- On a 390px phone the editorial page has no sideways overflow, no logo, and no form, only an "Email the studio" button (verified: CDP probe at 390x844, `scrollWidth` 390, screenshots).
- CSP is a meta tag allowing `'unsafe-inline'` for script and style, `connect-src https://formspree.io`, `form-action 'self' https://formspree.io` (verified: `index.html:182`). The page has 8 `<script>` tags (verified: `grep -c`).
- The welcome panel lists "Terms of Service" and "Accessibility" as unlinked placeholder text (verified: `index.html:1024-1031`).
- A consent gate exists: `window.wwAnalyticsGranted()` in `js/welcome.js`, choice stored in `localStorage` key `ww-analytics` (verified: `PROGRESS.md`, "WHEN YOU ADD POSTHOG").
- Production: repo `notcadenwhitt-stack/whittworks-site`, GitHub Pages legacy build from `main` `/`, custom domain whittworkstudios.com plus www, HTTPS enforced, certificate approved to 2027-01-01, last commit `e15a884` 2026-08-06 (verified: `gh api .../pages`, `gh api .../commits`). It holds only `CNAME`, `index.html`, `css/style.css` and nine assets; no verification files or sitemap (verified: `gh api .../git/trees/main`).
- Staging: `notcadenwhitt-stack.github.io/whittworks-CorkboardTesting-site/`, Pages from `main`, no custom domain (verified: `gh api .../pages`). `board-edits` carries a `CNAME` reading `whittworkstudios.com` (verified: `cat CNAME`).
- Tools on this Mac: Node 24.16, Python PIL 11.3, fontTools 4.60 with brotli, Chrome; no potrace, ImageMagick or cwebp (verified: `which`, imports).
- Logo: 2000x2000 PNG on white; W mark in `#004AAD` with `#04367B` facets; "WHITT WORKS" heavy geometric sans in black; "STUDIOS" thin sans with a black-to-violet gradient (verified: viewed the file).

## Scope (v1)

Everything below ships together in one production release:
the blue chrome (after owner approval), real logo assets, mobile polish, Terms and Accessibility pages, PostHog behind consent, a security and code-quality pass, optimization, SEO metadata, and the production move.

## Out of Scope & Parked Items

- **Annie Meissner's testimonial.** Her cork stays bare until the owner supplies a verified quote and photo. Never invent quote text, never restore from `annie-wip` without his yes.
- **The `board-rebuild` branch.** Never used, merged or pushed.
- **A rewrite.** Ruled out at Q6.
- **Real HTTP security headers** (HSTS preload, `frame-ancestors`, `X-Content-Type-Options`). GitHub Pages cannot set them; only a proxy such as Cloudflare in front of Pages can. Parked as a follow-up; the meta CSP is tightened instead.
- **Product cards** for the reserved cork at x 2400-3540, y 1900-2370.
- **Session recording and surveys** in PostHog. Off; they pull extra third-party code and widen the privacy disclosure [A9].
- **Copy rewrites.** Visible copy keeps its wording except where a rule forces a change (em dashes, legal text, analytics disclosure) [A5].
- **The frozen local copy** `WhittWorks/_archive/whittworks-site`. Read only.

## Approach

Build the blue look once as a working preview on the real site, show it, and let the owner decide before the rest is layered on. Everything after the preview is a series of small, separately committed edits to the existing files, the same discipline that carried the August plan.

Brand tokens live in two `:root`-style blocks that already exist (`css/style.css` `:root` for the board, `.editorial` in `css/editorial.css`). The rebrand adds `--brand: #004AAD`, `--brand-deep: #04367B` and a navy-black ink, retires the red tokens as accents, and swaps the `--display` stack to League Spartan in both blocks, which keeps the change to a handful of declarations plus whatever rules hard-code colors.

The W mark is traced into one SVG `<symbol>` used inline (sticker, phone header) and exported to the icon files. The board's camera, stops, zoom timings and render-cost gates are not touched by any phase except Phase 8's measurement.

Analytics is vendored, pinned and self-hosted so `script-src` stays `'self'`; only `connect-src` widens to PostHog's ingestion host, and only consented visitors ever load the script.

Execution routing follows `WhittWorks/CLAUDE.md`. Claude orchestrates, owns the preview (judgment work), integration and review. Self-contained, specified phases (logo export, legal pages, the second form, analytics wiring, CSS split) go to Codex or Gemini lanes. Because this is a multi-piece build, run them through the `codex-swarm` skill when the owner invokes it ("swarm it"); otherwise dispatch them one lane at a time. Lanes that edit `index.html` or `css/style.css` never run in parallel with each other.

Executor's latitude: the exact chrome layout inside the preview, the trace method for the W, the event property names, how the CSS split is cut, commit granularity within a phase.

## Requirements

| # | Requirement | Acceptance check |
|---|---|---|
| R1 | THE SYSTEM SHALL use `#004AAD` and `#04367B` as the brand accent and headline colors in both designs, with no stamp red as an accent. | grep for `C8331B` and `b3271c` hits only the string/pin material; screenshots |
| R2 | THE SYSTEM SHALL set headings in self-hosted League Spartan and SHALL NOT load Anton. | Network log shows no `anton-latin.woff2`; computed `font-family` on the `h1` |
| R3 | THE SYSTEM SHALL show the traced W mark in the sticker, the phone header, `favicon.svg`, the PNG icons and `og-thumbnail.jpg`. | Screenshots; file inspection; grep for `FFA92B` returns nothing |
| R4 | THE SYSTEM SHALL NOT roll out the blue chrome past the preview until the owner approves it. | Owner's approval quoted in `PROGRESS.md` |
| R5 | WHEN a phone visitor reaches Contact, THE SYSTEM SHALL offer the same five-field form, posting to `https://formspree.io/f/xyegnvzd`, with inline validation and the `mailto:` fallback. | Valid and invalid submits at 390px with `fetch` stubbed; one live labeled send |
| R6 | THE SYSTEM SHALL render without horizontal overflow at 360, 390 and 430 px wide and on an iOS Simulator iPhone. | CDP `scrollWidth` check per width; simulator screenshot |
| R7 | WHILE consent is not granted, THE SYSTEM SHALL make no request to any PostHog host. | Network log with Deny and with no choice |
| R8 | WHEN consent is granted, THE SYSTEM SHALL send pageview, zone click, menu jump, form start, form send result and web-vitals events. | Events visible in the owner's PostHog project |
| R9 | WHEN a visitor switches from Allow to Deny, THE SYSTEM SHALL stop capture and clear PostHog's stored identifiers. | Storage inspected before and after |
| R10 | THE SYSTEM SHALL serve `terms.html` and `accessibility.html`, linked from the welcome panel and the editorial footer, and `privacy.html` SHALL describe PostHog accurately. | Pages load; links resolve; copy read against the PostHog config |
| R11 | THE SYSTEM SHALL pass `sitecheck` with no High findings and fix or get sign-off on every `security-review` and `code-review` finding. | Reports saved to the notes folder |
| R12 | THE SYSTEM SHALL keep the zoom's worst frame at or under 20ms in and out. | Same profile method as `PROGRESS.md` 2026-08-24 |
| R13 | THE SYSTEM SHALL keep pre-consent page weight at or below the Phase 1 baseline plus the League Spartan file. | Byte count before and after, same method |
| R14 | THE SYSTEM SHALL contain no em dash in any visible text on any page. | grep for `—` and `&mdash;` across `*.html` outside comments |
| R15 | THE SYSTEM SHALL ship `sitemap.xml`, a canonical URL, Open Graph tags and a JSON-LD `ProfessionalService` block with the logo. | File and tag inspection; a JSON-LD validator |
| R16 | THE SYSTEM SHALL leave the second testimonial's cork bare. | Screenshot at stop 5 |
| R17 | WHEN the owner gives the go-ahead, THE SYSTEM SHALL be live at whittworkstudios.com over HTTPS, with the previous `main` tagged for rollback. | Headless Chrome on the live URL; tag visible on GitHub |

## Key Decisions

- Cork board materials stay: cork, walnut frame, photographed paper, polaroids, pins and red string (user, Q1).
- Blue chrome is built as a preview and judged by the owner first (user, Q1).
- Production gets one new commit on `whittworks-site` main from a fresh clone; domain, DNS and certificate never move (user, Q2).
- Phone page gains the logo, the contact form and tighter spacing (user, Q3).
- League Spartan replaces Anton, sourced from the `google/fonts` repository's OFL release and subset to Latin WOFF2 (user, Q4; source [A2]).
- Deep hardening in place; no rewrite (user, Q6).
- PostHog Cloud behind the existing consent gate (user, Q7), vendored and pinned rather than loaded from PostHog's CDN [A8].
- The editorial page moves from tan `#EFEDE6` to white with navy ink and blue accents, shown in the preview, reversible on the owner's word [A1].
- The sticker becomes a navy ring around a white disc carrying the full-color W, because the mark's navy facets vanish on a dark disc [A4].
- The board's quote attribution loses its leading em dash, since the owner's projects ban em dashes outright; a hyphen-free attribution line replaces it [A5].
- Staging gets rebuilt from `board-edits` before production so the owner can check it on his own phone (verified: convention in `AGENT-HANDOFF.md`).
- Nothing is pushed to staging or production without the owner's explicit say-so at that moment (user, standing rule in `AGENT-HANDOFF.md`).

## Data & State Changes

No database. Browser storage gains PostHog's identifiers for consented visitors only (cookie and `localStorage` under PostHog's own `ph_` prefix [A8]). Existing keys unchanged: `ww-board-open` (sessionStorage), `ww-welcome-seen` and `ww-analytics` (localStorage). Rollback for production is a `git revert` of the single release commit, pushed; the tag `pre-blue-rebrand-20261028` on `e15a884` is the reference point.

## Interfaces, Integrations & Credentials

- **Formspree**: `https://formspree.io/f/xyegnvzd`, POST, `Accept: application/json`, body `FormData`. Public id, not a secret (verified: `PLAN.md` of 2026-08-18). Both forms post here.
- **PostHog Cloud**: project API key supplied by the owner. It is a public, write-only ingestion key designed to ship in page source [A8], stored as a constant in `js/analytics.js`, never in chat logs as a "secret". Ingestion host is `us.i.posthog.com` or `eu.i.posthog.com` depending on the region the owner picks when creating the project [A8]. The library is vendored from the `posthog-js` npm package at a pinned version recorded in a comment.
- **GitHub**: `gh` CLI and the cached keychain token push to both repos (verified: `PROGRESS.md` 2026-08-18 entry). Force-pushes to staging `main` were blocked by the permission classifier last time and the owner ran them himself; expect the same.
- **League Spartan**: OFL, from `github.com/google/fonts` `ofl/leaguespartan/` [A2], with its license text added to `assets/fonts/`.

## Edge Cases & Failure Handling

| Case | Behavior |
|---|---|
| Consent never given or denied | PostHog never loads; zero requests to PostHog hosts |
| Consent revoked mid-visit | `opt_out_capturing()`, PostHog storage cleared, no further events |
| PostHog blocked by an ad blocker | Silent; no console error the site itself raises; site unaffected |
| `js/analytics.js` fails to load | No analytics; every other script unaffected (it is loaded separately and last) |
| Two forms on one page | Each form validates and submits independently; error ids unique per form |
| Formspree down or offline | Existing error paper with a `mailto:` fallback carrying typed content, in both forms |
| JavaScript off | Editorial page, editorial form posts natively to Formspree |
| League Spartan fails to load | Fallback stack with matching posture (geometric sans, then system sans) |
| Owner rejects the blue chrome preview | Iterate the preview only; nothing later starts |
| Live push serves the old build for a few minutes | Pages rebuild lag, seen on staging in August; re-check after two minutes before judging |
| HTTPS fails from the owner's work network | Treat as that network's issue; GitHub reports the cert valid (user, brief) |

## Risks, Landmines & Adaptations

- **Copy is authored twice** (board and editorial). Every visible edit lands in both, and tripwires are re-measured after each phase and written into `HANDOFF.md`.
- **`js/hand.js` jitter re-rolls letterforms after any added lettered element.** The new form, legal links and logo carry no hand-lettering; each phase that touches the board re-checks the Level Up caption on its tape at stop 4.
- **The welcome panel truncates silently** because `.welcome-col-text` is `overflow: hidden`. Any copy change there (the analytics disclosure will change) is re-measured at 1024x700 and 1024x640.
- **`.welcome-col-text p` specificity (0,1,1)** beats single-class paragraph rules; new rules there are written as `.welcome-col-text p.<class>` and confirmed by computed style.
- **Percentage padding on absolutely positioned board elements** resolves against 3600px; size with `--sz`.
- **`?v=` cache-busting**: every edited linked file gets its query bumped, on every page that links it (privacy.html was once left stale).
- **The in-app browser pane screenshots black when hidden.** All visual checks run through `tools/verify/cdp.mjs`; the owner-facing demo can use the built-in browser.
- **Never dispatch a click on a `mailto:` link in the harness**; it opened the owner's Outlook in August. Use the capture-phase `preventDefault` recipe from `PROGRESS.md` Phase 4.
- **Zoom regressions come from FLY_MS and settle timing first**, not paint cost. Phase 8 measures before and after; if worse, revert the offending change, do not retune the camera.
- **Rejected optimizations, never retry**: removing the detail collapse during flight, dropping gradients only while moving, baking cork plus gradients into one texture, WAAPI keyframes, the pointerdown pre-warm (verified: `PROGRESS.md` 2026-08-24).
- **The board's lighting bakes derive from the three `.board` gradients.** Any change to those gradients means re-baking both WebP files, or the board shifts when the images decode.
- **Replacing production is a destructive change to a live site.** Tag first, push the tag, push the release only on the owner's explicit go-ahead in that moment, verify live, and keep `git revert` ready.
- **`whittworks-ship`'s deploy table is stale**: it says pushing `board-edits` serves whittworkstudios.com, which is false (verified: `gh api` Pages settings). Follow this plan's Phase 12, and propose a fix to the skill as a follow-up rather than editing it in this task.
- **`whittworks-ship` names `claude-in-chrome` for the browser pass, while the owner's standing rule is the built-in browser.** Use `cdp.mjs` and `playwright-cli` for checks and the built-in browser for anything the owner watches.
- **The meta CSP's `'unsafe-inline'`** can be removed only if every inline script and style gets a hash or moves to a file. Phase 7 tries hashes; if any inline style attribute blocks it, keep `'unsafe-inline'` for `style-src` only and record why.

## Assumptions Ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Editorial page goes white `#FFFFFF` (or near-white) with navy-black ink and blue accents | Owner called tan "fancy and prissy"; brief | Restyle one token block | Phase 3 preview verdict |
| A2 | League Spartan is OFL and available as a variable TTF in `google/fonts`, subsettable to a Latin WOFF2 under ~40KB | Named open font; fontTools is installed | Pick another geometric OFL face | Phase 1 download and subset, bytes recorded |
| A3 | Red string and pins count as board material, not brand chrome | Q1 kept the cork's physical look | Recolor strings, minutes | Phase 3 preview verdict |
| A4 | Sticker: navy ring, white disc, full-color W | Navy facets disappear on black | Swap two colors | Phase 3 preview verdict |
| A5 | Copy keeps its wording except forced changes (em dashes, legal, analytics disclosure); the kicker stays "Web Design & Consulting · Est. 2026" | Scope discipline; no copy change requested | Copy edit plus tripwire re-measure | Approval recap; owner may ask for the LinkedIn tagline instead |
| A6 | The Formspree form may not be activated; a labeled test send before go-live proves delivery | Q5 unanswered; August send was never confirmed received | Form silently goes nowhere in production | Phase 11 gate |
| A7 | The owner can create a free PostHog project and share its key before Phase 6 | Q7 accepted PostHog | Phase 6 waits; everything else proceeds | Ask for the key at Phase 6 start |
| A8 | PostHog's ingestion key is public by design; `posthog-js` can be vendored, configured with surveys, session recording and remote config off, and uses the `ph_` storage prefix; the free tier covers this site's traffic | Training knowledge, unverified this session | Config keys or hosts differ; CSP needs another origin | Phase 1 reads PostHog's current docs and the npm package |
| A9 | Session recording and surveys stay off | Privacy and payload; not requested | Turn on later with a privacy update | Owner may veto in the recap |
| A10 | No build step is added; files stay hand-authored and unminified | Repo has none; GitHub Pages serves gzip/brotli over the wire anyway | Add a minify step later | Phase 8 byte measurement |
| A11 | Terms of Service is a short plain-language page for a studio site (use of the site, no warranty, governing law Alabama), produced with `sitebuild`, not legal advice | Studio is in Birmingham, Alabama (verified: editorial footer) | Owner may want a lawyer's text | Owner reads it in Phase 5 |
| A12 | Accessibility statement targets WCAG 2.2 AA and names the kebab menu as the keyboard path to every board zone | Audit history in `PROGRESS.md` | Wording change | Phase 5 |
| A13 | The production file set is `index.html`, `404.html`, `privacy.html`, `terms.html`, `accessibility.html`, `robots.txt`, `sitemap.xml`, `CNAME`, `css/`, `js/`, `assets/`; docs and `tools/` stay out | Live repo today holds only public files | Docs leak to the public site | Phase 12 file list diff |

## Open Items (none blocking)

- PostHog project key and region: proceed with every other phase; Phase 6 starts when the key arrives [A7].
- Kicker copy: keep "Web Design & Consulting · Est. 2026" unless the owner asks for "Websites and custom tools, built around your business." to match LinkedIn [A5].
- Cloudflare in front of Pages for real security headers: parked follow-up.
- Fix `whittworks-ship`'s deploy table: follow-up after launch.

## Verification

```bash
node tools/verify/cdp.mjs stops     # eight camera stops, both motion modes
node tools/verify/cdp.mjs modes     # render modes and tripwires
node tools/verify/cdp.mjs shot 0    # screenshot at a stop
```

- Screenshots at stops 0, 1, 2, 3, 4, 5, 6 at 1440x900, and the editorial at 360, 390 and 430 wide, after Phases 3, 4 and 10.
- iOS Simulator screenshot of the phone page and reading mode (trap 1 in `HANDOFF.md`: an emulator missed a real WebKit bug).
- Network log with consent unset, denied and allowed.
- Zoom frame profile in and out, before Phase 8 and after Phase 10.
- Byte count of everything `index.html` pulls before consent, same method as `PROGRESS.md` Phase 1.
- Console clean at every stop and every page.
- `sitecheck`, `security-review`, `code-review` reports saved to the notes folder.
- **How the owner confirms it personally:** approve the preview; open staging on his phone and laptop; receive the labeled Formspree test; see his own visit in PostHog after clicking Allow; then give the go-ahead and load whittworkstudios.com.

## Build Phases

- [ ] Phase 1: Baseline, audits and verify the risky assumptions
      Done when: a findings file in the notes folder lists current tripwires, the byte baseline, the zoom worst-frame numbers, every `sitecheck` / `security-review` / `code-review` finding, the League Spartan WOFF2 size, and PostHog's current config keys and hosts from its docs.
      Steps:
      - Run `cdp.mjs modes` and `stops`; record values. Measure the pre-consent byte total.
      - Profile the zoom in and out per `PROGRESS.md` 2026-08-24; record worst frames.
      - Run `sitecheck` (audit only), `security-review` and `code-review` on `board-edits`; collect findings.
      - Download League Spartan from `google/fonts`, subset to Latin WOFF2 with `pyftsubset`, record bytes [A2].
      - Read PostHog's docs and the `posthog-js` package for config keys, hosts and storage names [A8].
      Covers: R11, R12, R13 baselines; checks: A2, A8

- [ ] Phase 2: Logo assets from the real W
      Done when: an SVG of the W overlaps the PNG's mark at 99% or better by pixel comparison at 512px, and `favicon.svg`, `favicon-32.png`, `favicon-512.png`, `apple-touch-icon.png` (180) and `og-thumbnail.jpg` (1200x630) are regenerated from it.
      Steps:
      - Trace the mark's flat polygons from the PNG into one SVG `<symbol>` with the two blues.
      - Export the icon PNGs and the share image with PIL; navy or white background per preview.
      - Set `theme-color` to `#04367B` on every page.
      Covers: R3

- [ ] Phase 3: Blue chrome preview, then STOP for the owner's verdict
      Done when: the owner has seen screenshots of stops 0, 1 and 6, the welcome panel, and the phone editorial page, and approved a direction in writing.
      Steps:
      - Add brand tokens; swap `--display` to League Spartan in both designs; retire red accents.
      - Recolor the title strip, kebab, menu, welcome panel, buttons, links, focus rings and form button.
      - Sticker: navy ring, white disc, inline W symbol [A4]. Editorial: white background, navy ink, blue accents [A1].
      - Use `ui-ux-pro-max` and `design-references` for palette contrast and type scale; re-measure WCAG AA contrast, including the 10px fine print.
      - Present screenshots; iterate on feedback; nothing past this phase until approved.
      Covers: R1, R2, R4, R14 (board side); checks: A1, A3, A4

- [ ] Phase 4: Mobile polish
      Done when: at 360, 390 and 430 px the phone page shows the logo in its header, a tighter opening screen, and a working contact form, with `scrollWidth` equal to the viewport and an iOS Simulator screenshot to match.
      Steps:
      - Generalize `js/form.js` and `js/validate.js` from one `querySelector` to every `.cf` form, with ids unique per form.
      - Add the editorial form under Contact, same fields, honeypot, consent notice and privacy link.
      - Logo in the editorial header; reduce the hero's empty space.
      - Re-measure tripwires (editorial and no-JS will grow) and record them.
      Covers: R5, R6

- [ ] Phase 5: Legal pages
      Done when: `terms.html` and `accessibility.html` load, link from the welcome panel and editorial footer, and `privacy.html` names PostHog, what it stores, the consent choice and how to withdraw it.
      Steps:
      - Run `sitebuild` for the two new pages; match the rebrand's styles; CSP and `?v=` on each.
      - Replace the two placeholder spans with links; update privacy and the welcome panel's disclosure together.
      - Re-measure the welcome panel at 1024x700 and 1024x640.
      Covers: R10; checks: A11, A12

- [ ] Phase 6: PostHog behind consent
      Done when: with consent unset or denied the network log shows zero PostHog requests; with Allow, the owner's project shows the pageview and a zone click; Deny after Allow clears `ph_` storage.
      Steps:
      - Get the project key and region from the owner [A7].
      - Vendor `posthog-js` at a pinned version into `js/vendor/`; new `js/analytics.js` loads it only when `wwAnalyticsGranted()` is true and on later Allow.
      - Events: zone click (zone), menu jump (stop), form start, form send (ok or error), board/text toggle, web vitals.
      - Widen `connect-src` to the ingestion host only.
      Covers: R7, R8, R9; checks: A7, A8, A9

- [ ] Phase 7: Security and safety hardening
      Done when: every `security-review` finding is fixed or signed off, the CSP has no `'unsafe-inline'` for scripts, and `sitecheck` shows no High findings on security.
      Steps:
      - Hash or externalize inline scripts; drop `'unsafe-inline'` from `script-src`, and from `style-src` if feasible.
      - Add `<meta name="referrer" content="strict-origin-when-cross-origin">`; `rel="noopener noreferrer"` on external links.
      - Form safety: `maxlength` on every field, honeypot kept, error text via `textContent` only (already true; re-verify).
      - Same CSP treatment on `privacy.html`, `terms.html`, `accessibility.html`, `404.html`.
      Covers: R11

- [ ] Phase 8: Code cleanup and optimization
      Done when: the pre-consent byte total is at or under the Phase 1 baseline plus the League Spartan file, the zoom worst frame is at or under 20ms both ways, and `cdp.mjs stops` matches baseline.
      Steps:
      - Delete dead CSS and JS left by the rebrand (Anton face, red rules, interim W); remove `anton-latin.woff2` if nothing references it.
      - Split the board-only placeholder data out of `css/style.css` behind the 901px media gate (HANDOFF next step 2).
      - Apply every `code-review` cleanup that does not touch camera timing.
      - Bump every `?v=`; re-profile the zoom; revert any change that worsens it.
      Covers: R12, R13; checks: A10

- [ ] Phase 9: SEO and metadata
      Done when: `sitemap.xml`, canonical, Open Graph tags with the new image, and a JSON-LD `ProfessionalService` block validate, and `robots.txt` references the sitemap.
      Steps:
      - Write `sitemap.xml` for the four public pages; add JSON-LD with name, url, logo, email, area served.
      - Meta descriptions on every page; noindex stays on `404.html` only.
      Covers: R15

- [ ] Phase 10: Full review pass and documentation
      Done when: independent judges per stop and per phone width report no shippable-quality issue, the keyboard walkthrough has no trap, console is clean everywhere, no em dash appears in visible text, and `HANDOFF.md`, `PROGRESS.md` and this plan carry the re-measured tripwires.
      Steps:
      - `code-review` on the full diff; judges with an explicit out-of-scope list (Annie's cork, accepted residuals in `AGENT-HANDOFF.md`).
      - `stop-slop` audit of all visible copy; em dash grep.
      - Contrast re-measure; stop 5 shows bare cork.
      Covers: R14, R16, confirms R1 to R15

- [ ] Phase 11: Staging check and the form gate
      Done when: staging serves the new build, the owner has opened it on his phone, one Formspree send labeled "TEST SUBMISSION, ignore" reached his inbox and he confirmed it, and his own consented visit shows in PostHog.
      Steps:
      - On the owner's say-so, rebuild staging `main` from `board-edits` (delete `CNAME`, add noindex), never merging; tag the old staging tip first. Expect the owner to run the force-push himself.
      - Verify through headless Chrome (the shell cannot reach `*.github.io`).
      - Send the one labeled test; wait for his confirmation [A6].
      Covers: R5, R8; checks: A6

- [ ] Phase 12: Ship to whittworkstudios.com on the owner's go-ahead
      Done when: whittworkstudios.com serves the new build over HTTPS with the console clean and tripwires matching local, the rollback tag exists on GitHub, and the docs record the release.
      Steps:
      - Run `whittworks-ship` (sitecheck, browser pass, SEO, legal, git); print its pass/fail table.
      - Confirm the target with the owner: repo `notcadenwhitt-stack/whittworks-site`, branch `main`, domain whittworkstudios.com.
      - Fresh clone into the scratchpad (never `_archive/`); tag `e15a884` as `pre-blue-rebrand-20261028`, push the tag.
      - Replace the tree with the A13 file set; confirm `CNAME` reads `whittworkstudios.com` and no noindex meta; one commit.
      - Push only on the owner's explicit go-ahead; verify live after Pages rebuilds; rollback is `git revert <release>` then push.
      - Update `HANDOFF.md`, `PROGRESS.md`; propose the `whittworks-ship` table fix as a follow-up.
      Covers: R17; checks: A13
