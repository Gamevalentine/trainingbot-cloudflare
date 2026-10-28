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
