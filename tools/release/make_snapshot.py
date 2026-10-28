"""Render the click-flight snapshot and record what it was rendered from.

    python3 tools/release/make_snapshot.py

Runs `node tools/verify/cdp.mjs snapshot` (headless Chrome renders the board
at rest as four tiles), stitches and encodes them to
assets/board-snapshot.webp at 2400x1600, and
writes assets/board-snapshot.json with a hash of every input that changes how
the board looks. tools/release/build.py refuses to build when that hash no
longer matches, so a stale snapshot can never ship: a flight would show the
old board for a moment before the new one landed on top of it.

Run with plain python3 (not -I): it needs Pillow from the user site.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "assets", "board-snapshot.webp")
MANIFEST = os.path.join(ROOT, "assets", "board-snapshot.json")


def inputs_hash():
    """Every file that changes how the board looks, in a fixed order. The
    snapshot's own cache-busting query in index.html is blanked first, or
    bumping it would make the snapshot stale by definition."""
    h = hashlib.sha256()
    files = ["index.html", "css/style.css", "js/hand.js"]
    for sub in ("assets/paper", "assets/fonts"):
        files += sorted(os.path.join(sub, f) for f in os.listdir(os.path.join(ROOT, sub)))
    files += sorted(os.path.join("assets", f) for f in os.listdir(os.path.join(ROOT, "assets"))
                    if f.endswith((".webp", ".jpg", ".png")) and not f.startswith("board-snapshot"))
    for rel in files:
        data = open(os.path.join(ROOT, rel), "rb").read()
        if rel == "index.html":
            data = re.sub(rb"board-snapshot\.webp\?v=\d+", b"board-snapshot.webp", data)
        h.update(rel.encode() + b"\0" + hashlib.sha256(data).digest())
    return h.hexdigest()


def main():
    from PIL import Image
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["node", "tools/verify/cdp.mjs", "snapshot", tmp], cwd=ROOT, check=True)
        im = Image.new("RGB", (2400, 1600))
        for i in (0, 1):
            for j in (0, 1):
                tile = Image.open(os.path.join(tmp, "tile-%d-%d.png" % (i, j))).convert("RGB")
                if tile.size != (1200, 800):
                    sys.exit("unexpected tile size %dx%d" % tile.size)
                im.paste(tile, (i * 1200, j * 800))
        im.save(OUT, "WEBP", quality=65, method=6)
    json.dump({"inputs_sha256": inputs_hash(), "size": [2400, 1600]}, open(MANIFEST, "w"), indent=2)
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
