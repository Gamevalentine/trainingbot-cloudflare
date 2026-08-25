#!/usr/bin/env python3
import base64
import hashlib
import html
import json
import mimetypes
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse

JS_PATH = Path(sys.argv[1] if len(sys.argv) > 1 else "public/wiki_v150.js")
OUT_DIR = Path(sys.argv[2] if len(sys.argv) > 2 else "public/wiki-assets")
RAW_BASE = "https://raw.githubusercontent.com/pubg/api-assets/master/"
MAX_BYTES = 4 * 1024 * 1024
TIMEOUT = 15

ALIASES = {
    "Nỏ": "Crossbow",
    "Súng pháo sáng": "Flare Gun",
    "Súng cưa nòng": "Sawed-Off",
}

MAP_NAMES = {"Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Karakin", "Nusa", "Rondo"}

PAIR_RE = re.compile(
    r"'([^']+)'\s*:\s*'((?:https?://|Assets/)[^']+\.(?:png|jpe?g|webp)(?:\?[^']*)?)'",
    re.I,
)
RAW_RE = re.compile(
    r"'([^']+)'\s*:\s*RAW\+\s*'([^']+\.(?:png|jpe?g|webp)(?:\?[^']*)?)'",
    re.I,
)

def normalize_source(value: str) -> str:
    if value.startswith("Assets/"):
        return RAW_BASE + value
    return value

def source_candidates(url: str):
    if "/Weapon/Main/" in url and url.endswith("_w.png"):
        yield url[:-6] + ".png"
    yield url

def mime_for(url: str, content_type):
    if content_type:
        mime = content_type.split(";", 1)[0].strip().lower()
        if mime.startswith("image/"):
            return mime
    mime, _ = mimetypes.guess_type(urlparse(url).path)
    return mime if mime and mime.startswith("image/") else "application/octet-stream"

def placeholder(label: str) -> bytes:
    safe = html.escape(label)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#161b2a"/><stop offset="1" stop-color="#0b0f18"/></linearGradient></defs>
<rect width="800" height="450" rx="34" fill="url(#g)"/>
<circle cx="400" cy="185" r="64" fill="#26314b"/>
<path d="M370 185h60M400 155v60" stroke="#7b8fca" stroke-width="12" stroke-linecap="round"/>
<text x="400" y="315" text-anchor="middle" fill="#c7d0e6" font-family="Arial,sans-serif" font-size="34" font-weight="700">{safe}</text>
</svg>'''
    return svg.encode("utf-8")

def wrap_image(data: bytes, mime: str, fit: str) -> bytes:
    mode = "slice" if fit == "cover" else "meet"
    encoded = base64.b64encode(data).decode("ascii")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
<image href="data:{mime};base64,{encoded}" x="0" y="0" width="800" height="450" preserveAspectRatio="xMidYMid {mode}"/>
</svg>'''
    return svg.encode("utf-8")

def fetch_one(source: str, label: str, fit: str):
    last_error = None
    for candidate in source_candidates(source):
        try:
            req = urllib.request.Request(
                candidate,
                headers={
                    "User-Agent": "TrainingBot-Wiki-Asset-Builder/1.0",
                    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                },
            )
            with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
                data = res.read(MAX_BYTES + 1)
                if len(data) > MAX_BYTES:
                    raise ValueError("asset too large")
                mime = mime_for(candidate, res.headers.get("Content-Type"))
                if not mime.startswith("image/"):
                    raise ValueError(f"unexpected content type: {mime}")
                return wrap_image(data, mime, fit), candidate, None
        except Exception as exc:
            last_error = exc
    return placeholder(label), source, str(last_error or "download failed")

def main():
    if not JS_PATH.is_file():
        raise SystemExit(f"Missing {JS_PATH}")

    text = JS_PATH.read_text(encoding="utf-8")
    sources = {}

    for key, value in PAIR_RE.findall(text):
        sources.setdefault(key, normalize_source(value))
    for key, value in RAW_RE.findall(text):
        sources.setdefault(key, normalize_source(value))

    jobs = {}
    for key, source in sources.items():
        fit = "cover" if key in MAP_NAMES else "contain"
        item = jobs.setdefault(source, {"keys": [], "fit": fit})
        item["keys"].append(key)
        if fit == "cover":
            item["fit"] = "cover"

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("*.svg"):
        old.unlink()

    manifest = {}
    failures = []

    def target_name(source: str):
        return hashlib.sha1(source.encode("utf-8")).hexdigest()[:16] + ".svg"

    with ThreadPoolExecutor(max_workers=10) as pool:
        future_map = {}
        for source, meta in jobs.items():
            label = meta["keys"][0]
            future = pool.submit(fetch_one, source, label, meta["fit"])
            future_map[future] = (source, meta)

        for future in as_completed(future_map):
            source, meta = future_map[future]
            content, used_source, error = future.result()
            filename = target_name(source)
            (OUT_DIR / filename).write_bytes(content)
            local = f"/wiki-assets/{filename}"
            for key in meta["keys"]:
                manifest[key] = local
            if error:
                failures.append({"source": source, "keys": meta["keys"], "error": error})

    for shown, raw in ALIASES.items():
        if raw in manifest:
            manifest[shown] = manifest[raw]

    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    (OUT_DIR / "build-report.json").write_text(
        json.dumps(
            {
                "assets": len(manifest),
                "unique_sources": len(jobs),
                "fallbacks": failures,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(
        f"Wiki assets: {len(jobs)} source(s), "
        f"{len(manifest)} key(s), {len(failures)} fallback(s)"
    )

if __name__ == "__main__":
    main()
