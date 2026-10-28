"""Print the sha256 CSP source for index.html's inline bootstrap script and
check that the Content-Security-Policy meta carries it.

Run from the repo root:  python3 -I tools/release/csp_hash.py
Exit status 1 means the hash in the CSP is stale (the script was edited).
"""
import base64
import hashlib
import re
import sys

html = open("index.html", encoding="utf-8").read()
body = re.search(r"<script>(.*?)</script>", html, re.S).group(1)
source = "'sha256-" + base64.b64encode(hashlib.sha256(body.encode("utf-8")).digest()).decode() + "'"
csp = re.search(r'<meta http-equiv="Content-Security-Policy" content="([^"]*)">', html).group(1)
print(source)
if source not in csp:
    print("STALE: the CSP does not carry this hash; the board will not load.", file=sys.stderr)
    sys.exit(1)
print("ok: CSP matches the inline script")
