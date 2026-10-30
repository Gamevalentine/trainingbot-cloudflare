import assert from 'node:assert/strict';
import fs from 'node:fs';
const ledger=JSON.parse(fs.readFileSync('docs/wiki/seo11d2-catalog-review-20261031.json','utf8'));
const c=JSON.parse(fs.readFileSync('overrides/wiki-stage-c-evidence.json','utf8'));
const d=JSON.parse(fs.readFileSync('overrides/wiki-stage-d-evidence.json','utf8'));
const wiki=fs.readFileSync('public/wiki.html','utf8');
const source=fs.readFileSync('overrides/wiki.html','utf8');
const v147=fs.readFileSync('overrides/wiki_catalog_verified_v147.js','utf8');
const v145=fs.readFileSync('overrides/wiki_verified_data_v145.js','utf8');
function originalCatalog(html){
 const pos=html.indexOf('const DATA='),at=html.indexOf('{',pos);
 assert(pos>=0,'Wiki source DATA missing');
 let depth=0,quoted=false,escaped=false;
 for(let i=at;i<html.length;i++){
  const ch=html[i];
  if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false;continue;}
  if(ch==='"'){quoted=true;continue;}
  if(ch==='{')depth++;
  if(ch==='}'&&--depth===0)return JSON.parse(html.slice(at,i+1));
 }
 throw new Error('DATA not closed');
}
const sourceCatalog=originalCatalog(source);
const newWeapons=[...v147.matchAll(/\{after:'[^']+',row:\[([^\]]+)\]\}/g)].map(m=>[...m[1].matchAll(/'([^']*)'/g)].map(t=>t[1]));
const newAttachments=[...v145.matchAll(/DATA\.attachments\.push\(\['([^']+)','([^']+)'/g)].map(m=>[m[1],m[2]]);
assert.equal(newWeapons.length,5);
assert.equal(newAttachments.length,2);
for(const row of newWeapons)if(!sourceCatalog.weapons.some(r=>r[0]===row[0]))sourceCatalog.weapons.push(row);
for(const row of newAttachments)if(!sourceCatalog.attachments.some(r=>r[0]===row[0]))sourceCatalog.attachments.push(row);
assert.deepEqual(ledger.counts,{weapons:61,attachments:51,vehicles:26,maps:8});
assert.equal(ledger.records.length,146);
for(const [kind,rows] of Object.entries(sourceCatalog)){
 const expected=rows.map(r=>r[0]).sort();
 const audited=ledger.records.filter(r=>r.kind===kind).map(r=>r.name).sort();
 assert.deepEqual(audited,expected,'Catalog audit missing/extra '+kind);
}
assert.equal(Object.keys(c.weapons).length,11);
assert.equal(d.coverage.attachments.verifiedCompatibility,2);
assert.equal(d.coverage.attachments.historicalVerifiedPairs,4);
assert.equal(d.coverage.attachments.currentVersionVerifiedCompatibility,0);
assert.equal(d.coverage.attachments.verifiedImageRights,0);
assert.equal(d.coverage.vehicles.verifiedSpecificationsAll,0);
assert.equal(d.coverage.maps.officialModeSpecificNotes,3);
assert.equal(d.unlisted['Thuyền Cao Su'].seats,4);
assert.deepEqual(d.attachments['Full-Auto Mod'].compatibleWeapons,['M16A4','Mk47 Mutant']);
assert.deepEqual(d.attachments['Gun Shield'].compatibleWeapons,['DP-28','M249']);
for(const item of ['Full-Auto Mod','Gun Shield']){
 const ev=d.attachments[item];const src=d.sources[ev.sourceId];
 assert(src?.url.startsWith('https://www.pubgmobile.com/'),'PUBG source must be official '+item);
 assert(ev.status==='historical_official_compatibility');
}
assert(v147.includes("'ACE32':47"),'4.6 47 correction missing');
assert(!v147.includes('const DAMAGE_CURRENT={'),'Stale current label still in source');
assert(!v147.includes("'ACE32':46"),'ACE32 stale base damage 46 still in current patch');
assert(wiki.includes('id="tb-wiki-nguon-kiem-chung"'),'Static evidence panel must be present after build');
for(const phrase of ['ACE32 — sát thương cơ bản 46 → 47','Full-Auto Mod — M16A4 và Mk47','Gun Shield — DP-28 và M249','Thuyền Cao Su — 4 chỗ'])
 assert(wiki.includes(phrase),'Missing readable official evidence '+phrase);
for(const dest of ['https://www.pubgmobile.com/en/event/Midnight-Hunters/','https://www.pubgmobile.com/en/event/260Devnotes/','https://www.pubgmobile.com/id/event/Imagiversary/','https://pubgm.vnggames.com/tin-tuc/thong-bao-cap-nhat/thong-bao-cap-nhat-phien-ban-4-6.html'])
 assert(wiki.includes('href="'+dest+'"'),'Missing source link '+dest);
const css=fs.readFileSync('public/seo11d2-wiki-sources.css','utf8');
assert(css.includes('@media(max-width:840px)'));
assert.equal((wiki.match(/<h1\b/gi)||[]).length,1,'Wiki should keep one H1');
assert(wiki.includes('https://trainingbot.io.vn/wiki'),'canonical must remain /wiki');
assert(!wiki.includes('href="/updates"'),'no legacy link');
assert(fs.existsSync('public/admin.html'),'Admin missing');
console.log('SEO-11.D.2 PASS: 146 audited catalog rows, 2 historical attachment pairings / 4 documented weapon pairs, ACE32 v4.6 47, unlisted 4-seat boat, canonical and SEO evidence labels');
