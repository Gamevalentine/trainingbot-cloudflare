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


# ADMIN LAYOUT V4 — after A–E + V3. Recompose Dashboard using preserved
# legacy nodes and handlers; public website and API routing untouched.
test -f public/admin-layout-v4.js
test -f public/admin-layout-v4.css
node --check public/admin-layout-v4.js
node <<'NODE'
const fs=require("fs"),p="public/admin.html";
let html=fs.readFileSync(p,"utf8");
const marker="document.open();document.write(h);document.close()";
if(!html.includes(marker)||!html.includes("admin-visual-v3.js"))throw Error("V4 requires unchanged Admin A-E/V3 loader");
if(html.includes("admin-layout-v4.js"))throw Error("V4 injected twice");
html=html.replace(marker,
  "h=h.replace('</body>','<script defer src=\"/admin-layout-v4.js?v=1\"><\\/script></body>');"+marker);
fs.writeFileSync(p,html);
NODE
grep -q 'admin-layout-v4.js' public/admin.html

# V4 PREVIEW DEMO: use only synthetic data; no Production credentials or writes.
# Branch gate: this file is intentionally NOT emitted by normal Production builds.
if [[ "${CF_PAGES_BRANCH:-}" == "aion-trainingbot-admin-layout-v4-20261028" || "${TRAININGBOT_LOCAL_DEMO:-}" == "1" ]]; then
  test -f public/admin-demo-runtime.js
  node --check public/admin-demo-runtime.js
  node tools/admin/build-demo.mjs
  test -f public/admin-demo.html
  grep -q 'admin-layout-v4.js' public/admin-demo.html
  if grep -q 'admin-demo-runtime.js' public/admin.html; then
    echo "Synthetic Demo escaped into real Admin" >&2; exit 1
  fi
else
  rm -f public/admin-demo-runtime.js public/admin-demo.html
fi
