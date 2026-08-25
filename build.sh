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

# Admin V2 has exactly one canonical document: /admin.html.
# Remove any legacy /admin/ directory copied from the historical source,
# otherwise Cloudflare Pages can bounce /admin <-> /admin/ forever.
rm -rf public/admin

rm -f public/_redirects
rm -rf "$TMP_DIR" "$ARCHIVE"

cp public/updates.html public/ban-cap-nhat.html

# Keep the public contact card in sync with the current TrainingBot contact details.
test -f public/contact.html
sed -i 's#hello@trainingbot\.vn#trainingbot.ai2@gmail.com#g; s#TrainingBot Community#trainingbot.ai#g' public/contact.html

while IFS= read -r -d '' page; do
  case "$page" in
    public/admin.html|public/admin-*.html|public/contact-inbox.html)
      continue
      ;;
  esac
  if ! grep -q 'footer_v135\.js' "$page"; then
    sed -i 's#</body>#  <script defer src="/footer_v135.js?v=135"></script>\n</body>#' "$page"
  fi
  sed -i 's#href="/updates"#href="/ban-cap-nhat"#g; s#href="updates\.html"#href="/ban-cap-nhat"#g' "$page"
  if ! grep -q 'header_search_v152\.css' "$page"; then
    sed -i 's#</head>#  <link rel="stylesheet" href="/header_search_v152.css?v=152">\n</head>#' "$page"
  fi
  if ! grep -q 'header_search_v152\.js' "$page"; then
    sed -i 's#</body>#  <script defer src="/header_search_v152.js?v=152"></script>\n</body>#' "$page"
  fi
done < <(find public -type f -name '*.html' -print0)

# Build a lightweight client-side search index from public HTML only.
# Admin pages and duplicate legacy update routes are intentionally excluded.
node <<'NODE'
const fs = require('fs');
const path = require('path');
const root = path.resolve('public');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
function decode(value) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return String(value || '')
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (m, code) => {
      if (code[0] === '#') {
        const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return named[code.toLowerCase()] ?? m;
    });
}
function plain(html) {
  return decode(String(html || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}
function routeFor(rel) {
  const unix = rel.split(path.sep).join('/');
  if (unix === 'index.html') return '/';
  if (unix === 'updates.html' || unix === 'ban-cap-nhat.html') return '/ban-cap-nhat';
  if (unix.endsWith('/index.html')) return '/' + unix.slice(0, -'/index.html'.length);
  return '/' + unix.replace(/\.html$/i, '');
}
function typeFor(rel) {
  const name = rel.toLowerCase();
  if (name === 'wiki.html' || name.startsWith('wiki-')) return 'Wiki';
  if (name === 'news.html' || name.startsWith('news-')) return 'Tin tức';
  if (name === 'updates.html' || name === 'ban-cap-nhat.html') return 'Bản cập nhật';
  if (name === 'community.html') return 'Cộng đồng';
  if (name === 'contact.html') return 'Liên hệ';
  if (name === 'index.html') return 'Trang chủ';
  return 'TrainingBot';
}

const items = [];
const seen = new Set();
for (const file of walk(root)) {
  if (!/\.html$/i.test(file)) continue;
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (/^(admin(?:-|\/|\.html)|contact-inbox\.html$)/i.test(rel)) continue;
  if (rel === 'updates.html' && fs.existsSync(path.join(root, 'ban-cap-nhat.html'))) continue;

  let html = fs.readFileSync(file, 'utf8');
  html = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, ' ');

  const h1 = plain((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [,''])[1]);
  const titleTag = plain((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [,''])[1]);
  const firstP = plain((html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i) || [,''])[1]);
  const meta = decode((html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) || [,''])[1]);
  const text = plain(html).slice(0, 10000);
  const url = routeFor(rel);
  if (seen.has(url)) continue;
  seen.add(url);

  items.push({
    title: h1 || titleTag || 'TrainingBot',
    description: firstP || meta || text.slice(0, 220),
    text,
    url,
    type: typeFor(rel),
  });
}
items.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
fs.writeFileSync(path.join(root, 'search-index-v152.json'), JSON.stringify(items));
NODE

if ! grep -q 'wiki_theme_v143\.css' public/wiki.html; then
  sed -i 's#</head>#  <link rel="stylesheet" href="/wiki_theme_v143.css?v=143">\n</head>#' public/wiki.html
fi

for page in public/updates.html public/ban-cap-nhat.html public/wiki.html; do
  if ! grep -q 'navigation_home_match_v149a\.css' "$page"; then
    sed -i 's#</head>#  <link rel="stylesheet" href="/navigation_home_match_v149a.css?v=149a">\n</head>#' "$page"
  fi
done

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
if ! grep -q 'wiki_verified_data_v145\.js' public/wiki.html; then
  sed -i 's#</body>#  <script defer src="/wiki_verified_data_v145.js?v=145"></script>\n</body>#' public/wiki.html
fi
if ! grep -q 'wiki_verified_fix_v146\.js' public/wiki.html; then
  sed -i 's#</body>#  <script defer src="/wiki_verified_fix_v146.js?v=146"></script>\n</body>#' public/wiki.html
fi
if ! grep -q 'wiki_audit_v149\.js' public/wiki.html; then
  sed -i 's#</body>#  <script defer src="/wiki_audit_v149.js?v=149"></script>\n</body>#' public/wiki.html
fi

sed -i "s#'updates','/updates'#'updates','/ban-cap-nhat'#" public/navigation_v124.js
sed -i 's#route:"/updates"#route:"/ban-cap-nhat"#g' public/mobile_menu_v5.js

test -f public/index.html
test -f public/styles.css
test -f public/navigation_v124.js
test -f public/navigation_home_match_v149a.css
test -f public/footer_v135.js
test -f public/footer_v135.css
test -f public/header_search_v152.css
test -f public/header_search_v152.js
test -f public/search-index-v152.json
node --check public/header_search_v152.js >/dev/null
node -e "const x=require('./public/search-index-v152.json'); if(!Array.isArray(x)||x.length<3) process.exit(1)" >/dev/null
grep -q 'trainingbot.ai2@gmail.com' public/contact.html
grep -q 'trainingbot.ai' public/contact.html
test -f public/ban-cap-nhat.html
test -f public/wiki_theme_v143.css
test -f public/wiki_real_color_v139.js
test -f public/wiki_strict_uniform_v140.js
test -f public/wiki_missing_images_v141.js
test -f public/wiki_clean_mobile_weapons_v142.js
test -f public/wiki_verified_data_v145.js
test -f public/wiki_verified_fix_v146.js
test -f public/wiki_catalog_verified_v147.js
test -f public/wiki_vehicle_map_detail_v148.js
test -f public/wiki_audit_v149.js
node --check public/wiki_audit_v149.js >/dev/null

# Admin V2 deployment guards.
test -f public/admin.html
test ! -e public/admin
grep -q 'TrainingBot Admin Center V2' public/admin.html
if grep -q 'footer_v135\.js' public/admin.html; then
  echo 'ERROR: public footer leaked into Admin Center V2' >&2
  exit 1
fi
test ! -f functions/admin.js

test -f 'functions/api/[[path]].js'

if grep -RIl --include='*.html' --include='*.css' --include='*.js' '\.vercel\.app' public | grep -q .; then
  echo 'ERROR: Vercel reference found in public/' >&2
  exit 1
fi

echo "TrainingBot Cloudflare Pages build ready"
