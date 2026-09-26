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
  if ! grep -q 'visitor_tracking_v177\.js' "$page"; then
    sed -i 's#</body>#  <script defer src="/visitor_tracking_v177.js?v=177"></script>\n</body>#' "$page"
  fi
done < <(find public -type f -name '*.html' -print0)

test -f public/visitor_tracking_v177.js
node --check public/visitor_tracking_v177.js >/dev/null

# Homepage video shelf: newest TikTok stays large, older videos form a horizontal row.
test -f public/home_videos_v165.css
test -f public/home_videos_v165.js
if ! grep -q 'home_videos_v165\.css' public/index.html; then
  sed -i 's#</head>#  <link rel="stylesheet" href="/home_videos_v165.css?v=170">\n</head>#' public/index.html
fi
if ! grep -q 'home_videos_v165\.js' public/index.html; then
  sed -i 's#</body>#  <script defer src="/home_videos_v165.js?v=170"></script>\n</body>#' public/index.html
fi
node --check public/home_videos_v165.js >/dev/null

# Inject the homepage video manager into the reconstructed Admin V2 document.
test -f public/admin_home_videos_v165.js
node --check public/admin_home_videos_v165.js >/dev/null
node <<'NODE'
const fs=require('fs');
const file='public/admin.html';
let source=fs.readFileSync(file,'utf8');
if(!source.includes('admin_home_videos_v165.js')){
  const marker='document.open();document.write(h);document.close()';
  if(!source.includes(marker))throw new Error('Admin V2 loader marker not found');
  const patch=`h=h.replace('</body>','<script defer src="/admin_home_videos_v165.js?v=165"><\\/script></body>');${marker}`;
  source=source.replace(marker,patch);
  fs.writeFileSync(file,source);
}
NODE

# Inject the beta version manager into Admin V2.
test -f public/admin_beta_versions_v175.js
node --check public/admin_beta_versions_v175.js >/dev/null
node <<'NODE'
const fs=require('fs');
const file='public/admin.html';
let source=fs.readFileSync(file,'utf8');
if(!source.includes('admin_beta_versions_v175.js')){
  const marker='document.open();document.write(h);document.close()';
  if(!source.includes(marker))throw new Error('Admin V2 loader marker not found for beta manager');
  const patch=`h=h.replace('</body>','<script defer src="/admin_beta_versions_v175.js?v=175"><\\/script></body>');${marker}`;
  source=source.replace(marker,patch);
  fs.writeFileSync(file,source);
}
NODE

# Inject visitor tracking into Admin V2 without changing the Admin runtime core.
test -f public/admin_visitor_tracking_v177.js
node --check public/admin_visitor_tracking_v177.js >/dev/null
node <<'NODE'
const fs=require('fs');
const file='public/admin.html';
let source=fs.readFileSync(file,'utf8');
if(!source.includes('admin_visitor_tracking_v177.js')){
  const marker='document.open();document.write(h);document.close()';
  if(!source.includes(marker))throw new Error('Admin V2 loader marker not found for visitor tracking');
  const patch=`h=h.replace('</body>','<script defer src="/admin_visitor_tracking_v177.js?v=178"><\\/script></body>');${marker}`;
  source=source.replace(marker,patch);
  fs.writeFileSync(file,source);
}
NODE

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
  if (/^(admin(?:-|\/|\.html)|contact-inbox\.html$|account\.html$|mobile\/|mobile_recovered_v79\/|wiki_recovered\/)/i.test(rel)) continue;
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

# Render PUBG beta versions from Cloudflare D1 so Admin changes appear without code edits.
test -f public/beta_versions_public_v175.js
node --check public/beta_versions_public_v175.js >/dev/null
for page in public/updates.html public/ban-cap-nhat.html; do
  if ! grep -q 'beta_versions_public_v175\.js' "$page"; then
    sed -i 's#</body>#  <script defer src="/beta_versions_public_v175.js?v=176"></script>\n</body>#' "$page"
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

# Canonical production domain + advanced SEO normalization.
# Keep all public references on the branded domain even when a deployment is opened via pages.dev.
node <<'NODE'
const fs = require('fs');
const path = require('path');

const root = path.resolve('public');
const origin = 'https://trainingbot.io.vn';
const defaultShareImage = origin + '/seo-share.svg';
const logoUrl = origin + '/favicon.svg';

const coreSeo = {
  'index.html': {
    title: 'TrainingBot – Tin tức, Wiki & Cập nhật PUBG Mobile',
    description: 'TrainingBot cập nhật tin tức PUBG Mobile, phiên bản mới, Wiki vũ khí, hướng dẫn và nội dung cộng đồng game thủ.'
  },
  'news.html': {
    title: 'Tin tức PUBG Mobile mới nhất – TrainingBot',
    description: 'Tin tức PUBG Mobile mới nhất: bản cập nhật, sự kiện, Esports, skin, phân tích và những nội dung đáng chú ý từ cộng đồng.'
  },
  'wiki.html': {
    title: 'Wiki PUBG Mobile: Vũ khí, phụ kiện & hướng dẫn – TrainingBot',
    description: 'Tra cứu Wiki PUBG Mobile về vũ khí, phụ kiện, phương tiện, bản đồ và hướng dẫn chơi được tổng hợp trên TrainingBot.'
  },
  'ban-cap-nhat.html': {
    title: 'Bản cập nhật PUBG Mobile & bản Beta – TrainingBot',
    description: 'Theo dõi các phiên bản PUBG Mobile, bản Beta, lịch cập nhật, tính năng mới và link trải nghiệm trên TrainingBot.'
  },
  'updates.html': {
    title: 'Bản cập nhật PUBG Mobile & bản Beta – TrainingBot',
    description: 'Theo dõi các phiên bản PUBG Mobile, bản Beta, lịch cập nhật, tính năng mới và link trải nghiệm trên TrainingBot.'
  },
  'community.html': {
    title: 'Cộng đồng TrainingBot – Kết nối game thủ PUBG Mobile',
    description: 'Kết nối cộng đồng game thủ PUBG Mobile, chia sẻ kinh nghiệm, tìm đồng đội và theo dõi hoạt động mới trên TrainingBot.'
  },
  'tim-dong-doi.html': {
    title: 'Tìm đồng đội PUBG Mobile – TrainingBot',
    description: 'Tìm đồng đội PUBG Mobile theo nhu cầu chơi, kết nối nhanh với cộng đồng và cùng tham gia các hoạt động trên TrainingBot.'
  },
  'contact.html': {
    title: 'Liên hệ TrainingBot',
    description: 'Liên hệ TrainingBot để gửi phản hồi, góp ý nội dung, báo lỗi hoặc trao đổi về cộng đồng và website.'
  }
};

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
function routeFor(rel) {
  const unix = rel.split(path.sep).join('/');
  if (unix === 'index.html') return '/';
  if (unix === 'updates.html' || unix === 'ban-cap-nhat.html') return '/ban-cap-nhat';
  if (unix.endsWith('/index.html')) return '/' + unix.slice(0, -'/index.html'.length) + '/';
  return '/' + unix.replace(/\.html$/i, '');
}
function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
function escapeRegex(value) {
  return String(value).replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
}
function stripTags(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
function getTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return stripTags(m && m[1]);
}
function setTitle(html, value) {
  const tag = '<title>' + String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</title>';
  return /<title[^>]*>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, tag)
    : html.replace(/<\/head>/i, '  ' + tag + '\n</head>');
}
function getMeta(html, key, attr = 'name') {
  const re = new RegExp('<meta\\b[^>]*' + attr + '=["\\']' + escapeRegex(key) + '["\\'][^>]*>', 'i');
  const tag = (html.match(re) || [''])[0];
  const m = tag.match(/\bcontent=["']([^"']*)["']/i);
  return m ? m[1] : '';
}
function upsertHead(html, regex, tag) {
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace(/<\/head>/i, '  ' + tag + '\n</head>');
}
function upsertMeta(html, key, value, attr = 'name') {
  const re = new RegExp('<meta\\b[^>]*' + attr + '=["\\']' + escapeRegex(key) + '["\\'][^>]*>', 'i');
  return upsertHead(html, re, '<meta ' + attr + '="' + escapeAttr(key) + '" content="' + escapeAttr(value) + '">');
}
function localImageFor(rel, html) {
  const stem = rel.replace(/\.html$/i, '');
  for (const ext of ['webp','jpg','jpeg','png']) {
    const candidate = stem + '-cover.' + ext;
    if (fs.existsSync(path.join(root, candidate))) return origin + '/' + candidate;
  }
  const imgs = [...html.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi)]
    .map((m) => m[1].split('?')[0])
    .filter((src) => /\.(?:webp|png|jpe?g)$/i.test(src));
  const first = imgs.find((src) => src.startsWith('/'));
  return first ? origin + first : defaultShareImage;
}
function parseArticleDate(html) {
  const meta = html.match(/<div\b[^>]*class=["'][^"']*tb-article-meta[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  const text = stripTags(meta && meta[1]);
  const m = text.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  return m ? m[3] + '-' + m[2] + '-' + m[1] : '';
}
function articleHeadline(html, fallback) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return stripTags(m && m[1]) || fallback;
}
function addJsonLd(html, data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const tag = '<script id="tb-seo-jsonld" type="application/ld+json">' + json + '</script>';
  return upsertHead(html, /<script\b[^>]*id=["']tb-seo-jsonld["'][^>]*>[\s\S]*?<\/script>/i, tag);
}

// Replace any hard-coded preview-domain references in text assets.
for (const file of walk(root)) {
  if (!/\.(?:html|css|js|json|xml|txt)$/i.test(file)) continue;
  let source = fs.readFileSync(file, 'utf8');
  const next = source
    .replace(/https?:\/\/trainingbot-cloudflare\.pages\.dev/gi, origin)
    .replace(/https?:\\\/\\\/trainingbot-cloudflare\.pages\.dev/gi, origin.replace(/\//g, '\\/'));
  if (next !== source) fs.writeFileSync(file, next);
}

const urls = [];
const seen = new Set();

for (const file of walk(root)) {
  if (!/\.html$/i.test(file)) continue;
  const rel = path.relative(root, file).split(path.sep).join('/');

  if (/^(admin(?:-|\/|\.html)|contact-inbox\.html$|404\.html$)/i.test(rel)) continue;

  let html = fs.readFileSync(file, 'utf8');

  const core = coreSeo[rel];
  if (core) {
    html = setTitle(html, core.title);
    html = upsertMeta(html, 'description', core.description);
  }

  const isLegacyMobile = /^(?:mobile|mobile_recovered_v79)\//i.test(rel);
  const isRecoveredWiki = /^wiki_recovered\//i.test(rel);
  const isPrivateAccount = /^account\.html$/i.test(rel);
  const isDuplicateUpdates = rel === 'updates.html';
  const noindex = isLegacyMobile || isRecoveredWiki || isPrivateAccount || isDuplicateUpdates;

  let canonicalRoute = routeFor(rel);
  if (isLegacyMobile) {
    const leaf = rel.split('/').pop().replace(/\.html$/i, '');
    if (leaf === 'index') canonicalRoute = '/';
    else if (leaf === 'updates') canonicalRoute = '/ban-cap-nhat';
    else if (['community','contact','news','wiki'].includes(leaf)) canonicalRoute = '/' + leaf;
    else canonicalRoute = '/';
  } else if (isRecoveredWiki) {
    canonicalRoute = '/wiki';
  }

  const canonical = origin + canonicalRoute;
  const title = getTitle(html) || 'TrainingBot';
  const description = getMeta(html, 'description') || 'TrainingBot — Gaming Knowledge Hub dành cho cộng đồng game thủ.';
  const image = localImageFor(rel, html);
  const isArticle = /class=["'][^"']*tb-article(?:\s|["'])/i.test(html) || /<article\b/i.test(html);
  const robots = noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large';

  html = upsertHead(html, /<link\b[^>]*rel=["']canonical["'][^>]*>/i,
    '<link rel="canonical" href="' + escapeAttr(canonical) + '">');
  html = upsertHead(html, /<link\b[^>]*rel=["']icon["'][^>]*>/i,
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">');
  html = upsertHead(html, /<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["']vi-VN["'][^>]*>/i,
    '<link rel="alternate" hreflang="vi-VN" href="' + escapeAttr(canonical) + '">');

  html = upsertMeta(html, 'robots', robots);
  html = upsertMeta(html, 'theme-color', '#070a12');

  html = upsertMeta(html, 'og:site_name', 'TrainingBot', 'property');
  html = upsertMeta(html, 'og:locale', 'vi_VN', 'property');
  html = upsertMeta(html, 'og:type', isArticle ? 'article' : 'website', 'property');
  html = upsertMeta(html, 'og:title', title, 'property');
  html = upsertMeta(html, 'og:description', description, 'property');
  html = upsertMeta(html, 'og:url', canonical, 'property');
  html = upsertMeta(html, 'og:image', image, 'property');
  html = upsertMeta(html, 'og:image:alt', title, 'property');

  html = upsertMeta(html, 'twitter:card', 'summary_large_image');
  html = upsertMeta(html, 'twitter:title', title);
  html = upsertMeta(html, 'twitter:description', description);
  html = upsertMeta(html, 'twitter:image', image);

  const graph = [
    {
      '@type': 'Organization',
      '@id': origin + '/#organization',
      name: 'TrainingBot',
      url: origin + '/',
      logo: { '@type': 'ImageObject', url: logoUrl, width: 512, height: 512 }
    },
    {
      '@type': 'WebSite',
      '@id': origin + '/#website',
      url: origin + '/',
      name: 'TrainingBot',
      description: 'Gaming Knowledge Hub dành cho cộng đồng game thủ.',
      publisher: { '@id': origin + '/#organization' },
      inLanguage: 'vi-VN'
    },
    {
      '@type': 'WebPage',
      '@id': canonical + '#webpage',
      url: canonical,
      name: title,
      description,
      isPartOf: { '@id': origin + '/#website' },
      about: { '@id': origin + '/#organization' },
      primaryImageOfPage: { '@type': 'ImageObject', url: image },
      inLanguage: 'vi-VN'
    }
  ];

  if (isArticle) {
    const published = parseArticleDate(html);
    const article = {
      '@type': 'NewsArticle',
      '@id': canonical + '#article',
      mainEntityOfPage: { '@id': canonical + '#webpage' },
      headline: articleHeadline(html, title),
      description,
      image: [image],
      author: { '@id': origin + '/#organization' },
      publisher: { '@id': origin + '/#organization' },
      inLanguage: 'vi-VN'
    };
    if (published) {
      article.datePublished = published;
      article.dateModified = published;
      html = upsertMeta(html, 'article:published_time', published, 'property');
    }
    graph.push(article);
  }

  html = addJsonLd(html, { '@context': 'https://schema.org', '@graph': graph });
  fs.writeFileSync(file, html);

  if (!noindex && !seen.has(canonical)) {
    seen.add(canonical);
    urls.push(canonical);
  }
}

urls.sort((a, b) => a.localeCompare(b, 'vi'));
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => '  <url><loc>' + url.replace(/&/g, '&amp;') + '</loc></url>'),
  '</urlset>',
  ''
].join('\n');
fs.writeFileSync(path.join(root, 'sitemap.xml'), xml);
fs.writeFileSync(
  path.join(root, 'robots.txt'),
  'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /contact-inbox\nSitemap: ' + origin + '/sitemap.xml\n'
);
NODE

# Guard against accidentally shipping the old Pages preview domain in public text assets.
if grep -RIl --include='*.html' --include='*.css' --include='*.js' --include='*.json' --include='*.xml' --include='*.txt' 'trainingbot-cloudflare\.pages\.dev' public | grep -q .; then
  echo 'ERROR: old pages.dev hostname found in public/' >&2
  exit 1
fi
grep -q 'https://trainingbot.io.vn' public/index.html
grep -q 'rel="canonical"' public/index.html
grep -q 'property="og:url"' public/index.html
grep -q 'Sitemap: https://trainingbot.io.vn/sitemap.xml' public/robots.txt
test -f public/sitemap.xml

test -f public/index.html
test -f public/styles.css
test -f public/navigation_v124.js
test -f public/navigation_home_match_v149a.css
test -f public/footer_v135.js
test -f public/footer_v135.css
test -f public/header_search_v152.css
test -f public/header_search_v152.js
test -f public/search-index-v152.json
grep -q 'home_videos_v165\.css' public/index.html
grep -q 'home_videos_v165\.js' public/index.html
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
grep -q 'admin_home_videos_v165\.js' public/admin.html
grep -q 'admin_beta_versions_v175\.js' public/admin.html
grep -q 'admin_visitor_tracking_v177\.js' public/admin.html
grep -q 'visitor_tracking_v177\.js' public/index.html
grep -q 'beta_versions_public_v175\.js' public/updates.html
grep -q 'beta_versions_public_v175\.js' public/ban-cap-nhat.html
test -f functions/api/beta-versions.js
test -f functions/api/v71/admin/beta-versions.js
test -f functions/api/visitor-events.js
test -f functions/api/v71/admin/visitor-events.js
test -f 'functions/download/beta/[version].js'
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
