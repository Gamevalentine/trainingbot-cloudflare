// F.3 Preview-only: deterministic catalog parity gate (no API, model, D1 or secrets).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync('public/wiki.html','utf8');
const v145=readFileSync('public/wiki_verified_data_v145.js','utf8');
const v147=readFileSync('public/wiki_catalog_verified_v147.js','utf8');
const match=html.match(/\bconst DATA=(\{[\s\S]*?\});/);
assert.ok(match,'Missing embedded Wiki DATA');
const data=JSON.parse(match[1]);
const extraWeapons=[...v147.matchAll(/\brow:\['([^']+)'/g)].map(m=>m[1]);
const extraAttachments=[...v145.matchAll(/DATA\.attachments\.push\(\['([^']+)'/g)].map(m=>m[1]);
assert.equal(extraWeapons.length,5,'Require exactly five v147 additions');
assert.equal(extraAttachments.length,2,'Require exactly two v145 additions');
const counts={
  weapons:new Set([...data.weapons.map(x=>x[0]),...extraWeapons]).size,
  attachments:new Set([...data.attachments.map(x=>x[0]),...extraAttachments]).size,
  vehicles:data.vehicles.length,
  maps:data.maps.length
};
assert.deepEqual(counts,{weapons:61,attachments:51,vehicles:26,maps:8});
for(const [kind,label] of [['weapons','Vũ khí'],['attachments','Phụ kiện'],['vehicles','Phương tiện'],['maps','Bản đồ']]){
  assert.ok(html.includes('<b>'+counts[kind]+'</b><span>'+label+'</span>'),'Overview stale: '+kind);
}
for(const [kind,label] of [['weapons','Vũ khí'],['attachments','Phụ kiện']]){
  assert.ok(html.includes('data-tab="'+kind+'">'+label+' · '+counts[kind]),'Legacy tab stale: '+kind);
}
const scripts=['wiki_verified_data_v145.js','wiki_verified_fix_v146.js',
  'wiki_catalog_verified_v147.js','wiki_vehicle_map_detail_v148.js','wiki_audit_v149.js'];
let last=-1;
for(const name of scripts){
  const pattern='src="/'+name+'?';
  const at=html.indexOf(pattern);
  assert.ok(at>last,'Missing/out-of-order browser script: '+name);
  assert.equal(html.indexOf(pattern,at+1),-1,'Duplicate browser script: '+name);
  last=at;
}
console.log('PASS F.3 Preview Wiki 61/51/26/8 and ordered v145-v149 scripts');
