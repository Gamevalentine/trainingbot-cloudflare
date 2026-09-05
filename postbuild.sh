#!/usr/bin/env bash
set -euo pipefail

test -f public/admin.html
test -f public/index.html
test -f public/news.html
test -f public/admin_posts_manual_v171.js
test -f public/site_posts_v171.js
node --check public/admin_posts_manual_v171.js >/dev/null
node --check public/site_posts_v171.js >/dev/null

node <<'NODE'
const fs=require('fs');
const file='public/admin.html';
let source=fs.readFileSync(file,'utf8');
const script='admin_posts_manual_v171.js';
if(!source.includes(script)){
  const marker='document.open();document.write(h);document.close()';
  if(!source.includes(marker))throw new Error('Admin V2 loader marker not found');
  source=source.replace(marker,`h=h.replace('</body>','<script defer src="/${script}?v=172"><\\/script></body>');${marker}`);
  fs.writeFileSync(file,source);
}
NODE

for page in public/index.html public/news.html; do
  if ! grep -q 'site_posts_v171\.js' "$page"; then
    sed -i 's#</body>#  <script defer src="/site_posts_v171.js?v=171"></script>\n</body>#' "$page"
  fi
done

grep -q 'admin_posts_manual_v171\.js' public/admin.html
grep -q 'site_posts_v171\.js' public/index.html
grep -q 'site_posts_v171\.js' public/news.html
