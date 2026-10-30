#!/usr/bin/env bash
set -euo pipefail

test -f public/admin.html
test -f public/index.html
test -f public/news.html
test -f public/admin_posts_manual_v171.js
test -f public/admin_posts_feature_v173.js
test -f public/admin_posts_editor_v183.js
test -f public/site_posts_v171.js
test -f public/site_featured_posts_v173.js
node --check public/admin_posts_manual_v171.js >/dev/null
node --check public/admin_posts_feature_v173.js >/dev/null
node --check public/admin_posts_editor_v183.js >/dev/null
node --check public/site_posts_v171.js >/dev/null
node --check public/site_featured_posts_v173.js >/dev/null

node <<'NODE'
const fs=require('fs');
const file='public/admin.html';
let source=fs.readFileSync(file,'utf8');
const manual='admin_posts_manual_v171.js';
const feature='admin_posts_feature_v173.js';
const editor='admin_posts_editor_v183.js';
if(!source.includes(manual)||!source.includes(feature)||!source.includes(editor)){
  const marker='document.open();document.write(h);document.close()';
  if(!source.includes(marker))throw new Error('Admin V2 loader marker not found');
  const scripts=`<script defer src="/${manual}?v=173"><\\/script><script defer src="/${feature}?v=173"><\\/script><script defer src="/${editor}?v=185"><\\/script>`;
  source=source.replace(marker,`h=h.replace('</body>','${scripts}</body>');${marker}`);
  fs.writeFileSync(file,source);
}
NODE

for page in public/index.html public/news.html; do
  if ! grep -q 'site_posts_v171\.js' "$page"; then
    sed -i 's#</body>#  <script defer src="/site_posts_v171.js?v=173"></script>\n</body>#' "$page"
  fi
done

if ! grep -q 'site_featured_posts_v173\.js' public/news.html; then
  sed -i 's#</body>#  <script defer src="/site_featured_posts_v173.js?v=174"></script>\n</body>#' public/news.html
fi

# ADM-01: guarded readable state corrections to generated Admin HTML only.
node tools/admin/adm01-runtime-transform.mjs

# ADM-02/03 only: append readable presentation logic after all legacy Admin
# scripts (includes Bài viết and Theo dõi truy cập dynamic navigation).
test -f public/admin-stage-b-ui.js
node --check public/admin-stage-b-ui.js
node <<'NODE'
const fs=require('fs'),p='public/admin.html';
let source=fs.readFileSync(p,'utf8');
const marker='document.open();document.write(h);document.close()';
if(!source.includes(marker))throw new Error('Stage B Admin loader marker changed');
if(source.includes('admin-stage-b-ui.js'))throw new Error('Stage B UI accidentally injected twice');
const statement="h=h.replace('</body>','<script defer src=\"/admin-stage-b-ui.js?v=1\"><\\/script></body>');";
source=source.replace(marker,statement+marker);
fs.writeFileSync(p,source);
NODE
grep -q 'admin-stage-b-ui.js' public/admin.html


# ADM-04/05/06: install the readable Stage C UI only AFTER Stage B is loaded.
# All Admin functions keep their original authentication and DB binding.
test -f public/admin-stage-c-ui.js
node --check public/admin-stage-c-ui.js
node --check public/admin_posts_manual_v171.js
node --check public/admin_posts_editor_v183.js
node --check public/admin_posts_feature_v173.js
node <<'NODE'
const fs=require('fs'),path='public/admin.html';
let html=fs.readFileSync(path,'utf8');
const marker='document.open();document.write(h);document.close()';
if(!html.includes(marker)||!html.includes('admin-stage-b-ui.js'))throw Error('Stage C requires intact Stage B loader');
if(html.includes('admin-stage-c-ui.js'))throw Error('Stage C duplicate injection');
html=html.replace(marker,"h=h.replace('</body>','<script defer src=\"/admin-stage-c-ui.js?v=1\"><\\/script></body>');"+marker);
fs.writeFileSync(path,html);
NODE
grep -q 'admin-stage-c-ui.js' public/admin.html


# ADM-07: apply audited state fixes to *generated* Admin only, leaving packed source untouched.
node --check tools/admin/adm07-runtime-state-transform.mjs
node tools/admin/adm07-runtime-state-transform.mjs
test -f public/admin-stage-d-ui.js
node --check public/admin-stage-d-ui.js
node <<'NODE'
const fs=require('fs'),file='public/admin.html';let html=fs.readFileSync(file,'utf8');
const marker='document.open();document.write(h);document.close()';
if(!html.includes(marker)||!html.includes('admin-stage-c-ui.js'))throw Error('Stage D depends on completed Stage C loader');
if(html.includes('admin-stage-d-ui.js'))throw Error('Stage D script unexpectedly duplicated');
html=html.replace(marker,"h=h.replace('</body>','<script defer src=\"/admin-stage-d-ui.js?v=1\"><\\/script></body>');"+marker);
fs.writeFileSync(file,html);
NODE
grep -q 'admin-stage-d-ui.js' public/admin.html


# VISUAL V3: a dedicated presentation layer after the fully initialized
# Admin A–E runtime. Does not affect the public website or API handlers.
test -f public/admin-visual-v3.js
test -f public/admin-visual-v3.css
node --check public/admin-visual-v3.js
node <<'NODE'
const fs=require('fs'),file='public/admin.html';
let html=fs.readFileSync(file,'utf8');
const marker='document.open();document.write(h);document.close()';
if(!html.includes(marker)||!html.includes('admin-stage-d-ui.js'))throw Error('Visual V3 requires completed Admin A-E');
if(html.includes('admin-visual-v3.js'))throw Error('Visual V3 script duplicated');
const inject="h=h.replace('</body>','<script defer src=\"/admin-visual-v3.js?v=3\"><\\/script></body>');";
html=html.replace(marker,inject+marker);
fs.writeFileSync(file,html);
NODE
grep -q 'admin-visual-v3.js' public/admin.html


# Header 205: clone the approved Community header into the 6 main pages
# after all Page transformations. No Admin, API, D1 or R2 modifications.
node --check tools/public/unify-main-header.mjs
node tools/public/unify-main-header.mjs
test -f public/tb-community-header-v205.css
for page in index ban-cap-nhat news wiki community contact; do
  grep -q 'tb-community-header-v205.css' "public/$page.html"
  grep -q 'tb-community-header-unified' "public/$page.html"
done


# Admin V5: six categories in sidebar, all function cards on the main screen.
# The original 13 legacy links and their handlers remain intact but hidden.
test -f public/admin-six-groups-v5.js
test -f public/admin-six-groups-v5.css
node --check public/admin-six-groups-v5.js
node <<'NODE'
const fs=require("node:fs"),file="public/admin.html";
let html=fs.readFileSync(file,"utf8");
const marker="document.open();document.write(h);document.close()";
if(!html.includes(marker)||!html.includes("admin-visual-v3.js"))throw Error("V5 requires completed Admin V3");
if(html.includes("admin-six-groups-v5.js"))throw Error("V5 duplicated");
// The reconstructed Admin HTML uses document.open/write/close; deferring the
// final script inside that HTML can prevent execution in Chrome. Attach it to
// the finished document explicitly after document.close().
const attach=';setTimeout(()=>{const s=document.createElement("script");s.src="/admin-six-groups-v5.js?v=2";document.body?.append(s)},0)';
html=html.replace(marker,marker+attach);
fs.writeFileSync(file,html);
NODE
grep -q 'admin-six-groups-v5.js' public/admin.html

# Admin V5 isolated fake-data Preview; NEVER emit Demo from main/Production.
if [[ "${CF_PAGES_BRANCH:-}" == "aion-trainingbot-admin-six-groups-20261029" || "${TRAININGBOT_LOCAL_DEMO:-}" == "1" ]]; then
  test -f public/admin-demo-runtime.js
  node --check public/admin-demo-runtime.js
  node tools/admin/build-demo.mjs
  test -f public/admin-demo.html
  if grep -q 'admin-demo-runtime.js' public/admin.html; then
    echo "Demo runtime leaked into real Admin" >&2; exit 1
  fi
else
  rm -f public/admin-demo-runtime.js public/admin-demo.html
fi


# Wiki V2 Stage B: additional public presentation only, after existing v149
# data patches and preserved weapon/vehicle/map detail handlers.
test -f public/wiki.html
test -f public/wiki-stage-b-v2.css
test -f public/wiki-stage-b-v2.js
node --check public/wiki-stage-b-v2.js
node <<'NODE'
const fs=require("node:fs");
const file="public/wiki.html";
let html=fs.readFileSync(file,"utf8");
if(!html.includes('wiki_audit_v149.js'))throw Error("Wiki B requires existing audited runtime");
if(html.includes("wiki-stage-b-v2.js")||html.includes("wiki-stage-b-v2.css"))throw Error("Wiki B duplicate");
html=html.replace("</head>",'<link rel="stylesheet" href="/wiki-stage-b-v2.css?v=1">\n</head>');
html=html.replace("</body>",'<script defer src="/wiki-stage-b-v2.js?v=1"></script>\n</body>');
fs.writeFileSync(file,html);
NODE
grep -q wiki-stage-b-v2.css public/wiki.html
grep -q wiki-stage-b-v2.js public/wiki.html

# Wiki V2 Stage C — source-backed historical weapon profiles, Preview only.
# No API/Worker/D1/R2 changes. Builds on A (PR21) and B (PR22).
test -f public/wiki-stage-b-v2.js
test -f public/wiki-stage-c-weapon.js
test -f public/wiki-stage-c-weapon.css
test -f public/wiki-stage-c-evidence.json
node --check public/wiki-stage-c-weapon.js
node -e "const e=require('./public/wiki-stage-c-evidence.json');if(e.schemaVersion!=='wiki-c1'||!Object.keys(e.weapons).length)process.exit(2)"
node <<'NODE'
const fs=require('node:fs'),file='public/wiki.html';
let html=fs.readFileSync(file,'utf8');
for(const required of ['wiki-stage-b-v2.js','wiki_verified_data_v145.js','wiki_audit_v149.js']){
 if(!html.includes(required))throw Error('Wiki C requires prior loader '+required);
}
if(html.includes('wiki-stage-c-weapon.js'))throw Error('Wiki C duplicated');
const script='<script defer src="/wiki-stage-c-weapon.js?v=1"></script>';
html=html.replace('</body>',script+'\n</body>');
fs.writeFileSync(file,html);
NODE
grep -q wiki-stage-c-weapon.js public/wiki.html
if grep -q wiki-stage-c-weapon.js public/admin.html; then
 echo 'Wiki C leaked into Admin' >&2; exit 2
fi

# Wiki V2 Stage D: read-only source panels for attachments, vehicles and maps.
test -f public/wiki-stage-d-v2.js
test -f public/wiki-stage-d-v2.css
test -f public/wiki-stage-d-evidence.json
node --check public/wiki-stage-d-v2.js
node -e "const e=require('./public/wiki-stage-d-evidence.json');if(e.schemaVersion!=='wiki-d1'||e.coverage.attachments.total!==51||e.coverage.vehicles.total!==26||e.coverage.maps.total!==8)process.exit(2)"
node <<'NODE'
const fs=require('node:fs'),p='public/wiki.html';
let h=fs.readFileSync(p,'utf8');
if(!h.includes("wiki-stage-c-weapon.js")||!h.includes("wiki-stage-b-v2.js"))throw Error('Wiki D requires B and C');
if(h.includes("wiki-stage-d-v2.js"))throw Error('Wiki D script duplicated');
h=h.replace('</body>','<script defer src="/wiki-stage-d-v2.js?v=1"></script>\n</body>');
fs.writeFileSync(p,h);
NODE
grep -q wiki-stage-d-v2.js public/wiki.html
if grep -q wiki-stage-d-v2.js public/admin.html; then echo 'Wiki D leaked into Admin' >&2; exit 2; fi

# Wiki V2 Stage E — source-safe comparison, 2 to 3 weapons, Preview only.
test -f public/wiki-stage-e-compare.js
test -f public/wiki-stage-e-compare.css
test -f public/wiki-stage-c-evidence.json
node --check public/wiki-stage-e-compare.js
node <<'NODE'
const fs=require('node:fs'),p='public/wiki.html';
let h=fs.readFileSync(p,'utf8');
for(const file of ['wiki-stage-b-v2.js','wiki-stage-c-weapon.js','wiki-stage-d-v2.js','wiki_verified_data_v145.js']){
 if(!h.includes(file))throw Error('Wiki E requires prior loader '+file);
}
if(h.includes("wiki-stage-e-compare.js"))throw Error('Wiki E script duplicated');
h=h.replace('</body>','<script defer src="/wiki-stage-e-compare.js?v=1"></script>\n</body>');
fs.writeFileSync(p,h);
const v145=fs.readFileSync('public/wiki_verified_data_v145.js','utf8');
if(!v145.includes('window.__TB_WIKI_E__?.selecting'))throw Error('Wiki E compare capture guard missing');
if(fs.readFileSync('public/admin.html','utf8').includes('wiki-stage-e-compare.js'))throw Error('E leaked into Admin');
NODE


# Wiki V2 Stage F — searchable editorial practice guides with read-only C/D sources.
# Stage F is an isolated presentation layer installed *after* Wiki E.
for asset in wiki-stage-f-guides.js wiki-stage-f-guides.css wiki-stage-f-guides.json; do
  test -f "public/$asset"
done
node --check public/wiki-stage-f-guides.js
node -e "const d=require('./public/wiki-stage-f-guides.json'); if(d.schemaVersion!=='wiki-f1'||d.guides.length!==16||new Set(d.guides.map(x=>x.id)).size!==16)process.exit(2)"
node <<'NODE'
const fs=require('node:fs'),p='public/wiki.html';
let h=fs.readFileSync(p,'utf8');
for(const prior of ['wiki-stage-b-v2.js','wiki-stage-c-weapon.js','wiki-stage-d-v2.js','wiki-stage-e-compare.js']){
 if(!h.includes(prior))throw Error('Wiki F requires '+prior);
}
if(h.includes('wiki-stage-f-guides.js')||h.includes('wiki-stage-f-guides.css'))throw Error('Wiki F duplicate');
h=h.replace('</head>','<link rel="stylesheet" href="/wiki-stage-f-guides.css?v=1">\n</head>');
h=h.replace('</body>','<script defer src="/wiki-stage-f-guides.js?v=1"></script>\n</body>');
fs.writeFileSync(p,h);
if(fs.readFileSync('public/admin.html','utf8').includes('wiki-stage-f-guides.js'))throw Error('Wiki F must not load in Admin');
NODE

# Wiki V2 G — isolated Admin review workbench, gated to G Preview or local QA.
# No release path: Production/Admin remain unchanged until separate approval.
if [[ "${CF_PAGES_BRANCH:-}" == "main" || "${CF_PAGES_BRANCH:-}" == "aion-trainingbot-wiki-v2-public-release-20261029" || "${CF_PAGES_BRANCH:-}" == "aion-trainingbot-wiki-stage-g-20261029" || "${CF_PAGES_BRANCH:-}" == "aion-trainingbot-wiki-stage-h-20261029" || "${CF_PAGES_BRANCH:-}" == "aion-trainingbot-wiki-stage-i-20261029" || "${CF_PAGES_BRANCH:-}" == "aion-trainingbot-seo-recovery-20261029" || "${TRAININGBOT_LOCAL_G_QA:-}" == "1" || "${TRAININGBOT_LOCAL_H_QA:-}" == "1" || "${TRAININGBOT_LOCAL_I_QA:-}" == "1" ]]; then
  for asset in wiki-stage-g-snapshot.js admin-wiki-stage-g.js admin-wiki-stage-g.css wiki-stage-f-guides.json; do
    test -f "public/$asset"
  done
  node --check public/wiki-stage-g-snapshot.js
  node --check public/admin-wiki-stage-g.js
  node <<'NODE'
const fs=require('node:fs');
const wiki='public/wiki.html',admin='public/admin.html';
let w=fs.readFileSync(wiki,'utf8');
if(!w.includes('wiki-stage-f-guides.js')||w.includes('wiki-stage-g-snapshot.js'))throw Error('G requires F and no duplicate');
w=w.replace('</body>','<script defer src="/wiki-stage-g-snapshot.js?v=1"></script>\n</body>');
fs.writeFileSync(wiki,w);
let h=fs.readFileSync(admin,'utf8');
const marker='document.open();document.write(h);document.close()';
if(!h.includes(marker)||!h.includes('admin-six-groups-v5.js'))throw Error('G requires genuine protected Admin V5');
if(h.includes('admin-wiki-stage-g.js'))throw Error('G duplicated');
const attach=';setTimeout(()=>{const l=document.createElement("link");l.rel="stylesheet";l.href="/admin-wiki-stage-g.css?v=1";document.head.append(l);const s=document.createElement("script");s.src="/admin-wiki-stage-g.js?v=1";document.body?.append(s)},150)';
h=h.replace(marker,marker+attach);
fs.writeFileSync(admin,h);
if(w.includes('admin-wiki-stage-g.js')||h.includes('wiki-stage-g-snapshot.js'))throw Error('Wiki/Admin boundaries violated');
NODE
else
  rm -f public/admin-wiki-stage-g.js public/admin-wiki-stage-g.css public/wiki-stage-g-snapshot.js
fi

# Wiki V2 H — only H branch or explicit QA flag; no Worker/D1/R2 writes.
if [[ "${CF_PAGES_BRANCH:-}" == "main" || "${CF_PAGES_BRANCH:-}" == "aion-trainingbot-wiki-v2-public-release-20261029" || "${CF_PAGES_BRANCH:-}" == "aion-trainingbot-wiki-stage-h-20261029" || "${CF_PAGES_BRANCH:-}" == "aion-trainingbot-wiki-stage-i-20261029" || "${CF_PAGES_BRANCH:-}" == "aion-trainingbot-seo-recovery-20261029" || "${TRAININGBOT_LOCAL_H_QA:-}" == "1" || "${TRAININGBOT_LOCAL_I_QA:-}" == "1" ]]; then
  test -f public/wiki-stage-h-perf.js
  node --check public/wiki-stage-h-perf.js
  node --check tools/wiki/stage-h-build.mjs
  node tools/wiki/stage-h-build.mjs
  node <<'NODE'
const fs=require('node:fs'),p='public/wiki.html';
let h=fs.readFileSync(p,'utf8');
if(!h.includes('wiki-stage-f-guides.js')||!h.includes('wiki-stage-g-snapshot.js'))throw Error('Wiki H requires F and G Preview');
if(h.includes('wiki-stage-h-perf.js'))throw Error('H loader duplicated');
h=h.replace('</body>','<script defer src="/wiki-stage-h-perf.js?v=1"></script>\n</body>');
fs.writeFileSync(p,h);
if(fs.readFileSync('public/admin.html','utf8').includes('wiki-stage-h-perf.js'))throw Error('H leaked into Admin');
NODE
else
  rm -f public/wiki-stage-h-perf.js
fi

# SEO-08 — enrich three original thin editorial category pages after Wiki V2 build.
# Preserve original route, canonical metadata, site header/footer and JS.
node --check tools/seo/seo-category-enhance.mjs
node tools/seo/seo-category-enhance.mjs

# SEO content hygiene — internal navigation must not point at the noindex /updates alias.
node tools/seo/seo-legacy-links.mjs

# UI-NAV-01: show "Beta" for the existing /ban-cap-nhat destination.
# Run after unified header and SEO rewrites; do not change routes, canonical or Admin.
node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve('public');
const required = ['index.html','ban-cap-nhat.html','news.html','wiki.html','community.html','contact.html'];
let replaced = 0;
function walk(folder) {
  return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry => {
    const full=path.join(folder,entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
const anchor=/(<a\b[^>]*\bhref=(["'])\/ban-cap-nhat\2[^>]*>)\s*Bản cập nhật\s*(<\/a>)/gi;
for(const file of walk(root)) {
  if(!file.endsWith('.html'))continue;
  const rel=path.relative(root,file).split(path.sep).join('/');
  if(/^(admin(?:-|\/|\.html)|contact-inbox\.html$)/i.test(rel))continue;
  const html=fs.readFileSync(file,'utf8');
  const revised=html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi,header=>
    header.replace(anchor,(_all,open,_quote,close)=>{replaced++;return open+'Beta'+close;})
  );
  if(revised!==html)fs.writeFileSync(file,revised);
}
for(const name of ['navigation_v124.js','mobile_menu_v5.js']) {
  const file=path.join(root,name);
  if(!fs.existsSync(file))continue;
  const js=fs.readFileSync(file,'utf8');
  const revised=js.replace(/Bản cập nhật/g,'Beta');
  if(revised!==js)fs.writeFileSync(file,revised);
}
for(const page of required) {
  const html=fs.readFileSync(path.join(root,page),'utf8');
  const header=(html.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)||[])[0]||'';
  const matches=header.match(/<a\b[^>]*\bhref=(["'])\/ban-cap-nhat\1[^>]*>\s*Beta\s*<\/a>/gi)||[];
  if(matches.length!==1)throw Error('UI-NAV-01: exactly one desktop Beta link expected on '+page);
  if(!/<nav\b[^>]*class="mobile-nav"/i.test(header))throw Error('UI-NAV-01: mobile navigation mount missing on '+page);
}
if(!fs.readFileSync(path.join(root,'index.html'),'utf8').includes('<h2>PUBG Mobile Beta</h2>')) {
  throw Error('UI-NAV-01: homepage Beta heading missing');
}
console.log('UI-NAV-01: Beta navigation verified on six main pages; '+replaced+' labels updated');
NODE
