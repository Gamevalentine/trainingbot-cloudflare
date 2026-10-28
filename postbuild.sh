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
