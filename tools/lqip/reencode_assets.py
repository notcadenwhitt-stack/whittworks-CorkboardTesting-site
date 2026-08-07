"""Re-encode the four scans whose bytes buy nothing you can see.

Runs ONCE, in place, from the repo root. Idempotent in effect but not in bytes,
so run it against a clean checkout, not against its own output.

After it runs, tools/lqip/make_lqip.py no longer regenerates the `pcf`
placeholder that is pasted into css/style.css, because that placeholder was
built from the untouched postcard-front scan and this flattens it. Measured,
the regenerated thumbnail differs from the shipped one by a mean of 0.14 and
a max of 14 levels across 40x26 pixels, which is invisible, but it means the
shipped `pcf` string is now the authority and make_lqip.py is not.

    python3 tools/lqip/reencode_assets.py

THE TAPE. tape-3/4/7 shipped with a LOSSLESS alpha channel, which is where
almost all of their weight was: 0.29-0.36 bytes per pixel for three strips a
few hundred pixels wide. Masking tape is exactly the wrong subject for a
lossless mask. It is a torn, feathered edge over a body that is uniformly
alpha ~228, so the mask is smooth everywhere the eye can check it. Dropping
alpha_quality to 65 at native resolution takes 86,866 bytes to 41,828 and
costs, measured against the untouched file resampled to the size the tape
actually occupies on screen at 1512x982 dsf2, a mean channel error of
0.22-0.91 levels and a 99th percentile of 3.0-4.8. Native pixel dimensions are
unchanged, so nothing is softened; only the alpha ramp is quantised.

Why it matters: tape is the one photographed thing on this board that CANNOT
have a placeholder. It is translucent, so any layer under it still reads
through on the finished board (see the tape note at the top of css/style.css),
which leaves it arriving out of bare cork: 3.16% of the frame at stop 4
changing by a mean of 100.5 levels, the largest per-pixel arrival on the page.
The answer is to land it before the first paint instead, which is what the
three preloads in index.html do, and halving its weight is what makes those
preloads cheap enough to add.

THE WORK POSTCARD. postcard-front.webp is 1400x900 and 206,980 bytes, and
82% of its area is never seen by anyone: .pc-picture lays the Level Up shot
over left 2.5% / top 4.78% / 94.57% x 90.44% of the card, opaque, with
.pc-grain and .postcard-front::after over that again. Only the margin and the
deckled edge are ever on screen. Filling that region with the median of the
stock that does show, inset 10px so the boundary keeps real pixels for the
resampler, takes the file to 47,742 bytes. Verified by diffing the fully
loaded board at all eight stops before and after: no pixel changes by more
than the run-to-run raster noise of this page, including with
levelup-card-900.jpg blocked entirely, because .pc-picture carries its own
placeholder over an opaque #333236 fill.
"""
import os

import numpy as np
from PIL import Image

Q, AQ = 88, 65


def resave(path, quality=Q, alpha_quality=AQ):
    before = os.path.getsize(path)
    Image.open(path).convert("RGBA").save(
        path, "WEBP", quality=quality, alpha_quality=alpha_quality, method=6)
    print(f"{path:38s} {before:7d} -> {os.path.getsize(path):7d} B "
          f"({100 * os.path.getsize(path) / before:.0f}%)")


for stem in ("tape-3", "tape-4", "tape-7"):
    resave(f"assets/paper/{stem}.webp")

# The rect .pc-picture covers, from css/style.css, inset by FEATHER source
# pixels on every side so the edge the resampler sees is still real stock.
RECT = (0.025, 0.0478, 0.9457, 0.9044)
FEATHER = 10
path = "assets/paper/postcard-front.webp"
a = np.asarray(Image.open(path).convert("RGBA")).copy()
h, w = a.shape[:2]
x0 = round(RECT[0] * w) + FEATHER
y0 = round(RECT[1] * h) + FEATHER
x1 = round((RECT[0] + RECT[2]) * w) - FEATHER
y1 = round((RECT[1] + RECT[3]) * h) - FEATHER
outside = np.ones((h, w), bool)
outside[y0:y1, x0:x1] = False
fill = np.median(a[..., :3][(a[..., 3] >= 250) & outside], axis=0)
a[y0:y1, x0:x1, :3] = fill
before = os.path.getsize(path)
Image.fromarray(a).save(path, "WEBP", quality=Q, alpha_quality=AQ, method=6)
print(f"{path:38s} {before:7d} -> {os.path.getsize(path):7d} B "
      f"({100 * os.path.getsize(path) / before:.0f}%)  fill {tuple(int(v) for v in fill)}")
