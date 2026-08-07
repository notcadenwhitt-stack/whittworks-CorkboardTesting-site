"""Render the wall-map background. Original artwork, no third-party asset.

Full bleed: the map IS the wall surface, edges running off frame. That makes
background-size:cover behave at every viewport aspect (a crop of a wall map is
still a wall map) and removes the stray straight line a poster edge would draw
across the few centimetres of wall that are actually visible around the board.
"""
import math, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coasts import LAND, SEAS, ISLANDS, SPECKS

OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/wall.png"
W = int(os.environ.get("WALL_W", 2000))
SS = 3
LAT_N, LAT_S = 84.0, -60.0

def _env(name, default):
    v = os.environ.get(name)
    return tuple(int(x) for x in v.split(",")) if v else default

P = dict(
    ocean   = _env("C_OCEAN",   (27, 42, 58)),
    ocean_d = _env("C_OCEAND",  (21, 34, 48)),
    land    = _env("C_LAND",    (56, 71, 82)),
    coast   = _env("C_COAST",   (96, 114, 126)),
    grat    = _env("C_GRAT",    (62, 92, 116)),
    grat_a  = float(os.environ.get("C_GRATA", 0.55)),
)


def miller(lon, lat):
    lat = max(-89.0, min(89.0, lat))
    return math.radians(lon), 1.25 * math.log(math.tan(math.pi / 4 + 0.4 * math.radians(lat)))


X0, Y1 = miller(-180, LAT_N)
X1, Y0 = miller(180, LAT_S)
ASPECT = (X1 - X0) / (Y1 - Y0)
H = int(round(W / ASPECT))


def proj(lon, lat, s=1):
    x, y = miller(lon, lat)
    return (((x - X0) / (X1 - X0)) * W * s, ((Y1 - y) / (Y1 - Y0)) * H * s)


def poly(pts, s=1):
    return [proj(p[0], p[1], s) for p in pts]


def smooth_noise(w, h, cells, seed, blur):
    rng = np.random.default_rng(seed)
    small = rng.random((max(2, h // cells), max(2, w // cells))).astype(np.float32)
    im = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    im = im.filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(im).astype(np.float32) / 255.0
    return (a - a.mean()) / (a.std() + 1e-6)


def build():
    sw, sh = W * SS, H * SS
    base = Image.new("RGB", (sw, sh), P["ocean"])

    # deep-water shading in the big basins: keeps the ocean from reading as a
    # flat swatch without adding anything a viewer has to look at
    deep = Image.new("L", (sw, sh), 0)
    dd = ImageDraw.Draw(deep)
    for cx, cy, rx, ry in [(-35, 5, 26, 40), (-150, 5, 42, 45), (-140, -30, 40, 30),
                           (170, -25, 36, 34), (75, -30, 32, 28), (-125, 45, 24, 20),
                           (0, -48, 70, 12), (60, 10, 18, 18)]:
        a = proj(cx - rx, cy + ry, SS)
        b = proj(cx + rx, cy - ry, SS)
        dd.ellipse([a[0], a[1], b[0], b[1]], fill=150)
    deep = deep.filter(ImageFilter.GaussianBlur(60 * SS / 3))
    base = Image.composite(Image.new("RGB", (sw, sh), P["ocean_d"]), base, deep)

    # --- graticule, under the land ------------------------------------
    gl = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gl)
    lw = max(1, int(1.1 * SS))
    for lon in range(-180, 181, 20):
        gd.line([proj(lon, la, SS) for la in np.linspace(LAT_S, LAT_N, 60)],
                fill=P["grat"] + (255,), width=lw)
    for lat in range(-40, 81, 20):
        gd.line([proj(lo, lat, SS) for lo in np.linspace(-180, 180, 80)],
                fill=P["grat"] + (255,), width=lw)
    gd.line([proj(lo, 0, SS) for lo in np.linspace(-180, 180, 80)],
            fill=P["grat"] + (255,), width=int(lw * 1.7))
    gl.putalpha(gl.getchannel("A").point(lambda v: int(v * P["grat_a"])))
    base = Image.alpha_composite(base.convert("RGBA"), gl).convert("RGB")
    d = ImageDraw.Draw(base)

    # --- land / seas / islands ----------------------------------------
    for pts in LAND.values():
        d.polygon(poly(pts, SS), fill=P["land"])
    for pts in SEAS.values():
        d.polygon(poly(pts, SS), fill=P["ocean"])
    for pts in ISLANDS.values():
        if pts:
            d.polygon(poly(pts, SS), fill=P["land"])
    for lon, lat, r in SPECKS:
        if r <= 0:
            continue
        a = proj(lon - r, lat + r * 0.8, SS)
        b = proj(lon + r, lat - r * 0.8, SS)
        d.ellipse([a[0], a[1], b[0], b[1]], fill=P["land"])

    # --- coastline stroke ---------------------------------------------
    cw = max(1, int(1.15 * SS))
    for group in (LAND, SEAS, ISLANDS):
        for pts in group.values():
            if not pts:
                continue
            p = poly(pts, SS)
            d.line(p + [p[0]], fill=P["coast"], width=cw, joint="curve")

    im = base.resize((W, H), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)

    # --- surface ------------------------------------------------------
    # low-frequency mottle = uneven paper/plaster; high-frequency tooth is
    # left to the CSS noise layer, which costs no bytes here.
    n1 = smooth_noise(W, H, 24, 7, 8)
    n2 = smooth_noise(W, H, 7, 21, 1.6)
    a *= (1.0 + 0.055 * n1 + 0.020 * n2)[..., None]

    # a broad sheen high on the sheet, the paper catching the same key light
    yy = np.linspace(0, 1, H)[:, None]
    xx = np.linspace(0, 1, W)[None, :]
    sheen = np.exp(-(((yy - 0.26) ** 2) / (2 * 0.20 ** 2) +
                     ((xx - 0.36) ** 2) / (2 * 0.42 ** 2))) * 0.07
    a *= (1.0 + sheen)[..., None]

    out = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    # A whisper of defocus. Two jobs: the camera is focused on the board, not
    # the wall behind it, and it takes the hard vector edge off polygons that
    # were drawn by hand — printed ink on paper, not a filled path.
    blur = float(os.environ.get("C_BLUR", 1.1)) * (W / 2000.0)
    if blur > 0:
        out = out.filter(ImageFilter.GaussianBlur(blur))
    return out


if __name__ == "__main__":
    img = build()
    if OUT.endswith(".webp"):
        img.save(OUT, "WEBP", quality=int(os.environ.get("C_Q", 76)), method=6)
    else:
        img.save(OUT)
    arr = np.asarray(img).astype(np.float32).reshape(-1, 3)
    print("size", img.size, "aspect %.3f" % ASPECT)
    print("mean rgb", tuple(round(float(v), 1) for v in arr.mean(0)))
    print("median rgb", tuple(int(v) for v in np.median(arr, 0)))
    lum = arr @ np.array([0.2126, 0.7152, 0.0722])
    print("luma mean %.1f sd %.1f  p1 %.0f p99 %.0f"
          % (lum.mean(), lum.std(), np.percentile(lum, 1), np.percentile(lum, 99)))
    print("->", OUT)
