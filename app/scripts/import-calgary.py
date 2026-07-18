#!/usr/bin/env python3
"""Import live City of Calgary open data for Stroll phase 1.

Pulls Inglewood/Ramsay-area business licences, building footprints, trees,
bikeways and pathways from Socrata GeoJSON endpoints, snaps businesses to
building footprints, and writes a compact static JSON payload consumed by the
Next.js staging app.

This mirrors the reference build-scripts/build3.py + build4.py pipeline while
remaining deployment-safe: secrets are read from env but never written.
"""
from __future__ import annotations

import hashlib
import json
import math
import os
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any

BASE = "https://data.calgary.ca/resource/{dataset}.geojson"
# Covers the Inglewood 9 Ave SE strip plus immediately adjacent Ramsay licence points.
BBOX = {
    "nw_lat": 51.0490,
    "nw_lon": -114.0550,
    "se_lat": 51.0350,
    "se_lon": -114.0150,
}
CENTER = [-114.0358, 51.04185]
STRIP_BOUNDS = [[-114.0480, 51.0386], [-114.0238, 51.0455]]
LAT0 = 51.042
MX = 111_320 * math.cos(math.radians(LAT0))
MY = 110_540

DATASETS = {
    "licences": ("vdjc-pybd", "point", 5000),
    "buildings": ("uc4c-6kbd", "multipolygon", 8000),
    "streets": ("4dx8-rtm5", "line", 5000),
    "trees": ("tfs4-3wwa", "point", 6000),
    "bike": ("jjqk-9b73", "multilinestring", 5000),
    "pathways": ("qndb-27qm", "the_geom", 5000),
}

CURATED = {
    "ESKER FOUNDATION": ("Free contemporary art gallery in a converted warehouse.", "11–6, closed Mon", [["🖼️", "Rotating exhibitions"], ["🆓", "Always free"], ["🏛️", "Rooftop terrace"]], "eskerfoundation.art"),
    "HOSE & HOUND": ("Pub grub & craft brews in a 1906 fire hall.", "11am–12am", [["🚒", "Historic firehall"], ["🍺", "24 taps"], ["🍔", "Late kitchen"]], "hoseandhound.ca"),
    "SPOLUMBO": ("Bustling Italian deli & famous house sausage.", "9am–4pm", [["🌭", "House sausage"], ["🥪", "Deli subs"], ["👨‍🍳", "Ex-Stampeders"]], "spolumbos.com"),
    "SMITHBILT": ("Makers of the iconic white Stampede hat since 1919.", "9am–5pm", [["🤠", "Custom felt hats"], ["🏭", "Working factory"], ["⭐", "Calgary icon"]], "smithbilthats.com"),
    "ROSSO": ("Industrial-chic roastery & flagship café.", "7am–6pm", [["☕", "House-roasted"], ["🪵", "Communal tables"], ["🥐", "Fresh pastries"]], "rossocoffee.com"),
    "IRONWOOD": ("Beloved live-music venue & grill on Music Mile.", "Shows nightly", [["🎸", "Live roots & folk"], ["🍔", "Pre-show grill"], ["🎶", "Music Mile"]], "ironwoodstage.ca"),
    "KNIFEWEAR": ("Japanese kitchen knives & sharpening experts.", "10am–6pm", [["🔪", "Hand-forged blades"], ["🪒", "Sharpening bar"], ["🇯🇵", "Imported steel"]], "knifewear.com"),
    "KENT OF INGLEWOOD": ("Wet-shaving, grooming goods & fine knives.", "10am–6pm", [["🪒", "Straight razors"], ["🧴", "Grooming kits"], ["🎁", "Great gifts"]], "kentofinglewood.com"),
    "FAIR": ("Beloved sprawling used & rare bookstore.", "10am–6pm", [["📚", "Stacks of used books"], ["🔎", "Rare finds"], ["🛋️", "Cozy nooks"]], "fairsfairbooks.com"),
    "MADE BY MARCUS": ("Small-batch ice cream in wild local flavours.", "12–10pm", [["🍦", "Rotating flavours"], ["🌾", "Honey & haskap"], ["🧇", "Waffle cones"]], "madebymarcus.ca"),
    "CANELA": ("All-vegan bakery & café — sweet & savoury.", "8am–5pm", [["🥐", "Vegan croissants"], ["🎂", "Cake counter"], ["🌱", "Plant-based"]], "canelabakeshop.com"),
    "GRAVITY": ("Espresso & wine bar, a Music Mile staple.", "7am–10pm", [["☕", "Serious espresso"], ["🍷", "Evening wine"], ["🥪", "Café lunch"]], "gravityespresso.com"),
    "ALBERTA BOOT": ("Alberta's original western boot maker.", "9am–5:30pm", [["👢", "Handmade cowboy boots"], ["🐂", "Exotic leathers"], ["🧵", "Custom fittings"]], "albertaboot.com"),
    "DEANE HOUSE": ("Historic riverside restaurant in a 1906 home.", "10am–10pm", [["🏛️", "1906 heritage house"], ["🍽️", "Seasonal menu"], ["🌉", "By the Bow"]], "deanehouse.com"),
    "HIGH LINE": ("Small-batch neighbourhood brewery & taproom.", "12–11pm", [["🍺", "Fresh batches"], ["🎯", "Taproom games"], ["🐕", "Dog-friendly"]], "highlinebrewing.ca"),
}

DEFAULTS = {
    "restaurant": ("11am–10pm", [["🍴", "Local kitchen"], ["🪑", "Dine-in"], ["📍", "On the strip"]]),
    "cafe": ("8am–6pm", [["☕", "Coffee & treats"], ["🥐", "Fresh baking"], ["🪟", "Cosy room"]]),
    "bar": ("12pm–12am", [["🍺", "Local pours"], ["🎶", "Good vibes"], ["🍔", "Bar bites"]]),
    "shop": ("10am–6pm", [["🛍️", "Indie retail"], ["✨", "Curated goods"], ["🎁", "Local finds"]]),
    "services": ("9am–6pm", [["💈", "By appointment"], ["✨", "Local pros"], ["📍", "On 9 Ave"]]),
    "gallery": ("11am–5pm", [["🎨", "Art & culture"], ["🆓", "Drop in"], ["🖼️", "Local makers"]]),
}
PHOTO_KW = {"restaurant": "restaurant,food", "cafe": "coffeeshop,cafe", "bar": "pub,beer", "shop": "boutique,storefront", "services": "salon,studio", "gallery": "artgallery,gallery"}

def h(s: str) -> int:
    return int(hashlib.md5(s.encode()).hexdigest(), 16)

def fetch(dataset: str, geocol: str, limit: int) -> dict[str, Any]:
    where = f"within_box({geocol},{BBOX['nw_lat']},{BBOX['nw_lon']},{BBOX['se_lat']},{BBOX['se_lon']})"
    qs = {"$where": where, "$limit": str(limit)}
    url = BASE.format(dataset=dataset) + "?" + urllib.parse.urlencode(qs)
    headers = {"User-Agent": "strollyyc-import/1.0"}
    if os.getenv("CALGARY_APP_TOKEN"):
        headers["X-App-Token"] = os.environ["CALGARY_APP_TOKEN"]
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.load(resp)

def round_coords(obj: Any, ndigits: int = 6) -> Any:
    if isinstance(obj, list):
        if len(obj) == 2 and all(isinstance(x, (int, float)) for x in obj):
            return [round(float(obj[0]), ndigits), round(float(obj[1]), ndigits)]
        return [round_coords(x, ndigits) for x in obj]
    return obj

def simplify_line(points: list[list[float]], eps: float = 0.00004) -> list[list[float]]:
    if len(points) < 3:
        return [[round(p[0], 5), round(p[1], 5)] for p in points]
    a, b = points[0], points[-1]
    best_d, best_i = -1.0, 0
    for i, p in enumerate(points[1:-1], start=1):
        d = perp(p, a, b)
        if d > best_d:
            best_d, best_i = d, i
    if best_d > eps:
        return simplify_line(points[: best_i + 1], eps)[:-1] + simplify_line(points[best_i:], eps)
    return [[round(a[0], 5), round(a[1], 5)], [round(b[0], 5), round(b[1], 5)]]

def perp(p: list[float], a: list[float], b: list[float]) -> float:
    if a == b:
        return math.hypot(p[0] - a[0], p[1] - a[1])
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = dx * dx + dy * dy
    t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length
    cx, cy = a[0] + t * dx, a[1] + t * dy
    return math.hypot(p[0] - cx, p[1] - cy)

def simplify_multilines(fc: dict[str, Any]) -> dict[str, Any]:
    features = []
    for f in fc.get("features", []):
        g = f.get("geometry")
        if not g:
            continue
        lines = g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]
        coords = []
        for line in lines:
            s = simplify_line(line)
            if len(s) >= 2:
                coords.append(s)
        if coords:
            features.append({"type": "Feature", "properties": f.get("properties", {}), "geometry": {"type": "MultiLineString", "coordinates": coords}})
    return {"type": "FeatureCollection", "features": features}

def centroid(geom: dict[str, Any]) -> tuple[float, float]:
    xs: list[float] = []
    ys: list[float] = []
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    for poly in polys:
        for lon, lat in poly[0]:
            xs.append(lon); ys.append(lat)
    return sum(xs) / len(xs), sum(ys) / len(ys)

def point_in_poly(pt: tuple[float, float], geom: dict[str, Any]) -> bool:
    x, y = pt
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    for poly in polys:
        ring = poly[0]
        inside = False
        j = len(ring) - 1
        for i in range(len(ring)):
            xi, yi = ring[i]
            xj, yj = ring[j]
            if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi):
                inside = not inside
            j = i
        if inside:
            return True
    return False

def categorize(name: str, licencetypes: str | None) -> str | None:
    nm = name.upper(); lt = (licencetypes or "").upper()
    if "APARTMENT BUILDING" in lt or nm.endswith("BLOCK") or "APARTMENT" in nm:
        return None
    if "CONTRACTOR" in lt and "RETAIL" not in lt and "FOOD" not in lt and "PERSONAL" not in lt:
        return None
    if any(w in nm for w in ["BREW", "TAPROOM", "WHISKEY", "DISTILL", "PUB", "SOCIAL CLUB", "DIRTY DUCK", "BAR"]):
        return "bar"
    if any(w in nm for w in ["COFFEE", "ESPRESSO", "CAFE", "CAFÉ", "BAKERY", "DONUT", " TEA", "ICE CREAM", "ROASTER", "CANELA", "GELATO", "DESSERT"]):
        return "cafe"
    if any(w in nm for w in ["GALLER", "FOUNDATION", "MUSEUM", "ARTESANO", "COLLECTOR", "UNDERGROUND"]) or "ART" in nm.split():
        return "gallery"
    if "PERSONAL SERVICE" in lt or any(w in nm for w in ["SALON", "HAIR", "NAIL", "BARBER", "SPA", "WELLNESS", "BEAUTY", "F45", "FITNESS", "YOGA", "NATUROPATH", "MASSAGE", "TATTOO", "PIERCING", "STUDIO"]):
        return "services"
    if "FOOD SERVICE" in lt or any(w in nm for w in ["PIZZA", "SUSHI", "RESTAURANT", "KITCHEN", "GRILL", "DUMPLING", "TACO", "BURGER", "NOODLE", "BISTRO", "EATERY", "DELI"]):
        return "restaurant"
    if "RETAIL" in lt or "SECONDHAND" in lt or "CANNABIS" in lt or "MANUFACTURER" in lt:
        return "shop"
    return "shop"

def title_case(s: str) -> str:
    return s.title().replace("'S", "'s")

def build() -> dict[str, Any]:
    print("Fetching live City of Calgary datasets…", file=sys.stderr)
    raw = {name: fetch(*spec) for name, spec in DATASETS.items()}
    buildings = [f for f in raw["buildings"].get("features", []) if f.get("geometry")]

    seen: set[str] = set()
    businesses: list[dict[str, Any]] = []
    used_buildings: dict[int, int] = {}
    for f in raw["licences"].get("features", []):
        geom = f.get("geometry")
        if not geom:
            continue
        props = f.get("properties", {})
        name = (props.get("tradename") or "").strip()
        if not name:
            continue
        cat = categorize(name, props.get("licencetypes"))
        if not cat:
            continue
        key = name.upper()
        address_raw = (props.get("address") or "").upper()
        curated_key = any(ck in key for ck in CURATED)
        # Phase-1 target is the Inglewood 9 Ave SE strip. The bbox includes a lot
        # of light-industrial Ramsay/Manchester licences, so keep 9 Ave storefronts
        # plus curated neighbouring anchors from the prototype.
        if "9 AV SE" not in address_raw and not curated_key:
            continue
        if key in seen:
            continue
        seen.add(key)
        lon, lat = geom["coordinates"]
        bidx = None
        for i, bf in enumerate(buildings):
            if point_in_poly((lon, lat), bf["geometry"]):
                bidx = i
                break
        if bidx is None:
            best = 1e9
            for i, bf in enumerate(buildings):
                cx, cy = centroid(bf["geometry"])
                dist = math.hypot((lon - cx) * MX, (lat - cy) * MY)
                if dist < best and dist < 30:
                    best = dist; bidx = i
        if bidx is not None:
            used_buildings[bidx] = h(str(bidx)) % 9
        curated = None
        for ck, value in CURATED.items():
            if ck in key:
                curated = value
                break
        domain = None
        if curated:
            blurb, hours, highlights, domain = curated
        else:
            nice = title_case(name)
            blurb = f"{nice} — {cat if cat != 'services' else 'local service'} on 9 Ave SE in Inglewood."
            hours, highlights = DEFAULTS[cat]
        mono = "".join([w[0] for w in name.split()[:2] if w and w[0].isalnum()]).upper() or name[:2].upper()
        pid = h(key) % 1000
        businesses.append({
            "id": hashlib.sha1(key.encode()).hexdigest()[:12],
            "name": title_case(name),
            "category": cat,
            "mono": mono[:3],
            "lon": round(lon, 6),
            "lat": round(lat, 6),
            "address": title_case((props.get("address") or "").strip()),
            "blurb": blurb,
            "hours": hours,
            "highlights": highlights,
            "photo": f"https://picsum.photos/seed/strollyyc{pid}/520/340",
            "domain": domain,
            "source": "City of Calgary business licence",
            "needsReview": True,
        })

    biz_buildings = {"type": "FeatureCollection", "features": []}
    for i, roof in used_buildings.items():
        geom = buildings[i]["geometry"]
        biz_buildings["features"].append({"type": "Feature", "properties": {"roof": roof}, "geometry": {"type": geom["type"], "coordinates": round_coords(geom["coordinates"])}})

    tree_points = []
    for f in raw["trees"].get("features", []):
        if f.get("geometry"):
            lon, lat = f["geometry"]["coordinates"]
            tree_points.append([round(lon, 5), round(lat, 5)])
    if len(tree_points) > 1200:
        step = len(tree_points) / 1200
        tree_points = [tree_points[int(i * step)] for i in range(1200)]

    neighbourhoods = [
        {"id": "inglewood", "name": "Inglewood / 9 Ave SE", "center": CENTER, "bounds": STRIP_BOUNDS, "bearing": -25, "enabled": True},
        {"id": "kensington", "name": "Kensington", "center": [-114.0853, 51.0535], "bounds": [[-114.095, 51.049], [-114.074, 51.058]], "bearing": -18, "enabled": False},
        {"id": "seventeenth", "name": "17th Ave SW", "center": [-114.087, 51.037], "bounds": [[-114.112, 51.033], [-114.060, 51.041]], "bearing": -5, "enabled": False},
        {"id": "marda", "name": "Marda Loop", "center": [-114.115, 51.023], "bounds": [[-114.128, 51.018], [-114.104, 51.028]], "bearing": -25, "enabled": False},
        {"id": "bridgeland", "name": "Bridgeland", "center": [-114.041, 51.052], "bounds": [[-114.052, 51.047], [-114.028, 51.058]], "bearing": -18, "enabled": False},
    ]

    return {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "center": CENTER,
        "stripBounds": STRIP_BOUNDS,
        "businesses": businesses,
        "businessBuildings": biz_buildings,
        "trees": tree_points,
        "streets": simplify_multilines(raw["streets"]),
        "bike": simplify_multilines(raw["bike"]),
        "pathways": simplify_multilines(raw["pathways"]),
        "neighbourhoods": neighbourhoods,
        "stats": {
            "businesses": len(businesses),
            "businessBuildings": len(biz_buildings["features"]),
            "trees": len(tree_points),
            "categories": dict(Counter(b["category"] for b in businesses)),
        },
    }

def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("public/data/stroll-data.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    payload = build()
    out.write_text(json.dumps(payload, separators=(",", ":")))
    print(json.dumps(payload["stats"], indent=2))
    print(f"Wrote {out} ({out.stat().st_size / 1_000_000:.2f} MB)")

if __name__ == "__main__":
    main()
