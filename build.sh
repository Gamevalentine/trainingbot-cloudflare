#!/usr/bin/env bash
set -euo pipefail

ARCHIVE="TrainingBot_SOURCE_CLEAN.zip"
PARTS_DIR="source_parts"
TMP_DIR=".cf_unpack"

rm -rf "$TMP_DIR"
test -d "$PARTS_DIR"
cat "$PARTS_DIR"/part_* > "$ARCHIVE"
unzip -tq "$ARCHIVE"
mkdir -p "$TMP_DIR"
unzip -q "$ARCHIVE" -d "$TMP_DIR"
rm -rf public
cp -a "$TMP_DIR/public" ./public
rm -rf "$TMP_DIR" "$ARCHIVE"

test -f public/index.html
test -f public/styles.css
test -f public/navigation_v124.js
test -f 'functions/api/[[path]].js'

if grep -RIl --include='*.html' --include='*.css' --include='*.js' '\.vercel\.app' public | grep -q .; then
  echo 'ERROR: Vercel reference found in public/' >&2
  exit 1
fi

echo "TrainingBot Cloudflare Pages build ready"
