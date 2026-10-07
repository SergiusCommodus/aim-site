#!/usr/bin/env python3
"""Builds the AIM site. Writes docs/ (GitHub Pages) and artifact/ (preview). Every page is self contained."""
import base64, json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
FORM_ENDPOINT = os.environ.get("AIM_FORM_ENDPOINT", "")
BASE_URL = os.environ.get("AIM_BASE_URL", "https://sergiuscommodus.github.io/aim-site/")

def rd(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return f.read()

logo = "data:image/png;base64," + base64.b64encode(open(os.path.join(ROOT, "assets/aim-wordmark-white-sm.png"), "rb").read()).decode()
fav = "data:image/png;base64," + base64.b64encode(open(os.path.join(ROOT, "assets/favicon.png"), "rb").read()).decode()
HEAD = "\n".join([
    '<meta name="description" content="AIM, Artemis Investment Metrics: decision intelligence for real estate, small business, and personal finance.">',
    '<meta name="theme-color" content="#183364">',
    '<link rel="icon" type="image/png" href="%s">' % fav,
    '<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">',
    '<meta property="og:title" content="AIM | Artemis Investment Metrics">',
    '<meta property="og:description" content="Know if the deal works before you sign.">',
    '<meta property="og:image" content="%sassets/aim-logo-512.png">' % BASE_URL,
    '<meta property="og:type" content="website"><meta property="og:site_name" content="AIM"><meta name="twitter:card" content="summary">',
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,112,500;0,112,700;0,112,800;1,112,700;1,112,800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">',
])

def fill(t, extra=None):
    t = t.replace("{{CSS:shared}}", rd("shared.css")).replace("{{CSS:app}}", rd("app.css"))
    for js in ("engine", "learn", "app"):
        t = t.replace("{{JS:%s}}" % js, rd(js + ".js").replace("</script", "<\\/script"))
    t = t.replace("{{HEAD}}", HEAD).replace("{{LOGO}}", logo).replace("{{FORM_ENDPOINT}}", FORM_ENDPOINT)
    for k, v in (extra or {}).items():
        t = t.replace("{{%s}}" % k, v)
    left = re.findall(r"\{\{[A-Z:a-z_]+\}\}", t)
    if left:
        sys.exit("Unfilled placeholders: %s" % left)
    return t

pages = {
    "demo.html": fill(rd("demo.html")),
    "app.html": fill(rd("app.html")),
    "privacy.html": fill(rd("legal.html"), {"TITLE": "Privacy Policy", "BODY": rd("privacy.body.html")}),
    "terms.html": fill(rd("legal.html"), {"TITLE": "Terms of Use", "BODY": rd("terms.body.html")}),
    "404.html": fill(rd("legal.html"), {"TITLE": "Page Not Found", "BODY": '<p class="eyebrow">Error 404</p><h1>That page is not here.</h1><p class="upd">The link may be old or mistyped.</p><p style="margin-top:22px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="index.html">Go to the home page</a><a class="btn ghost" href="app.html">Open AIM</a></p>'}),
}
index_frag = fill(rd("index.html"))  # starts with <title>, has its own <style>
cut = index_frag.index("</style>") + len("</style>")
index_full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
              + HEAD + "\n" + index_frag[:cut] + "\n</head>\n<body>\n" + index_frag[cut:] + "\n</body>\n</html>\n")

for out, idx in (("docs", index_full), ("artifact", index_frag)):
    d = os.path.join(ROOT, out)
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(os.path.join(d, "assets"))
    with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
        f.write(idx)
    for n, html in pages.items():
        with open(os.path.join(d, n), "w", encoding="utf-8") as f:
            f.write(html)
    for a in ("aim-logo-512.png", "apple-touch-icon.png", "favicon.png", "aim-wordmark-white-sm.png"):
        shutil.copy(os.path.join(ROOT, "assets", a), os.path.join(d, "assets", a))

open(os.path.join(ROOT, "docs", ".nojekyll"), "w").close()
with open(os.path.join(ROOT, "docs", "robots.txt"), "w") as f:
    f.write("User-agent: *\nAllow: /\nDisallow: /app.html\nSitemap: %ssitemap.xml\n" % BASE_URL)
with open(os.path.join(ROOT, "docs", "sitemap.xml"), "w") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join("  <url><loc>%s%s</loc></url>\n" % (BASE_URL, p) for p in ["", "demo.html", "privacy.html", "terms.html"]) + "</urlset>\n")

print("built", {n: len(v) for n, v in dict(pages, **{"index.html": index_full}).items()})
