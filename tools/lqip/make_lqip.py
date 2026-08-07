"""Build the blurred low-quality image placeholders that css/style.css inlines.
Writes a JSON map of name -> data URI, for pasting into css/style.css.

Every element on the board that carries a photographed scan used to carry a
flat colour sampled out of that scan. The colour was right and the shape was
right, but flat-to-photographic is a step change, and on the cork — which is
the whole background — it is the only thing the visitor sees happen. So each
flat colour becomes a heavily downscaled copy of the same file, base64'd into
the stylesheet: zero extra requests, available at first paint, and the real
scan lands on top of a soft version of itself instead of a swatch.

Emits a CSS fragment on stdout and a size report on stderr. Sizes below are
per-asset because the right one is not a constant: a photograph carries its
subject at 32px and a cork texture carries nothing at all at 32px (measured:
the 1180px cork tile has a per-channel std of 19.2 at full size, 3.0 at 32px,
13.4 at 192px), so the cork gets the pixels and the paper does not.

Run from the repo root:  python3 tools/lqip/make_lqip.py > tools/lqip/lqip.json
"""
import base64
import io
import json
import sys

import numpy as np
from PIL import Image

STAMP = "assets/paper/stamp-1.webp"


def opaque_median(im):
    """Per-channel median over pixels the scan calls solid. Same measurement
    the flat tints used, and here it is only the colour transparent pixels get
    flattened onto so a cut-out never contributes a dark halo to its own
    thumbnail."""
    a = np.asarray(im.convert("RGBA"), dtype=np.uint8)
    body = a[..., 3] >= 250
    if not body.any():
        body = np.ones(a.shape[:2], bool)
    return tuple(int(v) for v in np.median(a[..., :3][body], axis=0))


def flatten(im):
    if im.mode != "RGBA":
        return im.convert("RGB")
    bg = Image.new("RGB", im.size, opaque_median(im))
    bg.paste(im, (0, 0), im)
    return bg


def inscribe(im, fw, fh):
    """Crop to the centred fraction of the box the placeholder is allowed to
    paint in. The placeholder must never reach past the eventual torn, deckled
    or perforated edge, or the element visibly shrinks when the real alpha
    arrives, so the thumbnail is cropped to exactly the box the CSS will draw
    it in and stays registered with the scan behind it."""
    w, h = im.size
    cw, ch = w * fw, h * fh
    return im.crop((round((w - cw) / 2), round((h - ch) / 2),
                    round((w + cw) / 2), round((h + ch) / 2)))


def blank_rect(im, rect):
    """Paint over a region that another element covers on the finished board,
    using the median of everything OUTSIDE it. Without this the covered region
    is still in the thumbnail, and downscaling smears it several source pixels
    outwards — enough to change the colour of the margin that DOES show."""
    a = np.asarray(im.convert("RGB")).copy()
    h, w = a.shape[:2]
    x0, y0 = round(rect[0] * w), round(rect[1] * h)
    x1, y1 = round((rect[0] + rect[2]) * w), round((rect[1] + rect[3]) * h)
    outside = np.ones((h, w), bool)
    outside[y0:y1, x0:x1] = False
    fill = np.median(a[outside], axis=0)
    a[y0:y1, x0:x1] = fill
    return Image.fromarray(a)


def encode(im, quality):
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=quality, method=6)
    return buf.getvalue()


def lqip(path, long_edge, quality, inscribed=(1.0, 1.0), square=False, rect=None):
    im = flatten(Image.open(path))
    if rect:
        im = blank_rect(im, rect)
    im = inscribe(im, *inscribed)
    w, h = im.size
    if square:
        tw = th = long_edge
    elif w >= h:
        tw, th = long_edge, max(1, round(h * long_edge / w))
    else:
        tw, th = max(1, round(w * long_edge / h)), long_edge
    data = encode(im.resize((tw, th), Image.LANCZOS), quality)
    b64 = base64.b64encode(data).decode()
    print(f"{path:44s} {tw:4d}x{th:<4d} q{quality:<3d} "
          f"{len(data):6d}B raw  {len(b64):6d} b64", file=sys.stderr)
    return f'url("data:image/webp;base64,{b64}")', len(b64)


OUT = {}
TOTAL = 0


def emit(name, path, long_edge, quality, inscribed=(1.0, 1.0), square=False,
         rect=None):
    global TOTAL
    uri, n = lqip(path, long_edge, quality, inscribed, square, rect)
    TOTAL += n
    OUT[name] = uri


# CORK. The board lays cork.webp twice, 890 soft-light over 1180 normal. The
# placeholder is the same thumbnail laid the same two ways, so the CSS runs the
# real compositing pipeline on low-resolution inputs and the colour falls out
# of the blend instead of being guessed at.
#
# 144px, and this is the one asset that gets more than a thumbnail's worth of
# pixels. Cork has almost no low-frequency content: the 1180px tile's per-
# channel std is 19.2 at full size and 3.0 at 32px, so a 32px cork placeholder
# decodes to a flat swatch and changes nothing about the complaint it exists to
# answer. It has to be big enough to carry grain, and then it has to stop,
# because css/style.css is render-blocking and on a slow line it is sharing the
# pipe with five preloads: measured, every KB added here costs ~55ms of first
# paint at 1 Mbps. 144px/q48 sits on the knee of that curve — std 11.3 for
# 2.7KB, against 13.4 for 6.0KB at 192px and 3.0 for nothing at 32px.
emit("cork", "assets/cork.webp", 144, 48, square=True)

# The wall behind the board. Real structure (coastlines), so 48px carries it.
emit("wall", "assets/wall-map.webp", 48, 60)

# Photographs, laid with the same cover/position the <img> uses.
emit("caden", "assets/caden.jpg", 40, 62)
emit("chad", "assets/chad.jpg", 40, 62)
emit("levelup", "assets/levelup-card-900.jpg", 48, 62)

# Paper stock, cropped to the inscribed opaque box the flat tints used.
emit("pol1", "assets/paper/polaroid-frame-1.webp", 28, 60, (0.98, 0.98))
emit("pol2", "assets/paper/polaroid-frame-2.webp", 28, 60, (0.98, 0.98))
# The front's picture area is under the Level Up shot on the finished board and
# its 1913 railway scene is teal, so it is painted out with the median of the
# margin — the only part of this card anyone ever sees — before downscaling.
# Left in, the blur put a pale blue border around the Level Up card.
emit("pcf", "assets/paper/postcard-front.webp", 40, 60, (0.98, 0.98),
     rect=(0.025, 0.0478, 0.9457, 0.9044))
# 88px, more than twice the front's, because this is the only scan on the board
# that is LINE WORK: the engraved POST CARD plate, two ornamental scrolls, two
# printed rules, a full-height vertical divider, the stamp box and the owl
# vignette. High contrast at low spatial frequency is what survives a heavy
# downscale, and at 40px none of it did (the placeholder was a smear and all of
# it appeared at once when the scan landed). Squint-test error against the
# loaded card, both resampled to a common width so blur cancels: 7.81 -> 5.71
# at 88px, 9.18 -> 7.67 at 176px, 10.69 -> 9.88 at the card's full 2108 device
# px. 426 bytes, and first paint does not move. The front stays at 40 because
# its picture area is painted out above, so its placeholder is only the margin.
emit("pcb", "assets/paper/postcard-back.webp", 88, 68, (0.98, 0.98))
emit("stamp", STAMP, 24, 60, (0.78, 0.88))

for stem in ("sticky-01", "sticky-01-blue", "sticky-02", "sticky-02-blue",
             "sticky-03", "sticky-03-blue", "sticky-03-green", "sticky-04",
             "sticky-05", "sticky-05-pink", "sticky-06", "sticky-06-green",
             "sticky-07"):
    emit(stem, f"assets/paper/{stem}.webp", 20, 60, (0.91, 0.91))

print(f"\ntotal base64 characters: {TOTAL}", file=sys.stderr)
json.dump(OUT, sys.stdout, indent=1, sort_keys=True)
