# Asset sources and licenses (assets/paper/)

All files here are processed derivatives (cutouts, resizes, WebP) composited into
this site. Raw source files are not redistributed in this repo.

## Sticky notes
- sticky-01/02/03 — Unsplash, https://images.unsplash.com/photo-1553044707-b710ee53ffbd
  (photographer Kelly Sikkema, unsplash.com/photos/ElF7K4IWcGQ — corrected
  2026-08-07; this file previously cited BoAbPMRKLS0, which is a different shot
  from the same photographer and the same March 2019 shoot. Same licence, same
  photographer, wrong ID. ElF7K4IWcGQ is the photo actually behind the CDN URL
  above, traced through the Wayback Machine and confirmed by rendering the
  cutouts against it.)
  Unsplash License: free commercial use, no attribution required. Sharpies and cast
  shadows removed in processing.
- sticky-04, sticky-06 — Rawpixel via Openverse, CC0 1.0,
  https://www.rawpixel.com/image/6043209/sticky-note-free-public-domain-cc0-image
- sticky-05 — Rawpixel via Openverse, CC0 1.0,
  https://www.rawpixel.com/image/6043191/sticky-note-free-public-domain-cc0-image
- sticky-07 — Rawpixel via Openverse, CC0 1.0,
  https://www.rawpixel.com/image/5925272/photo-image-paper-sticky-note-public-domain

### KNOWN AND ACCEPTED RISK on the four Rawpixel stickies (owner decision, 2026-08-07)
These four do NOT meet the verification standard the rest of this file is held
to, and that is a deliberate choice rather than an oversight. Recording it
properly so nobody re-discovers it and thinks it was missed.

What was checked, 2026-08-07:
- api.openverse.org was queried for all three foreign_landing_urls above
  (image/6043209, image/6043191, image/5925272). Every one returns
  creator=None and creator_url=None, source=rawpixel, provider=rawpixel,
  license=cc0 1.0, with an attribution string of the form
  '"Sticky note" is marked with CC0 1.0.' No original author is named anywhere.
- rawpixel.com's own pages return HTTP 403 behind a Cloudflare challenge to a
  normal request with full browser headers, so reading the asset's own source
  page — which is what the project's standard requires — is not currently
  possible at all.
- These are modern photographs of Post-it notes with IDs in the 5.9-6.0M range,
  so the CC0 cannot rest on copyright expiry the way Rawpixel's public-domain
  art-print library does. It rests entirely on an unnamed uploader's grant that
  Rawpixel restates.

So the CC0 here is aggregator-asserted, with no named original author, and was
not verifiable at source. The owner has weighed that against the cost of
re-deriving the four notes and their variants and chosen to keep them.

Blast radius if the claim is ever wrong: six shipped files, because
css/style.css:643-646 and :658-659 bind sticky-04, sticky-05, sticky-05-pink,
sticky-06, sticky-06-green and sticky-07. The remedy, if it is ever needed, is
to re-derive those colours from sticky-01/02/03 (Kelly Sikkema, Unsplash, fully
verified) with the same Pillow hue-shift already used for the -blue and -green
variants, then rebuild the inline placeholders with tools/lqip/make_lqip.py.
Each note carries its own aspect-ratio, four picture-area insets, a --tint and
a base64 --lq, all of which would need re-deriving.

## Sticky note color variants
- sticky-01-blue, sticky-02-blue, sticky-03-blue, sticky-03-green,
  sticky-05-pink, sticky-06-green — derived from the sticky-01/02/03/05/06
  scans above (same sources/licenses). Added 2026-08-03 to give repeated
  .paper-N classes distinct colors per element without new photography:
  converted to HSV with Pillow, hue replaced with the target (blue ~210deg,
  spring green ~110deg, pink ~340deg), saturation and value kept per-pixel
  so grain, lighting gradients, and curl shadows are unchanged. sticky-05
  and sticky-06 also got saturation scaled down (0.50x, 0.45x) from their
  vivid originals so the hue swap reads as dyed paper instead of neon.

## Sticky note exposure match (2026-08-04)
- sticky-04, sticky-05, sticky-05-pink, sticky-06, sticky-06-green — re-graded
  in place with Pillow so they sit in the same exposure family as the
  photographed service notes instead of reading as flat colour chips: HSV value
  scaled to a 0.82 median, saturation to 0.42 (0.32 on the green/pink variants),
  then sticky-03's normalised luminance (resized, flipped per note) multiplied in
  to transplant its real lighting gradient and curl shading, then paper-grain
  multiplied at 0.22 for tooth. Same sources/licenses, same filenames.

## Postcard alpha recut (2026-08-04)
- postcard-front, postcard-back — alpha only. Corners rounded to ~9px at four
  unequal radii, each side's edge modulated with smooth 1-D noise (sd ~2px) and
  feathered over 1.8px, so the cutouts stop being mathematically perfect
  rectangles. RGB untouched, so the picture-area insets measured in the CSS
  still land where they were measured.

## Tape and work-postcard re-encode (2026-08-07)
- tape-3, tape-4, tape-7 — encoding only, same pixels and same dimensions.
  The alpha channel shipped lossless, which was most of their weight; it is now
  quality 65 (RGB quality 88). 86,866 bytes to 41,828. Measured against the
  untouched files resampled to the size the strips occupy on screen, mean
  channel error 0.22-0.91 levels, p99 3.0-4.8. Nothing about the source or the
  licence changes. tools/lqip/reencode_assets.py.
- postcard-front — RGB inside the picture area only. .pc-picture covers left
  2.5% / top 4.78% / 94.57% x 90.44% of this card opaquely on the finished
  board, so 82% of the scan was never seen by anyone; that region is now filled
  with the median of the margin, inset 10px, and the file goes 206,980 bytes to
  47,742. The margin, the deckled edge and the alpha are untouched, so the
  picture-area insets measured in the CSS still land where they were measured.
  Same source, same public-domain status.

## Polaroid frames
- polaroid-frame-1/2/3 — Fuzzimo "Blank Polaroid Frame Images" (scans 01, 12, 16),
  https://www.fuzzimo.com/free-hi-res-blank-polaroid-frames/
  Free for personal and commercial use, no attribution required. Terms forbid
  redistributing the source files as downloadable resources: composited site use only,
  never offer these scans as an asset pack.

## Postcards and stamp
- postcard-back.webp — Wikimedia Commons, File:"A Wish" postcard (1913) reverse.tif,
  public domain (US postcard published 1913).
- postcard-front.webp — Wikimedia Commons, File:Roanoke station 1925 postcard.jpg,
  public domain (US white-border postcard, c. 1925).
- stamp-1.webp — Wikimedia Commons, File:Washington WF 1917 Issue-2c.jpg,
  public domain (US postage stamp, 1917).

## Tape and paper
- tape-1 … tape-8 — Resource Boy "100 Masking Tape PNG Textures" (source PNGs
  10, 15, 19, 33, 44, 53, 65, 73), https://resourceboy.com/textures/masking-tape-textures/
  Free for personal and commercial use, no attribution required; no standalone
  redistribution of the files.
- paper-grain-hi.webp — the same Paper002 map remapped with Pillow to a high-key
  luminance (mean 236, sd 9) so it can be multiplied onto near-white index-card
  stock. The original mid-grey map cancels out in soft-light over a ~247 base.
- paper-grain.webp — ambientCG Paper002 (2K Color map), https://ambientcg.com/view?id=Paper002
  CC0 1.0.

## Board surfaces (pre-existing)
- assets/cork.webp — ambientCG **Cork004** (Color map), https://ambientcg.com/view?id=Cork004
  CC0 1.0. The asset ID was identified 2026-08-07 rather than assumed: the
  shipped file scores a mean absolute error of 0.9/255 against the official
  Cork004 1K Color map, against 22-29 for Cork001, Cork002 and Cork003. This
  entry previously read "cork.jpg", which is not a filename that exists here.
- assets/wood.jpg — ambientCG, CC0 1.0. Re-encoded 2026-08-07 from 512x512 to
  256x256 (38,666 -> 9,876 bytes); the border-image slice in css/style.css moved
  170 -> 85 in the same commit to keep the identical 0.3320 fraction.

## The wall behind the board
- assets/wall-map.webp — the blue world map the cork board hangs on. 2000x1018,
  24,252 bytes. Applied in css/style.css as the last background layer on
  .viewport, under a flat #233341 (the file's own mean) so the wall is the right
  colour before the scan lands.
  ORIGINAL ARTWORK, created 2026-08-07 for this site. No third-party rights, no
  license obligations, nothing to attribute, nothing to verify. Not traced from,
  derived from, sampled out of, or fitted to any third-party map file, raster or
  vector — the coastlines are hand-authored (lon, lat) polygons written directly
  into tools/wall-map/coasts.py, and tools/wall-map/render_wall.py projects them
  (Miller cylindrical, 84N to 60S), fills, strokes, adds the graticule, the
  low-frequency paper mottle and a 1.1px defocus, and writes the WebP. Running
  `python3 tools/wall-map/render_wall.py assets/wall-map.webp` with no arguments
  reproduces the shipped file byte for byte, which is also what makes the
  original-artwork claim checkable rather than asserted.
  Deliberately coarse: it renders at ~5.5px per degree of longitude, sits behind
  the board at roughly a third of the cork's brightness, and is defocused, so
  sub-continental accuracy would be invisible even if it were there. Read it as
  a stylised wall map, not as reference geography.
- Considered and NOT used: Natural Earth (https://www.naturalearthdata.com/about/terms-of-use/,
  read 2026-08-07 — "All versions of Natural Earth raster + vector map data
  found on this website are in the public domain", "No permission is needed to
  use Natural Earth. Crediting the authors is unnecessary"). The licence is
  clean and would have been fine to use; the data is simply not on this machine
  and fetching it was out of scope for the pass, so the map was drawn instead.
  Recorded here so the next person does not have to re-verify it.

## The webfonts (assets/fonts/) — self-hosted 2026-08-07
The four families used to be fetched from fonts.googleapis.com at page load.
They are now served from this repo. The files are the EXACT woff2 bytes Google
was serving for the `latin` subset to a current Chrome: fetched from
fonts.gstatic.com on 2026-08-07 via the URLs its css2 API returned, and copied
in unmodified, so the lettering is byte-identical to what shipped before and
there is nothing to re-verify visually. Subsetting was tried and rejected —
re-subsetting the upstream TTFs from github.com/google/fonts to the same
unicode-range with fontTools 4.60.2 produced files 3.3% LARGER (181,788 bytes
against Google's 175,924), so Google's own encoder wins and its output is what
ships. Only `latin` is here: Google's other slices (latin-ext, cyrillic,
cyrillic-ext, vietnamese) hold no glyph any word on this board needs, and each
@font-face carries Google's own unicode-range for the latin slice verbatim so a
browser that does need a glyph outside it falls through to the stack in
css/style.css instead of drawing a box.

Licences were checked at source, not assumed. TWO OF THE FOUR ARE NOT OFL:

- assets/fonts/caveat-latin.woff2 — Caveat, variable wght 400..700, v23,
  74,572 bytes. Designer Impallari Type. SIL Open Font License 1.1.
  Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat).
  Licence: github.com/google/fonts/blob/main/ofl/caveat/OFL.txt, shipped here as
  assets/fonts/LICENSE-Caveat-OFL.txt.
  From https://fonts.gstatic.com/s/caveat/v23/Wnz6HAc5bAfYB2Q7ZjYYiAzcPA.woff2

- assets/fonts/permanent-marker-latin.woff2 — Permanent Marker, 400, v16,
  29,296 bytes. Designer Font Diner. APACHE LICENSE 2.0, not OFL.
  Copyright (c) 2010 by Font Diner, Inc. All rights reserved.
  Licence: github.com/google/fonts/blob/main/apache/permanentmarker/LICENSE.txt,
  shipped here as assets/fonts/LICENSE-PermanentMarker-Apache-2.0.txt (Apache 2.0
  section 4 requires the licence text to travel with the redistributed work,
  which is why the .txt is in the repo and not just cited in this file).
  From https://fonts.gstatic.com/s/permanentmarker/v16/Fh4uPib9Iyv2ucM6pGQMWimMp004La2Cf5b6jlg.woff2

- assets/fonts/special-elite-latin.woff2 — Special Elite, 400, v20,
  53,040 bytes. Designer Astigmatic. APACHE LICENSE 2.0, not OFL.
  Copyright (c) 2010 by Brian J. Bonislawsky DBA Astigmatic (AOETI).
  Licence: github.com/google/fonts/blob/main/apache/specialelite/LICENSE.txt,
  shipped here as assets/fonts/LICENSE-SpecialElite-Apache-2.0.txt.
  From https://fonts.gstatic.com/s/specialelite/v20/XLYgIZbkc4JPUL5CVArUVL0ntnAOSFNuQsI.woff2

- assets/fonts/space-mono-400-latin.woff2 (9,464 bytes) and
  assets/fonts/space-mono-700-latin.woff2 (9,552 bytes) — Space Mono, v17.
  Designer Colophon Foundry. SIL Open Font License 1.1.
  Copyright 2016 The Space Mono Project Authors (https://github.com/googlefonts/spacemono).
  Licence: github.com/google/fonts/blob/main/ofl/spacemono/OFL.txt, shipped here
  as assets/fonts/LICENSE-SpaceMono-OFL.txt.
  From https://fonts.gstatic.com/s/spacemono/v17/i7dPIFZifjKcF5UAWdDRYEF8RXi4EwQ.woff2
  and https://fonts.gstatic.com/s/spacemono/v17/i7dMIFZifjKcF5UAWdDRaPpZUFWaHi6WZ3Q.woff2

Both licences permit self-hosting and redistribution, including subsetting.
### The two arrows are not in Caveat, and that is deliberate (2026-08-07)

The board carries two right arrows, `&rarr;` (U+2192): one on the work
postcard's caption and one on the pink "more work available on request" note.
They render in the platform's last-resort symbol face — Lucida Grande on macOS
— not in Caveat, so they sit next to handwriting in a system sans.

This was investigated properly and then LEFT ALONE. Recording both halves so
nobody re-derives the first and re-opens the second.

WHY IT HAPPENS, and it is not a subsetting mistake. U+2192 is absent from the
ENTIRE upstream Caveat family, not merely from the latin slice shipped here:
the canonical variable font (googlefonts/caveat, fonts/variable/Caveat[wght].ttf,
403,648 bytes, v2.000) has 753 cmap entries and the whole U+2190-21FF and
U+27A0-27BF blocks are empty. No arrow of any direction exists to subset in.
U+2191 and U+2193 are named in this file's unicode-range and are absent from
the binary too. Widening the range therefore fixes nothing on its own.

WHAT WAS BUILT AND NOT SHIPPED. A working fix exists: compose the glyph from
Caveat's own contours (the endash outline stretched into a shaft, the greater
outline scaled for the head, both carrying the same wght variation deltas so it
thickens with the axis like its parents), add it to the subset, widen the range
to U+2191-2193. It costs +40 bytes and no new request, and it reads as the same
hand. OFL 1.1 permits it: Caveat declares no Reserved Font Name, so a modified
copy may keep the family name.

WHY IT IS NOT SHIPPED ANYWAY. It would put a hand-modified font, still called
Caveat, into a repository whose whole licensing story was just audited and
cleaned up — in exchange for two characters. The owner weighed that and chose
the system arrow. Owner decision, 2026-08-07. If it is ever revisited, the
build script and its measurements are in this conversation's history, not in
the repo, because shipping the tool without the font would leave a provenance
record pointing at something that does not exist.

Neither OFL font carries a Reserved Font Name, so the families keep their real
names. Verified 2026-08-07 against the METADATA.pb and licence files in
github.com/google/fonts (`license: "OFL"` for caveat and spacemono, `license:
"APACHE2"` for permanentmarker and specialelite) — recorded here so the next
person does not have to re-check, and specifically so nobody repeats the common
assumption that everything on Google Fonts is OFL.

## Photographs of people (assets/) — recorded 2026-08-07
These sit outside assets/paper/ but are the assets with the most rights attached,
so they are recorded here with everything else rather than nowhere. Copyright is
only half of it: both show identifiable people, and a likeness used in commercial
marketing needs the subject's permission independently of who owns the file.

- assets/chad.jpg — Chad Prewett and his wife, shown in the .chad-polaroid beside
  his testimonial (index.html:230). Supplied directly by Chad Prewett for use with
  that testimonial. The photograph was taken at his own event; he holds the rights
  to the image and to both likenesses, and gave them for this use. Owner-confirmed
  2026-08-07. Nothing outstanding.
### Tone grade on two of the three photographs (2026-08-07)
Owner-directed, chosen from a four-up comparison sheet (current / gentle /
medium / strong); both are "strong". Reproduce with
`python3 tools/lqip/grade_photos.py` against a clean checkout.

assets/chad.jpg is NOT touched — it was approved as shot, and it is the
reference the other two were graded against. That comparison is what made the
complaint measurable rather than a matter of taste:

    caden.jpg   mean L 176.0   5th pct 59.9   95th 255.0   sd 80.7   BEFORE
    chad.jpg    mean L 111.4   5th pct 13.0   95th 245.0   sd 82.3   approved
    levelup     mean L  50.1   5th pct  4.1   95th 221.0   sd 72.7   BEFORE

The founder portrait read "too bright" because it had NO BLACK: its darkest
five per cent sat at 60/255 where the approved portrait's sat at 13, so the
suit was flat charcoal instead of navy and the frame floated 65 levels above
the picture beside it. The cure was a black point, not less light.

    caden.jpg   black 42  white 248  gamma 0.86  highlight lift 0.10
                -> mean 159.1   5th 15.0   95th 255.0   sd 99.9
    levelup     black 26  white 236  gamma 0.90  highlight lift 0.22
                -> mean  44.5   5th  0.0   95th 249.1   sd 86.8

The Level Up screenshot had the opposite problem: already dark, but its white
lettering topped out at 221 and its blacks never reached zero, so the chrome
read grey-on-grey. Blacks to zero and highlights up toward paper white; the
black pops because the white does.

The grade is baked into the JPEGs, so it reaches both designs from one file.
Two CSS filters still sit on top per design and were deliberately left as they
were: .pol-photo carries brightness(1.05) contrast(1.05) saturate(1.06) for the
board's frames, and .pc-picture carries saturate(.72) contrast(.8)
brightness(1.05) sepia(.12), which is the postcard's print treatment and is
meant to wash. Both were re-checked by eye after grading.

The inline placeholders for `caden` and `levelup` in css/style.css were
regenerated from the graded files with tools/lqip/make_lqip.py; `chad` and every
other entry are unchanged.

- assets/caden.jpg — Caden Whitt, founder, in the .caden-polaroid
  (index.html:183). Shot by a photographer during Caden's internship. Caden
  holds the rights to the image, and the subject is Caden himself, so both the
  copyright and the likeness side are covered. Owner-confirmed 2026-08-07.
  Nothing outstanding.

## Brand marks and icons (assets/) — recorded 2026-08-07
- assets/favicon-32.png (32x32), assets/favicon-512.png (512x512),
  assets/apple-touch-icon.png (180x180), assets/favicon.svg and
  assets/og-thumbnail.jpg (1200x630) all derive from the WhittWorks Studios
  logo, which is the owner's own mark. Introduced in commit 108cd7e ("Use
  WhittWorks logo for favicon and social-share thumbnail") and re-encoded in
  2aae614. No third-party rights, nothing to attribute.
  favicon.svg is committed but not referenced from index.html; it is kept
  deliberately rather than deleted, unlike the -orig source scans.

## The work sample (assets/) — recorded 2026-08-07
- assets/levelup-card-900.jpg — a screenshot of levelup-men.com, printed into
  the picture area of the work postcard (index.html:209). The site is
  WhittWorks Studios' own client work; the client has given permission for it
  to be shown here as a portfolio piece. Owner-confirmed 2026-08-07.
  The Level Up wordmark, logo and marketing copy visible in the shot remain the
  client's, and appear here only as part of a screenshot of the delivered site.
  Two unreferenced full-size copies (levelup-card.png, levelup-desktop.png)
  were deleted from the repo on 2026-08-07: nothing loaded them, and GitHub
  Pages serves whatever is committed.

## Doodle art
- All board doodles (computer, supply-and-demand chart, paper airplane, rising
  stock chart, light bulb) are original artwork drawn for this site as inline SVG
  in index.html. No third-party rights, no license obligations, nothing to
  attribute. They share the .ink styling in css/style.css: per-path --sw so the
  nib pressure varies, and the #roughen displacement filter for hand wobble.
- Light bulb doodle — drawn 2026-08-06 to replace the unlicensed raster below.
  Glass is an irregular open path rather than a circle; the nine rays are filled
  tapered slivers (class .ray) so each one thins to a point instead of ending on
  a flat cap.

## Retained pending removal
- doodle-bulb-unlicensed.webp.DISABLED — the previous light bulb, derived from a
  user download named "hand-drawn-light-bulb-sketch-flat-isolate-on-white-graphic-
  line-art-vector.jpg". That filename pattern belongs to commercial stock sites
  (Vecteezy, Freepik, Dreamstime, Shutterstock and similar) and the user has
  confirmed they have no source or license for it. The earlier entry here claimed
  "user-confirmed free for commercial use"; that claim was never verified and is
  withdrawn. Unreferenced by any HTML, CSS, or JS, and renamed so nothing can load
  it. Retained only so the user can confirm before it is deleted — delete it.
