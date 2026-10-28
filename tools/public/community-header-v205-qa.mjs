// Header v205 — compare six public page header geometries against Community
// screenshot source, on REAL generated HTML, without any real backend writes.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const base="http://127.0.0.1:18996";
const pages=[
 ["/","/"],
 ["/ban-cap-nhat.html","/ban-cap-nhat"],
 ["/news.html","/news"],
 ["/wiki.html","/wiki"],
 ["/community.html","/community"],
 ["/contact.html","/contact"]
];
for(const [path,active] of pages){
 const file=path==="/"?"/index.html":path;
 const html=fs.readFileSync("public"+file,"utf8");
 assert(html.includes("tb-community-header-v205.css"),file+" missing shared CSS");
 assert(html.includes("tb-community-header-unified"),file+" missing body scope");
 assert(html.includes('href="'+active+'"'),file+" missing active route");
 const inside=(html.match(/<header\b[^>]*>[\s\S]*?<\/header>/gi)||[]);
 assert.equal(inside.length,1,file+" multiple headers");
 const links=(inside[0].match(/class="nav-link(?: active)?"/g)||[]).length;
 assert.equal(links,6,file+" not six desktop nav links");
 assert.equal((inside[0].match(/aria-current="page"/g)||[]).length,1,file+" must have one active nav link");
}
assert(!fs.readFileSync("public/updates.html","utf8").includes("navigation_home_match_v149a.css"));
const server=spawn("python3",["-m","http.server","18996","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
try{
 await sleep(750);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [1705,1440,768,390]){
  const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:"reduce"});
  const records=[],errors=[],external=[],apiWrites=[];
  await ctx.route("**/*",route=>{
   const r=route.request(),u=new URL(r.url());
   if(u.pathname.startsWith("/api/")){
    if(r.method()!=="GET")apiWrites.push([u.pathname,r.method()]);
    return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,versions:[],counts:{},posts:[],users:[],online:0,messages:[]})});
   }
   if(u.origin===base)return route.continue();
   external.push(u.href);return route.abort();
  });
  try{
   for(const [url,active] of pages){
    const p=await ctx.newPage();
    p.on("pageerror",e=>errors.push({url,message:e.message}));
    await p.goto(base+url,{waitUntil:"domcontentloaded",timeout:22000});
    await p.waitForFunction(()=>document.querySelector("header.site-header .desktop-nav .nav-link.active")&&[...document.styleSheets].some(s=>s.href?.includes("tb-community-header-v205.css")),undefined,{timeout:12000});
    await p.waitForTimeout(200);
    const result=await p.evaluate(()=>{
      const get=s=>document.querySelector(s);
      const box=node=>{if(!node)return null;const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
      const h=get("header.site-header");
      return {
       active:get("header.site-header .desktop-nav .nav-link.active")?.getAttribute("href"),
       brand:box(get("header.site-header .brand")),
       logo:box(get("header.site-header .brand-logo")),
       nav:box(get("header.site-header .desktop-nav")),
       links:[...document.querySelectorAll("header.site-header .desktop-nav .nav-link")].map(x=>({href:x.getAttribute("href"),box:box(x)})),
       search:box(get("header.site-header .header-actions .icon-button")),
       header:box(h),
       menu:box(get("header.site-header .menu-button")),
       mobile:box(get("header.site-header .mobile-nav")),
       css:getComputedStyle(h).backgroundColor,
       pageWidth:document.documentElement.scrollWidth
      };
    });
    assert.equal(result.active,active,"Wrong active page "+url);
    assert.equal(result.links.length,6,"Main nav count "+url);
    assert(result.brand&&result.nav&&result.search&&result.header,"Header structure missing "+url);
    if(width>900){
      assert(result.nav.w>430&&result.nav.w<610,"Nav not Community pill "+url+" "+JSON.stringify(result.nav));
      assert(result.search.w>=35,"Search not visible "+url);
      assert(result.header.h>=68&&result.header.h<=73,"Header height "+url);
    }else{
      assert(result.nav.w===0||result.nav.h===0,"Desktop menu visible on mobile "+url);
      assert(result.search.w>=35,"Mobile search not visible "+url);
    }
    if(result.pageWidth>width+8)throw Error(url+" horizontal overflow "+JSON.stringify(result));
    records.push({url,...result});
    if(width===1705||width===390){
      fs.mkdirSync("header-qa-screenshots",{recursive:true});
      await p.screenshot({path:"header-qa-screenshots/header-"+(url==="/"? "home":url.replace(/[/.]/g,"-"))+"-"+width+".png",animations:"disabled"});
    }
    if(url==="/community.html"||url==="/news.html"){
      if(width>900){
       await p.locator('header.site-header .icon-button').click();
       await p.waitForFunction(()=>!!document.querySelector(".tb-search-overlay:not([hidden])"),undefined,{timeout:7000});
      }
    }
    if(url==="/wiki.html"){
      assert.equal(await p.locator("#focusSearch").count(),1,"Wiki's original search action was lost");
    }
    await p.close();
   }
   // Reference is the original Community document under the SAME CSS system.
   const reference=records.find(x=>x.url==="/community.html");
   const metrics=["brand","logo","nav","search","header"];
   for(const record of records){
    for(const metric of metrics){
     const a=record[metric],b=reference[metric];
     for(const key of ["x","y","w","h"]){
      const tolerance=key==="w"?1.5:1;
      assert(Math.abs(a[key]-b[key])<=tolerance,
        width+"px "+record.url+" "+metric+"."+key+" differs from /community: "+a[key]+" vs "+b[key]);
     }
    }
    for(let i=0;i<6;i++){
     const a=record.links[i].box,b=reference.links[i].box;
     for(const key of ["x","y","w","h"]){
      assert(Math.abs(a[key]-b[key])<=1.5,width+"px "+record.url+" nav item "+i+" "+key+" does not match Community");
     }
    }
   }
   assert(apiWrites.every(([path,method])=>path==="/api/visitor-events"&&method==="POST"),"Unexpected API write: "+JSON.stringify(apiWrites));
   assert.deepEqual(errors,[],"JS errors in header QA: "+JSON.stringify(errors));
   console.log("HEADER MATCH "+width+"px PASS — homepage/updates/news/wiki/community/contact identical header geometry");
  }finally{await ctx.close();}
 }
}finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
}
