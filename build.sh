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
if [[ -d overrides ]]; then
  cp -a overrides/. public/
fi
rm -f public/_redirects
rm -rf "$TMP_DIR" "$ARCHIVE"

cp public/updates.html public/ban-cap-nhat.html

while IFS= read -r -d '' page; do
  if ! grep -q 'footer_v135\.js' "$page"; then
    sed -i 's#</body>#  <script defer src="/footer_v135.js?v=135"></script>\n</body>#' "$page"
  fi
  sed -i 's#href="/updates"#href="/ban-cap-nhat"#g; s#href="updates\.html"#href="/ban-cap-nhat"#g' "$page"
done < <(find public -type f -name '*.html' -print0)

if ! grep -q 'wiki_v150\.css' public/wiki.html; then
  sed -i 's#</head>#  <link rel="stylesheet" href="/wiki_v150.css?v=150">\n</head>#' public/wiki.html
fi
if ! grep -q 'wiki_v150\.js' public/wiki.html; then
  sed -i 's#</body>#  <script defer src="/wiki_v150.js?v=150"></script>\n</body>#' public/wiki.html
fi

sed -i "s#'updates','/updates'#'updates','/ban-cap-nhat'#" public/navigation_v124.js
sed -i 's#route:"/updates"#route:"/ban-cap-nhat"#g' public/mobile_menu_v5.js

test -f public/index.html
test -f public/styles.css
test -f public/navigation_v124.js
test -f public/footer_v135.js
test -f public/footer_v135.css
test -f public/ban-cap-nhat.html
test -f public/wiki_v150.css
test -f public/wiki_v150.js
node --check public/wiki_v150.js >/dev/null
test -f 'functions/api/[[path]].js'

if grep -Eq 'wiki_(reference_v136|real_images_v137|completion_v138|real_color_v139|strict_uniform_v140|missing_images_v141|clean_mobile_weapons_v142|theme_v143|verified_data_v145|verified_fix_v146|catalog_verified_v147|vehicle_map_detail_v148|audit_v149)' public/wiki.html; then
  echo 'ERROR: Legacy Wiki runtime reference found in public/wiki.html' >&2
  exit 1
fi

if grep -RIl --include='*.html' --include='*.css' --include='*.js' '\.vercel\.app' public | grep -q .; then
  echo 'ERROR: Vercel reference found in public/' >&2
  exit 1
fi

echo "TrainingBot Cloudflare Pages build ready — Wiki v150"
