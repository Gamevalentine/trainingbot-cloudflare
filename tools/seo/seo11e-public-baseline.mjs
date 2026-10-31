// SEO-11.E: baseline of PUBLIC crawlability, not a Google Search Console report.
// Read-only HTTP requests: robots.txt, 2 sitemaps, their public pages.
// Search Console metrics and Google's actual indexing decision require authorized GSC data.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const ORIGIN='https://trainingbot.io.vn';
const priority=['/','/wiki','/ban-cap-nhat'];
const targets=['/robots.txt','/sitemap.xml','/sitemap-posts.xml'];
const timeout=20000;

async function get(url) {
 try {
  const res=await fetch(url,{
   method:'GET',
   signal:AbortSignal.timeout(timeout),
   headers:{'user-agent':'TrainingBot-SEO11E-ReadOnly-Audit/1.0'}
  });
  return {
   url,finalUrl:res.url,status:res.status,ok:res.ok,
   contentType:res.headers.get('content-type')||'',
   xRobotsTag:res.headers.get('x-robots-tag')||'',
   text:await res.text()
  };
 } catch(err) {
  return {url,status:null,ok:false,error:String(err?.message||err),text:'',xRobotsTag:''};
 }
}
const initial=await Promise.all(targets.map(p=>get(ORIGIN+p)));
for(const x of initial) assert(x.ok,x.url+' HTTP '+(x.status||x.error));
const byPath=Object.fromEntries(initial.map(x=>[new URL(x.url).pathname,x]));
const robots=byPath['/robots.txt'].text;
assert(robots.includes('Sitemap: '+ORIGIN+'/sitemap.xml'));
assert(robots.includes('Sitemap: '+ORIGIN+'/sitemap-posts.xml'));
const locs=(xml)=>[...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(m=>m[1].trim().replace(/&amp;/g,'&'));
const staticUrls=locs(byPath['/sitemap.xml'].text);
const articleUrls=locs(byPath['/sitemap-posts.xml'].text);
assert(staticUrls.length>=20,'Unexpectedly short static sitemap: '+staticUrls.length);
assert(articleUrls.length>=5,'Unexpectedly short article sitemap: '+articleUrls.length);
for(const list of [staticUrls,articleUrls]){
 assert.equal(list.length,new Set(list).size,'Duplicate sitemap URL');
 for(const u of list)assert(new URL(u).origin===ORIGIN,'External URL in sitemap: '+u);
}
for(const p of priority)assert(staticUrls.includes(ORIGIN+p),'Priority page absent from static sitemap: '+p);
const urls=[...new Set([...staticUrls,...articleUrls])];
const pages=[];
for(let i=0;i<urls.length;i+=4){
 const batch=await Promise.all(urls.slice(i,i+4).map(get));
 pages.push(...batch.map(x=>{
  const head=x.text.split(/<\/head>/i)[0]||'';
  const canTag=head.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i)?.[0]||
      head.match(/<link\b[^>]*\bhref=["'][^"']+["'][^>]*\brel=["']canonical["'][^>]*>/i)?.[0]||'';
  const canonical=canTag.match(/\bhref=["']([^"']+)/i)?.[1]||null;
  const robotsTag=head.match(/<meta\b[^>]*\bname=["']robots["'][^>]*>/i)?.[0]||'';
  const robotsDirective=robotsTag.match(/\bcontent=["']([^"']*)/i)?.[1]||null;
  const title=head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()||null;
  const descTag=head.match(/<meta\b[^>]*\bname=["']description["'][^>]*>/i)?.[0]||'';
  const description=descTag.match(/\bcontent=["']([^"']*)/i)?.[1]||null;
  const noindex=/\bnoindex\b/i.test((robotsDirective||'')+' '+x.xRobotsTag);
  return {
   url:x.url,status:x.status,finalUrl:x.finalUrl||null,
   canonical,title,description,
   robotsDirective,xRobotsTag:x.xRobotsTag,
   noindex,h1Count:(x.text.match(/<h1\b/gi)||[]).length,
   error:x.error||null
  };
 }));
}
const priorityUrls=[...priority.map(p=>ORIGIN+p),...articleUrls];
const fatal=[];
for(const u of priorityUrls){
 const p=pages.find(x=>x.url===u);
 if(!p||p.status!==200)fatal.push({url:u,reason:'Priority URL not HTTP 200'});
 if(p?.canonical!==u)fatal.push({url:u,reason:'Declared canonical differs: '+String(p?.canonical)});
 if(p?.noindex)fatal.push({url:u,reason:'Priority URL has noindex'});
}
const non200=pages.filter(x=>x.status!==200);
const mismatchedCanonical=pages.filter(x=>x.canonical!==x.url);
const noindex=pages.filter(x=>x.noindex);
const checkedAt=new Date().toISOString();
const report={
 schemaVersion:'seo11e-public-baseline-v1',
 checkedAt,
 origin:ORIGIN,
 methodology:'Public HTTP GET, HTML source and sitemaps; no Search Console connection, no writes',
 note:'This does not prove Google indexed any URL or reveal Search Console clicks/impressions/CTR/rank.',
 staticSitemapUrlCount:staticUrls.length,
 articleSitemapUrlCount:articleUrls.length,
 uniqueSitemapUrlCount:urls.length,
 pages200:pages.filter(x=>x.status===200).length,
 missingOrError:non200.map(x=>({url:x.url,status:x.status,error:x.error})),
 canonicalMismatch:mismatchedCanonical.map(x=>({url:x.url,canonical:x.canonical})),
 noindexSitemapUrls:noindex.map(x=>x.url),
 priorityChecks:priorityUrls,
 robotsSitemapReferences:[ORIGIN+'/sitemap.xml',ORIGIN+'/sitemap-posts.xml'],
 pages,
 searchConsole:{
  connected:false,
  dataStatus:'unavailable_subscription_required_in_existing_connector',
  clicks:null,impressions:null,ctrPercent:null,averagePosition:null,
  indexedUrls:null,notIndexedUrls:null,
  latestSettledGscDate:null,
  note:'No authenticated GSC data was read. Null means unknown, never zero.'
 },
 fatal
};
fs.mkdirSync('seo11e-artifacts',{recursive:true});
fs.writeFileSync('seo11e-artifacts/public-baseline.json',JSON.stringify(report,null,2)+'\n');
console.log('SEO11E_PUBLIC_BASELINE',JSON.stringify({
 checkedAt,staticUrls:staticUrls.length,articles:articleUrls.length,
 checked:pages.length,ok200:report.pages200,
 canonicalIssues:mismatchedCanonical.length,noindexInSitemaps:noindex.length,
 fatal,failing:non200.map(p=>p.url)
}));
if(fatal.length)throw Error('SEO-11.E priority technical checks failed; see report artifact');
console.log('SEO11E_TECHNICAL_PASS (not Google Indexing PASS; GSC metrics unavailable)');
