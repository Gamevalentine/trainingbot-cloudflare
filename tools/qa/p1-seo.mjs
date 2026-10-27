
import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(path,"utf8");
const mustExist=[
"public/index.html","public/wiki.html","public/news.html","public/contact.html","public/ban-cap-nhat.html",
"public/community.html","public/robots.txt","public/sitemap.xml","public/search-index-v152.json",
"public/wiki_compare_p1.js","public/wiki_compare_p1.css"
];
for(const name of mustExist)assert(fs.existsSync(name),name+" is missing");
const routes=["/","/wiki","/news","/contact","/community","/ban-cap-nhat"];
const routeToFile=r=>r==="/"? "public/index.html":"public/"+r.slice(1)+".html";
for(const route of routes){
 const content=read(routeToFile(route));
 assert(content.includes('<link rel="canonical"'),"Canonical missing: "+route);
 const expected="https://trainingbot.io.vn"+(route==="/"?"/":route);
 assert(content.includes('href="'+expected+'"'),"Canonical mismatch: "+route);
 assert(content.includes('name="description"'),"Missing description: "+route);
}
const robots=read("public/robots.txt");
assert(robots.includes("Sitemap: https://trainingbot.io.vn/sitemap.xml"));
assert(robots.includes("Sitemap: https://trainingbot.io.vn/sitemap-posts.xml"));
const staticSitemap=read("public/sitemap.xml");
assert(staticSitemap.includes("<urlset")&&staticSitemap.includes("</urlset>"));
const locs=[...staticSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.equal(new Set(locs).size,locs.length,"Duplicate sitemap locations");
for(const loc of locs){
 const url=new URL(loc);
 assert.equal(url.origin,"https://trainingbot.io.vn","Unexpected sitemap host "+loc);
 if(url.pathname.startsWith("/bai-viet/"))continue;
 // Verify only canonical static pages; exclude legacy redirects.
 const candidate=routeToFile(url.pathname);
 if(!fs.existsSync(candidate) && !fs.existsSync("public/"+url.pathname.replace(/^\//,"")))throw Error("Missing sitemap page "+url.pathname);
}
const index=JSON.parse(read("public/search-index-v152.json"));
assert(Array.isArray(index)&&index.length>3);
console.log("P1 static SEO: canonical, description, XML sitemap, route targets, search-index PASS");
