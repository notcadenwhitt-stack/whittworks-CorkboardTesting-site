"""Build the public copy of the site: the files a visitor can fetch, with the
source comments stripped out.

The comments in this repo are its working notes (why each trap exists, what
was measured, what was rejected), and they are most of the bytes: about 80KB
of css/style.css's 131KB was comment. Visitors never need them, so the
shipped copy drops them while the source keeps every word.

    python3 -I tools/release/build.py OUT_DIR            # production copy
    python3 -I tools/release/build.py OUT_DIR --staging  # no CNAME, noindex

OUT_DIR must not exist yet, or must be a folder this script built before
(it carries a .ww-build marker). Anything else is refused, never deleted:
an earlier version would rmtree whatever path it was given.

What is stripped: /* */ comments in CSS, // and /* */ comments in JS, and
<!-- --> comments in HTML outside <script> and <style>. Nothing else is
rewritten. Inline <script> bodies are copied byte for byte, because the CSP
allows the head script by its sha256 and any edit would break the board.
Docs (*.md) and tools/ never ship.

After building, run the harness against the output, not the source:
    SITE_ROOT=OUT_DIR node tools/verify/cdp.mjs modes
"""
import argparse
import gzip
import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PAGES = ["index.html", "404.html", "privacy.html", "terms.html", "accessibility.html"]
EXTRA = ["robots.txt", "sitemap.xml", "CNAME"]
DIRS = ["css", "js", "assets"]


def strip_css(src):
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c in "\"'":
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == "\\" else 1
            out.append(src[i:j + 1])
            i = j + 1
        elif src.startswith("/*", i):
            j = src.find("*/", i + 2)
            i = n if j == -1 else j + 2
        else:
            out.append(c)
            i += 1
    return tidy("".join(out))


REGEX_BEFORE = set("(,=:[!&|?{};+-*%<>~^")
REGEX_WORDS = ("return", "typeof", "case", "in", "of", "delete", "void", "throw", "new")


def strip_js(src):
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c in "\"'`":
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == "\\" else 1
            out.append(src[i:j + 1])
            i = j + 1
        elif src.startswith("//", i):
            j = src.find("\n", i)
            i = n if j == -1 else j
        elif src.startswith("/*", i):
            j = src.find("*/", i + 2)
            i = n if j == -1 else j + 2
        elif c == "/" and regex_allowed(out):
            j, in_class = i + 1, False
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if src[j] == "[":
                    in_class = True
                elif src[j] == "]":
                    in_class = False
                elif src[j] == "/" and not in_class:
                    break
                j += 1
            j += 1
            while j < n and src[j].isalpha():
                j += 1
            out.append(src[i:j])
            i = j
        else:
            out.append(c)
            i += 1
    return tidy("".join(out))


def regex_allowed(out):
    text = "".join(out[-40:]).rstrip()
    if not text:
        return True
    if text[-1] in REGEX_BEFORE:
        return True
    return any(re.search(r"(^|[^\w$])" + w + r"$", text) for w in REGEX_WORDS)


def strip_html(src):
    # Only the markup between <script> and <style> blocks is touched, and that
    # includes whitespace: tidying inside the head script changed its bytes,
    # its sha256 stopped matching the CSP, and the board never chose a design.
    parts = re.split(r"(<script\b.*?</script>|<style\b.*?</style>)", src, flags=re.S | re.I)
    for k in range(0, len(parts), 2):
        parts[k] = tidy(re.sub(r"<!--.*?-->", "", parts[k], flags=re.S), edges=False)
    return "".join(parts).strip("\n") + "\n"


def tidy(text, edges=True):
    lines = [line.rstrip() for line in text.split("\n")]
    kept, blank = [], False
    for line in lines:
        if not line:
            if blank:
                continue
            blank = True
        else:
            blank = False
        kept.append(line)
    joined = "\n".join(kept)
    return joined.strip("\n") + "\n" if edges else joined


def staging_page(html):
    tag = '<meta name="robots" content="noindex, nofollow">'
    if 'name="robots"' in html:
        return re.sub(r'<meta name="robots" content="[^"]*">', tag, html)
    return html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + tag, 1)


MARKER = ".ww-build"


def same_or_inside(path, parent):
    # Lowercased on purpose: macOS volumes are case-insensitive by default,
    # realpath does not fix the case of a path that does not exist yet, and
    # normcase is a no-op there, so "/USERS/.../repo/x" slipped past this.
    path = os.path.realpath(path).lower()
    parent = os.path.realpath(parent).lower()
    return path == parent or path.startswith(parent + os.sep)


def snapshot_is_current():
    """The click-flight snapshot must show today's board. make_snapshot.py
    records a hash of every visual input; refuse to build if it moved."""
    manifest = os.path.join(ROOT, "assets", "board-snapshot.json")
    if not os.path.exists(manifest):
        return False
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from make_snapshot import inputs_hash
    return json.load(open(manifest))["inputs_sha256"] == inputs_hash()


def main():
    parser = argparse.ArgumentParser(description="Build the public copy of the site.")
    parser.add_argument("out", help="output folder: new, or one this script built before")
    parser.add_argument("--staging", action="store_true", help="drop CNAME and add noindex")
    parser.add_argument("--allow-stale-snapshot", action="store_true",
                        help="build even if assets/board-snapshot.webp predates the board's look")
    args = parser.parse_args()
    if not args.allow_stale_snapshot and not snapshot_is_current():
        sys.exit("refusing: assets/board-snapshot.webp is stale; run python3 tools/release/make_snapshot.py")
    out, staging = os.path.abspath(args.out), args.staging
    if same_or_inside(out, ROOT) or same_or_inside(ROOT, out):
        sys.exit("refusing: the output folder overlaps the repo")
    if os.path.exists(out):
        if os.listdir(out) and not os.path.isfile(os.path.join(out, MARKER)):
            sys.exit("refusing: %s exists and was not built by this script; pick a new folder" % out)
        shutil.rmtree(out)
    os.makedirs(out)
    open(os.path.join(out, MARKER), "w").write("built by tools/release/build.py\n")

    before = after = 0
    files = [p for p in PAGES + EXTRA if os.path.exists(os.path.join(ROOT, p))]
    # Google Search Console's ownership file. It must stay at the site root,
    # byte for byte, or the property loses verification.
    files += sorted(f for f in os.listdir(ROOT) if re.fullmatch(r"google[0-9a-f]+\.html", f))
    for d in DIRS:
        for base, _, names in os.walk(os.path.join(ROOT, d)):
            for name in names:
                if name.endswith(".md") or name.startswith(".") or name == "board-snapshot.json":
                    continue
                files.append(os.path.relpath(os.path.join(base, name), ROOT))
    if staging and "CNAME" in files:
        files.remove("CNAME")

    for rel in sorted(files):
        src_path, dst_path = os.path.join(ROOT, rel), os.path.join(out, rel)
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        raw = open(src_path, "rb").read()
        data = raw
        if rel.endswith((".css", ".js", ".html")):
            text = raw.decode("utf-8")
            if rel.endswith(".css"):
                text = strip_css(text)
            elif rel.endswith(".js"):
                text = strip_js(text)
            elif re.fullmatch(r"google[0-9a-f]+\.html", os.path.basename(rel)):
                pass
            else:
                text = strip_html(text)
                if staging:
                    text = staging_page(text)
            data = text.encode("utf-8")
            before += len(gzip.compress(raw, 9))
            after += len(gzip.compress(data, 9))
        open(dst_path, "wb").write(data)

    print("%d files -> %s%s" % (len(files), out, " (staging)" if staging else ""))
    print("text files gzipped: %d -> %d bytes" % (before, after))


if __name__ == "__main__":
    main()
