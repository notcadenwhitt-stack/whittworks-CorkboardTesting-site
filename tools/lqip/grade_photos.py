"""Re-grade the two photographs the owner asked for, in place, once.

    python3 tools/lqip/grade_photos.py

Run against a clean checkout, not against its own output: it is idempotent in
effect only in the sense that running it twice grades a graded file.

WHY THESE TWO AND NOT THE THIRD. assets/chad.jpg was approved as-is, so it is
not touched. The other two were measured against it, and that is what made the
complaint concrete:

    caden.jpg     mean L 176.0   5th pct  59.9   95th pct 255.0   sd 80.7
    chad.jpg      mean L 111.4   5th pct  13.0   95th pct 245.0   sd 82.3
    levelup       mean L  50.1   5th pct   4.1   95th pct 221.0   sd 72.7

The founder portrait reads "too bright" because it has NO BLACK. Its darkest
five per cent sit at 60/255 where the approved portrait's sit at 13, so the
suit is flat charcoal instead of navy with shadow detail, and the whole frame
floats 65 levels above the picture next to it. The cure is a black point, not
less light: pull the floor down, ease the midtones, and leave the face where it
is. Goal 4 asks for clean bright portraits and specifically not grey, washed or
soft ones, which is an argument FOR this, not against it.

The Level Up screenshot is the opposite problem. It is already dark, but its
white lettering tops out at 221 and its blacks never reach zero, so it reads as
grey-on-grey rather than the high-contrast chrome the real page has. Blacks to
zero, highlights up toward paper white; the black pops because the white does.

    caden      black 42  white 248  gamma 0.86  highlight lift 0.10
    levelup    black 26  white 236  gamma 0.90  highlight lift 0.22

Both were chosen by the owner from a four-up comparison sheet (current, gentle,
medium, strong) rather than by anyone's eye here. Both are "strong".

THE GRADE BAKES INTO THE FILE, so it reaches both designs at once — the
editorial portrait and the polaroid on the board come from one JPEG. Two CSS
filters still sit on top per design and are deliberately left alone:
.pol-photo carries brightness(1.05) contrast(1.05) saturate(1.06), the small
print-punch the board's frames want, and .pc-picture carries
saturate(.72) contrast(.8) brightness(1.05) sepia(.12), which is the postcard's
print treatment and is meant to wash. Re-check both after running this.

AFTERWARDS the inline placeholders in css/style.css are stale, because they are
downscaled copies of these exact files:
    python3 tools/lqip/make_lqip.py
and replace the `caden` and `levelup` entries only.
"""
import numpy as np
from PIL import Image

GRADES = {
    "assets/caden.jpg": dict(black=42, white=248, gamma=0.86, hi_lift=0.10, quality=90),
    "assets/levelup-card-900.jpg": dict(black=26, white=236, gamma=0.90, hi_lift=0.22, quality=88),
}


def levels(img, black, white, gamma, hi_lift):
    """A photographic levels move, in the order a darkroom would do it: set the
    black and white points first, then bend the midtones, then lift the top."""
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    a = np.clip((a - black) * (255.0 / (white - black)), 0, 255)
    if gamma != 1.0:
        a = 255.0 * np.power(a / 255.0, 1.0 / gamma)
    if hi_lift:
        n = a / 255.0
        # gain that peaks in the upper mids and falls to zero at both ends, so
        # highlights gain separation instead of clipping into a flat white
        a = 255.0 * (n + hi_lift * n * n * (1.0 - n) * 4.0)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def stats(im):
    a = np.asarray(im.convert("RGB")).astype(float)
    L = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    return L.mean(), np.percentile(L, 5), np.percentile(L, 95), L.std()


if __name__ == "__main__":
    for path, g in GRADES.items():
        src = Image.open(path)
        before = stats(src)
        out = levels(src, g["black"], g["white"], g["gamma"], g["hi_lift"])
        out.save(path, "JPEG", quality=g["quality"], optimize=True, progressive=True)
        after = stats(Image.open(path))
        print("%-30s mean %5.1f -> %5.1f   5th %5.1f -> %5.1f   95th %5.1f -> %5.1f   sd %4.1f -> %4.1f"
              % (path, before[0], after[0], before[1], after[1],
                 before[2], after[2], before[3], after[3]))
