#!/usr/bin/env python3
"""Export only the explicitly approved TrainingBot D1 database, without logging contents."""
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request

ACCOUNT_ID = "60a1259b756ed210c190f0e1e3429a53"
DATABASE_ID = "7c070ec3-1f46-4d6e-9dda-0509518488f8"
DATABASE_NAME = "trainingbot-db"
API = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DATABASE_ID}"
TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "")
if not TOKEN:
    raise SystemExit("Missing CLOUDFLARE_API_TOKEN secret")

def request_json(url, payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="GET" if payload is None else "POST",
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=35) as response:
            obj = json.load(response)
    except (urllib.error.URLError, ValueError):
        # Never print API response bodies or temporary signed URLs.
        raise RuntimeError("Cloudflare API request failed; check token scope and connectivity") from None
    if not obj.get("success", False):
        raise RuntimeError("Cloudflare API rejected request; check D1 token permissions")
    return obj.get("result") or {}

def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: backup_d1_to_github.py OUTPUT.sql")
    meta = request_json(API)
    if meta.get("name") != DATABASE_NAME or meta.get("uuid", DATABASE_ID) != DATABASE_ID:
        raise RuntimeError("D1 identity mismatch: export aborted")
    result = request_json(API + "/export", {"output_format": "polling"})
    bookmark = result.get("at_bookmark")
    if not bookmark:
        raise RuntimeError("D1 export did not return a bookmark")
    signed_url = result.get("signed_url")
    for _ in range(120):
        if signed_url:
            break
        time.sleep(2)
        result = request_json(API + "/export", {
            "output_format": "polling", "current_bookmark": bookmark
        })
        signed_url = result.get("signed_url")
    if not signed_url:
        raise RuntimeError("D1 export timed out before download was ready")
    with urllib.request.urlopen(signed_url, timeout=70) as response:
        blob = response.read(128 * 1024 * 1024 + 1)
    if len(blob) > 128 * 1024 * 1024 or len(blob) < 100:
        raise RuntimeError("Export size outside expected safety range")
    try:
        content = blob.decode("utf-8")
    except UnicodeError:
        raise RuntimeError("Export is not a UTF-8 SQL dump") from None
    if "CREATE TABLE" not in content.upper():
        raise RuntimeError("Export is missing CREATE TABLE statements")
    target = pathlib.Path(sys.argv[1])
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("xb") as output:
        output.write(blob)
    print("Export verified as nonempty SQL with table definitions. No SQL printed.")

if __name__ == "__main__":
    main()
