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

if ! grep -q 'wiki_theme_v143\.css' public/wiki.html; then
  sed -i 's#</head>#  <link rel="stylesheet" href="/wiki_theme_v143.css?v=143">\n</head>#' public/wiki.html
fi
if ! grep -q 'wiki_real_color_v139\.js' public/wiki.html; then
  sed -i 's#</body>#  <script defer src="/wiki_real_color_v139.js?v=139"></script>\n</body>#' public/wiki.html
fi
if ! grep -q 'wiki_strict_uniform_v140\.js' public/wiki.html; then
  sed -i 's#</body>#  <script defer src="/wiki_strict_uniform_v140.js?v=140"></script>\n</body>#' public/wiki.html
fi
if ! grep -q 'wiki_missing_images_v141\.js' public/wiki.html; then
  sed -i 's#</body>#  <script defer src="/wiki_missing_images_v141.js?v=141"></script>\n</body>#' public/wiki.html
fi
if ! grep -q 'wiki_clean_mobile_weapons_v142\.js' public/wiki.html; then
  sed -i 's#</body>#  <script defer src="/wiki_clean_mobile_weapons_v142.js?v=142"></script>\n</body>#' public/wiki.html
fi
if ! grep -q 'wiki_weapon_detail_v144\.js' public/wiki.html; then
  sed -i 's#</body>#  <script defer src="/wiki_weapon_detail_v144.js?v=144"></script>\n</body>#' public/wiki.html
fi
if ! grep -q 'wiki_verified_data_v145\.js' public/wiki.html; then
  sed -i 's#</body>#  <script defer src="/wiki_verified_data_v145.js?v=145"></script>\n</body>#' public/wiki.html
fi
if ! grep -q 'wiki_verified_fix_v146\.js' public/wiki.html; then
  sed -i 's#</body>#  <script defer src="/wiki_verified_fix_v146.js?v=146"></script>\n</body>#' public/wiki.html
fi

sed -i "s#'updates','/updates'#'updates','/ban-cap-nhat'#" public/navigation_v124.js
sed -i 's#route:"/updates"#route:"/ban-cap-nhat"#g' public/mobile_menu_v5.js

test -f public/index.html
test -f public/styles.css
test -f public/navigation_v124.js
test -f public/footer_v135.js
test -f public/footer_v135.css
test -f public/ban-cap-nhat.html
test -f public/wiki_theme_v143.css
test -f public/wiki_real_color_v139.js
test -f public/wiki_strict_uniform_v140.js
test -f public/wiki_missing_images_v141.js
test -f public/wiki_clean_mobile_weapons_v142.js
test -f public/wiki_weapon_detail_v144.js
test -f public/wiki_verified_data_v145.js
test -f public/wiki_verified_fix_v146.js
test -f 'functions/api/[[path]].js'

if grep -RIl --include='*.html' --include='*.css' --include='*.js' '\.vercel\.app' public | grep -q .; then
  echo 'ERROR: Vercel reference found in public/' >&2
  exit 1
fi

echo "TrainingBot Cloudflare Pages build ready"
