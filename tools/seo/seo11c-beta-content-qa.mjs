import fs from 'node:fs';
import assert from 'node:assert/strict';
const slugBeta1='pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y';
const slugCorrection='battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2';
for(const page of ['ban-cap-nhat.html','updates.html']){
 const html=fs.readFileSync('public/'+page,'utf8');
 const fragment=(html.match(/<section\b[^>]*id="pubg-mobile-47-beta"[^>]*>[\s\S]*?<\/section>/i)||[])[0]||'';
 assert(fragment,page+' editorial section absent');
 assert.equal((html.match(/id="pubg-mobile-47-beta"/g)||[]).length,1,page+' duplicated Beta editorial');
 assert(html.indexOf('id="tb-beta-versions"') < html.indexOf('id="pubg-mobile-47-beta"'),page+' must follow version list');
 assert(html.indexOf('id="pubg-mobile-47-beta"') < html.indexOf('id="tb-game-release-help"'),page+' must precede download guide');
 assert(fragment.includes('<h2 id="tb-beta-editorial-title">PUBG Mobile 4.7 Beta:'),page+' context heading absent');
 for(const slug of [slugBeta1,slugCorrection]){
   assert.equal((fragment.match(new RegExp('href="/bai-viet/'+slug+'"','g'))||[]).length,1,page+' required verified article link '+slug);
 }
 assert(fragment.includes('Đính chính Erangel Subzero'),page+' correction must be clearly labelled');
 assert(fragment.includes('Không coi tên Beta Test 2 là xác nhận bản cài 4.7.2 đã phát hành'),page+' incorrect Beta release claim');
 assert(fragment.includes('href="#tb-beta-versions"')&&fragment.includes('href="#tb-game-release-help"'),page+' practical anchor links absent');
 assert(html.includes('href="/seo11-beta-content.css?v=1"'),page+' scoped stylesheet absent');
 assert(!fragment.includes('href="/updates"'),page+' legacy route must not be linked');
 assert.equal((html.match(/<h1\b/gi)||[]).length,1,page+' should preserve existing hero H1');
}
const css=fs.readFileSync('public/seo11-beta-content.css','utf8');
assert(css.includes('@media(max-width:680px)'),'responsive Beta editorial CSS missing');
const home=fs.readFileSync('public/index.html','utf8');
assert(home.includes('<h2>PUBG Mobile Beta</h2>'),'homepage Beta heading changed');
for(const path of ['public/admin.html','public/wiki.html'])assert(fs.existsSync(path),path+' missing');
console.log('SEO-11.C PASS: static crawlable Beta 4.7 context, two verified article links, correction label, anchors, mobile CSS; Admin/Wiki untouched');
