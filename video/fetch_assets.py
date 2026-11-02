#!/usr/bin/env python3
"""
Licensed asset fetcher.

Pulls real imagery/SVG from openly-licensed sources, caches it under
assets/sourced/, and records license + attribution in assets/manifest.json so
credits can be generated automatically. Sources that rate-limit (Wikimedia)
are retried with exponential backoff and simply skipped if unavailable --
the build never silently substitutes something unlicensed.
"""
import json, os, sys, time, hashlib, urllib.parse, argparse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sourced")
MANIFEST = os.path.join(ROOT, "assets", "manifest.json")
UA = "YtContentExplainer/1.0 (+https://github.com/SameerAliKhan-git/Yt-content)"

def get(url, tries=4, timeout=40):
    """GET with backoff. Returns (bytes, content_type) or (None, reason)."""
    last = "?"
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read(), r.headers.get("Content-Type", "")
        except Exception as e:
            last = f"{type(e).__name__}: {str(e)[:90]}"
            code = getattr(e, "code", None)
            if code in (429, 503) and i < tries - 1:
                time.sleep(4 * (2 ** i))          # 4s, 8s, 16s
                continue
            if i < tries - 1:
                time.sleep(2 * (i + 1))
                continue
    return None, last

def load_manifest():
    if os.path.exists(MANIFEST):
        return json.load(open(MANIFEST))
    return {"assets": {}, "note": "Every entry carries its licence. Credits are generated from this file."}

def save_manifest(m):
    os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)
    json.dump(m, open(MANIFEST, "w"), indent=1, ensure_ascii=False)

def record(m, key, **kw):
    m["assets"][key] = {**kw, "retrieved": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}

def strip_html(s):
    import re
    return re.sub(r"<[^>]+>", "", s or "").strip()

# ---------------------------------------------------------------- sources ----
def fetch_icon(m, key, pkg, path, license_name, attrib):
    """Openly-licensed SVG icon sets served from jsDelivr."""
    url = f"https://cdn.jsdelivr.net/npm/{pkg}/{path}"
    data, ct = get(url)
    if data is None:
        print(f"  SKIP {key}: {ct}"); return False
    dst = os.path.join(OUT, "icons", f"{key}.svg")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, "wb").write(data)
    record(m, key, file=os.path.relpath(dst, ROOT), source=url,
           license=license_name, attribution=attrib, kind="svg")
    print(f"  ok   {key}  ({len(data)}b)")
    return True

def fetch_commons(m, key, search, want_svg=False, width=1600):
    """Wikimedia Commons: search, then download, capturing licence + author."""
    api = ("https://commons.wikimedia.org/w/api.php?action=query&generator=search"
           f"&gsrsearch={urllib.parse.quote(search)}&gsrnamespace=6&gsrlimit=5"
           f"&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth={width}&format=json")
    data, ct = get(api)
    if data is None:
        print(f"  SKIP {key}: Commons API unavailable ({ct})"); return False
    try:
        pages = json.loads(data).get("query", {}).get("pages", {})
    except Exception as e:
        print(f"  SKIP {key}: bad JSON {e}"); return False
    for p in pages.values():
        ii = (p.get("imageinfo") or [{}])[0]
        em = ii.get("extmetadata", {})
        lic = (em.get("LicenseShortName", {}) or {}).get("value", "")
        if not lic or "fair" in lic.lower():
            continue
        url = ii.get("thumburl") or ii.get("url")
        if not url: continue
        if want_svg and not url.lower().endswith(".svg"): continue
        blob, ct2 = get(url)
        if blob is None:
            print(f"  .. {key}: media host said {ct2}"); continue
        ext = ".svg" if "svg" in (ct2 or "") else os.path.splitext(url)[1][:5] or ".jpg"
        dst = os.path.join(OUT, "commons", f"{key}{ext}")
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, "wb").write(blob)
        record(m, key, file=os.path.relpath(dst, ROOT), source=url,
               page="https://commons.wikimedia.org/wiki/" + urllib.parse.quote(p.get("title","")),
               license=lic, attribution=strip_html((em.get("Artist", {}) or {}).get("value", ""))[:160],
               kind="image", title=p.get("title"))
        print(f"  ok   {key}  [{lic}]  {len(blob)}b")
        return True
    print(f"  SKIP {key}: nothing downloadable")
    return False

def fetch_naturalearth(m, key, layer, scale="10m", cat="cultural"):
    url = f"https://naciscdn.org/naturalearth/{scale}/{cat}/{layer}.zip"
    data, ct = get(url, timeout=120)
    if data is None:
        print(f"  SKIP {key}: {ct}"); return False
    dst = os.path.join(OUT, "naturalearth", f"{layer}.zip")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, "wb").write(data)
    record(m, key, file=os.path.relpath(dst, ROOT), source=url,
           license="Public domain", attribution="Natural Earth", kind="geodata")
    print(f"  ok   {key}  ({len(data)//1024} KB)")
    return True

# ------------------------------------------------------------------ main ----
ICONS = [
    # key,               package@version,                 path,                       licence,       attribution
    ("icon_cpu",        "lucide-static@0.445.0",          "icons/cpu.svg",            "ISC",         "Lucide"),
    ("icon_chip",       "@mdi/svg@7.4.47",                "svg/chip.svg",             "Apache-2.0",  "Material Design Icons"),
    ("icon_memory",     "@mdi/svg@7.4.47",                "svg/memory.svg",           "Apache-2.0",  "Material Design Icons"),
    ("icon_factory",    "@mdi/svg@7.4.47",                "svg/factory.svg",          "Apache-2.0",  "Material Design Icons"),
    ("icon_ship",       "@mdi/svg@7.4.47",                "svg/ferry.svg",            "Apache-2.0",  "Material Design Icons"),
    ("icon_car",        "@mdi/svg@7.4.47",                "svg/car-side.svg",         "Apache-2.0",  "Material Design Icons"),
    ("icon_laser",      "@mdi/svg@7.4.47",                "svg/laser-pointer.svg",    "Apache-2.0",  "Material Design Icons"),
    ("icon_mirror",     "@mdi/svg@7.4.47",                "svg/mirror-rectangle.svg", "Apache-2.0",  "Material Design Icons"),
]
COMMONS = [
    ("photo_cleanroom",   "cleanroom semiconductor fab"),
    ("photo_wafer",       "silicon wafer"),
    ("photo_die",         "integrated circuit die shot"),
    ("diagram_mosfet",    "MOSFET cross section"),
    ("diagram_litho",     "photolithography process"),
]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=["icons", "commons", "geo", "all"], default="all")
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    m = load_manifest()

    if a.only in ("icons", "all"):
        print("icons (CC0 / MIT / Apache — no attribution burden):")
        for k, pkg, path, lic, att in ICONS:
            fetch_icon(m, k, pkg, path, lic, att); save_manifest(m)

    if a.only in ("geo", "all"):
        print("natural earth (public domain):")
        for k, layer, cat in [("geo_places", "ne_10m_populated_places_simple", "cultural"),
                              ("geo_admin1", "ne_10m_admin_1_states_provinces", "cultural")]:
            fetch_naturalearth(m, k, layer, cat=cat); save_manifest(m)

    if a.only in ("commons", "all"):
        print("wikimedia commons (CC/PD — attribution recorded):")
        for k, q in COMMONS:
            fetch_commons(m, k, q); save_manifest(m)

    save_manifest(m)
    got = len(m["assets"])
    print(f"\n{got} assets in manifest -> {os.path.relpath(MANIFEST, ROOT)}")
    lics = {}
    for v in m["assets"].values():
        lics[v.get("license", "?")] = lics.get(v.get("license", "?"), 0) + 1
    for k, v in sorted(lics.items()):
        print(f"  {v:3d}  {k}")

if __name__ == "__main__":
    main()
