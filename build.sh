#!/usr/bin/env bash
set -euo pipefail

ARCHIVE="TrainingBot_Cloudflare_Pages_C1.zip"
TMP_DIR=".cf_unpack"

rm -rf public "$TMP_DIR"
test -f "$ARCHIVE"
unzip -q "$ARCHIVE" -d "$TMP_DIR"
cp -a "$TMP_DIR/TrainingBot_Cloudflare_Pages_C1/public" ./public
rm -rf "$TMP_DIR"

test -f public/index.html
test -f 'functions/api/[[path]].js'

echo "TrainingBot Cloudflare Pages build ready"
