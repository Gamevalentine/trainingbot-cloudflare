import fs from 'node:fs';
import assert from 'node:assert/strict';

const origin='https://trainingbot.io.vn';
const expectedTitle="PUBG Mobile Beta: Phiên bản và hướng dẫn tải | TrainingBot";
const expectedDescription="Khám phá PUBG Mobile Beta: các phiên bản thử nghiệm, trạng thái tải và hướng dẫn cài APK/XAPK trên Android. Theo dõi thông tin tại TrainingBot.";
const pages=['ban-cap-nhat.html','updates.html'];

for (const page of pages) {
  const html=fs.readFileSync('public/'+page,'utf8');
  const title=(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)||[])[1]?.trim()||'';
  const description=(html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)||[])[1]||'';
  const canonicalTag=(html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)||[])[0]||'';
  const canonical=(canonicalTag.match(/href=["']([^"']+)["']/i)||[])[1]||'';
  assert.equal(title,expectedTitle,page+' SEO title');
  assert.equal(description,expectedDescription,page+' SEO description');
  assert.equal(canonical,origin+'/ban-cap-nhat',page+' canonical');
  const noindex=/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
  if (page==='updates.html') assert(noindex,'Legacy /updates alias must remain noindex');
  else assert(!noindex,'Canonical /ban-cap-nhat page must remain indexable');
  assert(html.includes('href="/ban-cap-nhat"'),page+' original route link kept');
}
const home=fs.readFileSync('public/index.html','utf8');
assert(home.includes('href="/ban-cap-nhat"'),'Homepage navigation route preserved');
assert(home.includes('<h2>PUBG Mobile Beta</h2>'),'Homepage Beta section preserved');
const robots=fs.readFileSync('public/robots.txt','utf8');
for(const f of ['/sitemap.xml','/sitemap-posts.xml'])assert(robots.includes(origin+f),'Robots sitemap reference missing '+f);
console.log('SEO-11 Beta metadata QA PASS: title, description, canonicals, homepage, sitemap references');
