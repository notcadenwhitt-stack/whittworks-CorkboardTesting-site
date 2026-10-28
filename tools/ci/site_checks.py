"""Safety checks for the built copy of whittworkstudios.com, run by CI.

    python3 -I site_checks.py csp   SITE_DIR BASELINE.json
    python3 -I site_checks.py links SITE_DIR
    python3 -I site_checks.py built SITE_DIR

Two identical copies, each with its baseline: tools/ci/ in
whittworks-CorkboardTesting-site (checks a fresh build) and .github/safety/ in
whittworks-site (checks what is live). Change both together.

Standard library only, so CI installs nothing to run it. Exit status 1 means
the check failed; every problem is printed before exiting, so one red line
never hides another.

csp    Every page carries a meta Content-Security-Policy, and no page's policy
       is looser than the committed baseline. Loosening means a new source in
       any directive, a directive dropped (it would fall back to default-src),
       or anything on the never-allowed list. Tightening passes. Inline
       scripts must each be allowed by their exact sha256, so an edited head
       script with a stale hash fails here instead of blanking the board.
       To loosen on purpose, edit the baseline in the same pull request, where
       the change is visible.

links  Every same-site href, src, srcset, poster and CSS url() points at a file
       that exists, and every sitemap.xml URL maps to a page.

built  The tree is the built copy (tools/release/build.py) and not the source:
       no docs, no tools/, no HTML or CSS comments left in. CNAME is exactly
       whittworkstudios.com and the Search Console file is present, since
       losing either takes the domain or the verification down.
"""
import base64
import hashlib
import json
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

DOMAIN = "whittworkstudios.com"
SEARCH_CONSOLE = "google315fb002ce779429.html"
REQUIRED = ["index.html", "404.html", "privacy.html", "terms.html",
            "accessibility.html", "robots.txt", "sitemap.xml", "CNAME", SEARCH_CONSOLE]
# Never allowed in any directive, whatever the baseline says.
NEVER = {"'unsafe-eval'", "'unsafe-hashes'", "'strict-dynamic'", "*", "http:", "https:", "data:", "blob:"}
NEVER_EXCEPT = {"img-src": {"data:"}}  # the board's LQIP placeholders are data: images
SKIP_DIRS = {".git", ".github", "node_modules"}

problems = []


def fail(msg):
    problems.append(msg)


def pages(root):
    out = []
    for base, dirs, names in os.walk(root):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
        for n in sorted(names):
            if n.endswith(".html") and not re.fullmatch(r"google[0-9a-f]+\.html", n):
                out.append(os.path.relpath(os.path.join(base, n), root))
    return out


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


class Page(HTMLParser):
    """Collects the CSP meta, inline script bodies and every URL attribute."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.csp, self.scripts, self.urls, self.styles = [], [], [], []
        self._script = self._style = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta" and (a.get("http-equiv") or "").lower() == "content-security-policy":
            self.csp.append(a.get("content") or "")
        if tag == "script" and "src" not in a and (a.get("type") or "text/javascript") in ("text/javascript", "module"):
            self._script = []
        if tag == "style":
            self._style = []
        for k in ("href", "src", "poster", "data-src"):
            if a.get(k):
                self.urls.append(a[k])
        for k in ("srcset", "imagesrcset"):
            for part in (a.get(k) or "").split(","):
                if part.strip():
                    self.urls.append(part.strip().split()[0])
        if a.get("style"):
            self.styles.append(a["style"])

    def handle_endtag(self, tag):
        if tag == "script" and self._script is not None:
            self.scripts.append("".join(self._script))
            self._script = None
        if tag == "style" and self._style is not None:
            self.styles.append("".join(self._style))
            self._style = None

    def handle_data(self, data):
        if self._script is not None:
            self._script.append(data)
        if self._style is not None:
            self._style.append(data)


def parse(root, rel):
    p = Page()
    p.feed(read(os.path.join(root, rel)))
    return p


def policy(text):
    out = {}
    for part in text.split(";"):
        bits = part.split()
        if bits:
            out[bits[0].lower()] = set(bits[1:])
    return out


def inline_hash(body):
    return "'sha256-" + base64.b64encode(hashlib.sha256(body.encode("utf-8")).digest()).decode() + "'"


def check_csp(root, baseline_path):
    baseline = json.loads(read(baseline_path))
    for rel in pages(root):
        p = parse(root, rel)
        if len(p.csp) != 1:
            fail("%s: expected one CSP meta tag, found %d" % (rel, len(p.csp)))
            continue
        have = policy(p.csp[0])
        if rel not in baseline:
            fail("%s: no CSP baseline for this page; add it to the baseline file" % rel)
            continue
        want = {k: set(v) for k, v in baseline[rel].items()}
        for d, allowed in want.items():
            if d not in have:
                fail("%s: directive %s was removed (it would fall back to default-src)" % (rel, d))
                continue
            for src in sorted(have[d] - allowed):
                if src.startswith("'sha256-") and any(a.startswith("'sha256-") for a in allowed):
                    continue  # a hash may change; the inline-script check below pins it
                fail("%s: %s gained %s, looser than the baseline" % (rel, d, src))
        for d in sorted(set(have) - set(want)):
            fail("%s: new directive %s is not in the baseline" % (rel, d))
        for d, srcs in have.items():
            for src in sorted(srcs & (NEVER - NEVER_EXCEPT.get(d, set()))):
                fail("%s: %s allows %s, which is never allowed" % (rel, d, src))
        script = have.get("script-src", have.get("default-src", set()))
        if "'unsafe-inline'" in script:
            fail("%s: script-src allows 'unsafe-inline'" % rel)
        hashes = {s for s in script if s.startswith("'sha256-")}
        if len(hashes) > len({s for s in want.get("script-src", set()) if s.startswith("'sha256-")}):
            fail("%s: script-src carries more hashes than the baseline" % rel)
        for body in p.scripts:
            h = inline_hash(body)
            if h not in hashes:
                fail("%s: inline script %s is not in script-src, so the browser will block it" % (rel, h))


def local_target(root, page_rel, url):
    """The file a same-site URL resolves to, or None for an off-site URL."""
    if unquote(url.strip()).startswith("#"):
        return None  # a fragment, including url(%23id) inside an inline SVG data URI
    parts = urlsplit(url.strip())
    if parts.scheme in ("mailto", "tel", "data", "javascript", "blob"):
        return None
    if parts.scheme or parts.netloc:
        if parts.netloc.lower() not in (DOMAIN, "www." + DOMAIN):
            return None
    path = unquote(parts.path)
    if not path:
        return None  # a bare #fragment or ?query on the same page
    if path.startswith("/"):
        target = os.path.join(root, path.lstrip("/"))
    else:
        target = os.path.join(root, os.path.dirname(page_rel), path)
    target = os.path.normpath(target)
    if path.endswith("/") or os.path.isdir(target):
        target = os.path.join(target, "index.html")
    return target


def check_links(root):
    for rel in pages(root):
        p = parse(root, rel)
        urls = list(p.urls)
        for css in p.styles:
            urls += re.findall(r"url\(\s*['\"]?([^'\")]+)", css)
        for url in urls:
            t = local_target(root, rel, url)
            if t and not os.path.isfile(t):
                fail("%s: link to %s, which does not exist" % (rel, url))
    for base, dirs, names in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for n in names:
            if n.endswith(".css"):
                rel = os.path.relpath(os.path.join(base, n), root)
                for url in re.findall(r"url\(\s*['\"]?([^'\")]+)", read(os.path.join(base, n))):
                    t = local_target(root, rel, url)
                    if t and not os.path.isfile(t):
                        fail("%s: url(%s), which does not exist" % (rel, url))
    sitemap = os.path.join(root, "sitemap.xml")
    if os.path.isfile(sitemap):
        for url in re.findall(r"<loc>([^<]+)</loc>", read(sitemap)):
            t = local_target(root, "sitemap.xml", url)
            if t is None or not os.path.isfile(t):
                fail("sitemap.xml: %s does not map to a page in this site" % url)


def check_built(root):
    for name in REQUIRED:
        if not os.path.isfile(os.path.join(root, name)):
            fail("%s is missing" % name)
    cname = os.path.join(root, "CNAME")
    if os.path.isfile(cname) and read(cname).strip() != DOMAIN:
        fail("CNAME is %r, expected %r" % (read(cname).strip(), DOMAIN))
    for base, dirs, names in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        rel_base = os.path.relpath(base, root)
        if rel_base.split(os.sep)[0] in ("tools", "docs"):
            fail("%s/ is in the tree; the built copy never ships it" % rel_base)
            dirs[:] = []
            continue
        for n in names:
            rel = os.path.normpath(os.path.join(rel_base, n))
            if n.endswith(".md") or n == ".ww-build" or n == "board-snapshot.json":
                fail("%s is a source file; the built copy never ships it" % rel)
            elif n.endswith(".html") and not re.fullmatch(r"google[0-9a-f]+\.html", n):
                text = re.sub(r"<(script|style)\b.*?</\1>", "", read(os.path.join(base, n)), flags=re.S | re.I)
                if "<!--" in text or "-->" in text:
                    fail("%s still has an HTML comment; this looks like the source tree, not build.py output" % rel)
            elif n.endswith(".css") and "/*" in read(os.path.join(base, n)):
                fail("%s still has a CSS comment; this looks like the source tree, not build.py output" % rel)


def main():
    cmds = {"csp": (check_csp, 2), "links": (check_links, 1), "built": (check_built, 1)}
    if len(sys.argv) < 3 or sys.argv[1] not in cmds or len(sys.argv) - 2 != cmds[sys.argv[1]][1]:
        sys.exit(__doc__)
    fn, _ = cmds[sys.argv[1]]
    fn(*sys.argv[2:])
    for msg in problems:
        print("FAIL " + msg)
    if problems:
        sys.exit(1)
    print("ok: %s" % sys.argv[1])


if __name__ == "__main__":
    main()
