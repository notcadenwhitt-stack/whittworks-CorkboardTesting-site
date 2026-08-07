# Asset sources and licenses (assets/paper/)

All files here are processed derivatives (cutouts, resizes, WebP) composited into
this site. Raw source files are not redistributed in this repo.

## Sticky notes
- sticky-01/02/03 — Unsplash, https://images.unsplash.com/photo-1553044707-b710ee53ffbd
  (photographer Kelly Sikkema, same March 2019 shoot as unsplash.com/photos/BoAbPMRKLS0).
  Unsplash License: free commercial use, no attribution required. Sharpies and cast
  shadows removed in processing.
- sticky-04, sticky-06 — Rawpixel via Openverse, CC0 1.0,
  https://www.rawpixel.com/image/6043209/sticky-note-free-public-domain-cc0-image
- sticky-05 — Rawpixel via Openverse, CC0 1.0,
  https://www.rawpixel.com/image/6043191/sticky-note-free-public-domain-cc0-image
- sticky-07 — Rawpixel via Openverse, CC0 1.0,
  https://www.rawpixel.com/image/5925272/photo-image-paper-sticky-note-public-domain

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
- cork.jpg, wood.jpg — ambientCG, CC0 1.0.

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
