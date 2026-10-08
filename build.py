#!/usr/bin/env python3
"""Builds the AIM site. Writes docs/ (GitHub Pages) and artifact/ (preview). Every page is self contained."""
import base64, hashlib, json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
FORM_ENDPOINT = os.environ.get("AIM_FORM_ENDPOINT", "")
FONTS_URL = "https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,112,500;0,112,700;0,112,800;1,112,700;1,112,800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
BASE_URL = os.environ.get("AIM_BASE_URL", "https://sergiuscommodus.github.io/aim-site/")

def rd(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return f.read()

logo = "assets/aim-wordmark-white-sm.png"  # one cached file instead of a base64 copy in every page
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
    # fonts load without blocking the first paint; display=swap shows system text until they arrive
    '<link rel="preload" as="style" href="%s"><link rel="stylesheet" href="%s" media="print" onload="this.media=\'all\'"><noscript><link rel="stylesheet" href="%s"></noscript>' % ((FONTS_URL,) * 3),
])

MIN = {"css": {}, "js": {}}
def minify_all():
    """Minify every CSS and JS source once, through minify.js (terser and csso). Falls back to the originals."""
    css = ["shared.css", "app.css", "ticker.css"]; js = ["engine.js", "learn.js", "app.js"]
    try:
        r = subprocess.run(["node", os.path.join(ROOT, "minify.js")], input=json.dumps({"css": [rd(n) for n in css], "js": [rd(n) for n in js]}), capture_output=True, text=True, timeout=120)
        if r.returncode != 0: raise RuntimeError(r.stderr[:400])
        out = json.loads(r.stdout)
        MIN["css"] = dict(zip(css, out["css"])); MIN["js"] = dict(zip(js, out["js"]))
        print("minified:", ", ".join("%s %dK" % (n, len(MIN["css"][n]) // 1024) for n in css), "|", ", ".join("%s %dK" % (n, len(MIN["js"][n]) // 1024) for n in js))
    except Exception as e:
        print("minify skipped (run npm install to enable):", str(e)[:200])
def src_css(n): return MIN["css"].get(n) or rd(n)
def src_js(n): return MIN["js"].get(n) or rd(n)
minify_all()

def fill(t, extra=None):
    t = re.sub(r"\{\{CSS:([a-z]+)\}\}", lambda m: src_css(m.group(1) + ".css"), t)
    t = t.replace("{{TICKER}}", rd("ticker.html"))
    for js in ("engine", "learn", "app"):
        t = t.replace("{{JS:%s}}" % js, src_js(js + ".js").replace("</script", "<\\/script"))
    t = t.replace("{{HEAD}}", HEAD).replace("{{LOGO}}", logo).replace("{{FORM_ENDPOINT}}", FORM_ENDPOINT)
    for k, v in (extra or {}).items():
        t = t.replace("{{%s}}" % k, v)
    left = re.findall(r"\{\{[A-Z:a-z_]+\}\}", t)
    if left:
        sys.exit("Unfilled placeholders: %s" % left)
    return t

# The app's JavaScript ships as one external file named by its content hash, so browsers cache it across visits
# and the page itself paints before the script arrives.
APP_JS = (src_js("engine.js") + "\n" + src_js("learn.js") + "\n" + src_js("app.js")).replace("{{FORM_ENDPOINT}}", FORM_ENDPOINT)
APP_JS_NAME = "app.%s.js" % hashlib.sha1(APP_JS.encode("utf-8")).hexdigest()[:10]
app_html = rd("app.html")
app_html = re.sub(r"<script>\s*\{\{JS:engine\}\}\s*\{\{JS:learn\}\}\s*\{\{JS:app\}\}\s*</script>", '<script src="assets/%s" defer></script>' % APP_JS_NAME, app_html)
pages = {
    "demo.html": fill(rd("demo.html")),
    "app.html": fill(app_html),
    "privacy.html": fill(rd("legal.html"), {"TITLE": "Privacy Policy", "BODY": rd("privacy.body.html")}),
    "terms.html": fill(rd("legal.html"), {"TITLE": "Terms of Use", "BODY": rd("terms.body.html")}),
    "404.html": fill(rd("legal.html"), {"TITLE": "Page Not Found", "BODY": '<p class="eyebrow">Error 404</p><h1>That page is not here.</h1><p class="upd">The link may be old or mistyped.</p><p style="margin-top:22px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="index.html">Go to the home page</a><a class="btn ghost" href="app.html">Open AIM</a></p>'}),
}
def minify_inline(html):
    """Minify the <style> and <script> blocks of a page that carries its own styles and scripts (the landing page)."""
    styles = re.findall(r"<style>(.*?)</style>", html, flags=re.S); scripts = re.findall(r"<script>(.*?)</script>", html, flags=re.S)
    try:
        r = subprocess.run(["node", os.path.join(ROOT, "minify.js")], input=json.dumps({"css": styles, "js": scripts}), capture_output=True, text=True, timeout=120)
        if r.returncode != 0: raise RuntimeError(r.stderr[:400])
        out = json.loads(r.stdout); it_css = iter(out["css"]); it_js = iter(out["js"])
        html = re.sub(r"<style>(.*?)</style>", lambda m: "<style>" + next(it_css) + "</style>", html, flags=re.S)
        html = re.sub(r"<script>(.*?)</script>", lambda m: "<script>" + next(it_js).replace("</script", "<\\/script") + "</script>", html, flags=re.S)
    except Exception as e:
        print("inline minify skipped:", str(e)[:200])
    return html
index_frag = minify_inline(fill(rd("index.html")))  # starts with <title>, has its own <style>
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
    with open(os.path.join(d, "assets", APP_JS_NAME), "w", encoding="utf-8") as f:
        f.write(APP_JS)

open(os.path.join(ROOT, "docs", ".nojekyll"), "w").close()
with open(os.path.join(ROOT, "docs", "robots.txt"), "w") as f:
    f.write("User-agent: *\nAllow: /\nDisallow: /app.html\nSitemap: %ssitemap.xml\n" % BASE_URL)
with open(os.path.join(ROOT, "docs", "sitemap.xml"), "w") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join("  <url><loc>%s%s</loc></url>\n" % (BASE_URL, p) for p in ["", "demo.html", "privacy.html", "terms.html"]) + "</urlset>\n")

print("built", {n: len(v) for n, v in dict(pages, **{"index.html": index_full}).items()})
