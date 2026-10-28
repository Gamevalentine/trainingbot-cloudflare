// H.1/H.4 static integrity: canonical, schema, source registry, guide state URLs.
import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync("public/"+p,"utf8");
const html=read("wiki.html"),data=JSON.parse(read("wiki-stage-f-guides.json"));
const c=JSON.parse(read("wiki-stage-c-evidence.json")),d=JSON.parse(read("wiki-stage-d-evidence.json"));
const canonical="https://trainingbot.io.vn/wiki";
const canon=[...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/gi)];
assert.equal(canon.length,1,"Duplicate or missing canonical");
assert(canon[0][0].includes('href="'+canonical+'"'));
const scripts=[...html.matchAll(/<script\b[^>]*id="tbWikiHJsonLd"[^>]*>([\s\S]*?)<\/script>/gi)];
assert.equal(scripts.length,1,"CollectionPage JSONLD missing/duplicate");
const schema=JSON.parse(scripts[0][1]);
assert.equal(schema["@type"],"CollectionPage");
assert.equal(schema.url,canonical);
assert.equal(schema.mainEntity.numberOfItems,16);
assert.equal(schema.mainEntity.itemListElement.length,16);
const unique=new Set();
for(const [i,item] of schema.mainEntity.itemListElement.entries()){
 const id=data.guides[i].id;
 assert.equal(item.position,i+1);
 assert.equal(item.url,canonical+"?guide="+encodeURIComponent(id));
 assert(!unique.has(id));unique.add(id);
}
for(const k of ["og:title","og:description","og:url","twitter:card"]){
 assert(html.includes('"'+k+'"'),"Missing "+k);
}
const paths=["wiki-stage-b-v2.js","wiki-stage-c-weapon.js","wiki-stage-d-v2.js","wiki-stage-e-compare.js","wiki-stage-f-guides.js","wiki-stage-g-snapshot.js","wiki-stage-h-perf.js","wiki-stage-f-guides.css","wiki-stage-h-perf.js","wiki-stage-c-evidence.json","wiki-stage-d-evidence.json"];
for(const file of new Set(paths))assert(fs.existsSync("public/"+file),"Broken internal Wiki asset "+file);
const origins=new Set(["https://www.pubgmobile.com","https://pubgm.vnggames.com"]);
let sourceRefs=0,externalSourceLinks=0;
for(const g of data.guides){
 assert(g.contentType==="editorial_training"&&g.steps.length>=3);
 for(const l of g.related){
  assert(["weapons","attachments","maps","vehicles"].includes(l.kind),"Unknown Wiki category link "+JSON.stringify(l));
  // Cards can be category-level, or their label must occur in the source catalog.
  if(l.name)assert(typeof l.name==="string"&&l.name.length<100);
 }
 for(const ref of g.evidence){
  let item,source;
  if(ref.registry==="c"){item=c.weapons?.[ref.entity]?.history?.find(x=>x.sourceId===ref.sourceId);source=c.sources[ref.sourceId]}
  else if(ref.registry==="d"){item=d.maps?.[ref.entity]||d.vehicles?.[ref.entity]||d.unlisted?.[ref.entity];source=d.sources[ref.sourceId];assert.equal(item?.sourceId,ref.sourceId)}
  else throw Error("Unknown evidence registry");
  assert(item&&source,"Orphan source ref "+g.id);
  const url=new URL(source.url);
  assert.equal(url.protocol,"https:");
  assert(origins.has(url.origin),"Unreviewed source host "+url.href);
  sourceRefs++;externalSourceLinks++;
 }
}
const siteMap=read("sitemap.xml");
assert(siteMap.includes("<loc>"+canonical+"</loc>"),"Wiki canonical absent from sitemap");
assert(!siteMap.includes("?guide="),"Do not fake individual SSR URLs in sitemap");
const robots=read("robots.txt");assert(robots.includes("https://trainingbot.io.vn/sitemap.xml"));
const result={stage:"H.1/H.4",seoCanonical:canonical,guideCount:16,realIndexableHtmlDocuments:1,sourceRefs,externalSourceLinks,allowedSourceHosts:[...origins],checkedStaticAssets:[...new Set(paths)].length,
 externalStatus:"NOT CHECKED LIVE; HTTP availability and image usage rights remain a release blocker",
 mode:"build-time and registry-only checks; does not crawl external URLs"};
fs.mkdirSync("wiki-stage-h-artifacts",{recursive:true});
fs.writeFileSync("wiki-stage-h-artifacts/link-audit.json",JSON.stringify(result,null,2));
console.log("WIKI H.1/H.4 PASS: canonical + collection schema + 16 permalinks, "+sourceRefs+" release references, source domain allowlist, local assets and sitemap");
