// F.3 Preview-only: deterministic catalog parity gate (no API, model, D1 or secrets).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

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
// Execute the real v147 source against a minimal legacy-DOM fixture. The
// fallback must redraw the 56-row list after adding five source-backed rows.
const legacyData=JSON.parse(match[1]);
for(const name of extraAttachments)legacyData.attachments.push([name,'Đã bổ sung','']);
let clicks=0;
const legacyTabs=['weapons','attachments'].map(kind=>({
  dataset:{tab:kind},textContent:'',classList:{contains:()=>kind==='weapons'},
  click(){clicks++;}
}));
const legacyCards=[['weapons','Vũ khí'],['attachments','Phụ kiện'],
  ['vehicles','Phương tiện'],['maps','Bản đồ']].map(([kind,title])=>{
  const number={textContent:''};
  return {kind,number,querySelector(key){
    if(key==='span')return {textContent:title};
    if(key==='b')return number;
    return null;
  }};
});
runInNewContext(v147,{DATA:legacyData,setTimeout(){},
  document:{
    getElementById(){return null;},
    querySelectorAll(key){
      if(key==='.tabs .tab[data-tab]')return legacyTabs;
      if(key==='.overview-card')return legacyCards;
      return [];
    }
  }
},{timeout:1500});
assert.equal(legacyData.weapons.length,61,'v147 did not add five weapons');
assert.equal(legacyData.attachments.length,51,'v145 expected attachments missing');
assert.equal(clicks,1,'Legacy Wiki list was not re-rendered exactly once');
assert.equal(legacyTabs[0].textContent,'Vũ khí · 61');
assert.equal(legacyTabs[1].textContent,'Phụ kiện · 51');
for(const card of legacyCards)assert.equal(card.number.textContent,String(counts[card.kind]));

console.log('PASS F.3 Preview Wiki 61/51/26/8 and ordered v145-v149 scripts');
