// H.1 SEO for one canonical Wiki collection route; ?guide= is client-side state.
import fs from "node:fs";
const p="public/wiki.html",guides=JSON.parse(fs.readFileSync("public/wiki-stage-f-guides.json","utf8"));
let h=fs.readFileSync(p,"utf8");
if(guides.schemaVersion!=="wiki-f1"||guides.guides.length!==16)throw Error("Guide catalog mismatch");
const canonical="https://trainingbot.io.vn/wiki";
const canon=[...h.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/gi)];
if(canon.length!==1||!canon[0][0].includes('href="'+canonical+'"'))throw Error("Expected one existing /wiki canonical");
if(!/<meta\b[^>]*name="description"/i.test(h))throw Error("Wiki description missing");
if(h.includes('id="tbWikiHJsonLd"'))throw Error("H metadata duplicated");
const title="Wiki PUBG MOBILE: vũ khí, phụ kiện, bản đồ và cẩm nang | TrainingBot";
const desc="Tra cứu Wiki PUBG MOBILE bằng tiếng Việt: 61 vũ khí, 51 phụ kiện, 26 phương tiện, 8 bản đồ và 16 bài luyện tập. Có nhãn nguồn, phiên bản và giới hạn xác minh.";
h=h.replace(/<title>[^<]*<\/title>/i,"<title>"+title+"</title>");
h=h.replace(/(<meta\b[^>]*name="description"[^>]*content=")[^"]*(")/i,(_,a,b)=>a+desc+b);
const meta={"og:type":"website","og:title":title,"og:description":desc,"og:url":canonical,"twitter:card":"summary","twitter:title":title,"twitter:description":desc};
let inject="";
for(const [name,value] of Object.entries(meta)){
 const attr=name.startsWith("og:")?"property":"name";
 const existing=new RegExp('<meta\\s+[^>]*'+attr+'="'+name+'"[^>]*>','i');
 if(existing.test(h))h=h.replace(existing,tag=>tag.replace(/content="[^"]*"/i,'content="'+value+'"'));
 else inject+='<meta '+attr+'="'+name+'" content="'+value+'">\n';
}
const schema={"@context":"https://schema.org","@type":"CollectionPage","name":title,"description":desc,"inLanguage":"vi-VN","url":canonical,
"isPartOf":{"@type":"WebSite","name":"TrainingBot","url":"https://trainingbot.io.vn/"},
"mainEntity":{"@type":"ItemList","numberOfItems":guides.guides.length,
"itemListElement":guides.guides.map((g,i)=>({"@type":"ListItem","position":i+1,"name":g.title,"url":canonical+"?guide="+encodeURIComponent(g.id)}))}};
inject+='<script id="tbWikiHJsonLd" type="application/ld+json">'+JSON.stringify(schema).replace(/</g,"\\u003c")+'</script>\n';
// Prevent visible layout jumps while layered legacy Wiki rewrites the grid.
// A visible loading label replaces the unstable main content; hard fallback avoids blank pages on errors.
inject+='<script id="tbHJSFlag">document.documentElement.classList.add("tb-h-js")</script>\\n';
inject+='<style id="tbHLayoutStability">'+
'html.tb-h-js body:not(.tb-h-layout-ready):not(.tb-h-reveal-fallback) main{visibility:hidden}'+
'html.tb-h-js body:not(.tb-h-layout-ready):not(.tb-h-reveal-fallback)::after{content:"Đang chuẩn bị Wiki…";position:fixed;top:96px;left:0;right:0;text-align:center;z-index:5;color:#c0d8ed;font:600 13px/1.4 system-ui;pointer-events:none}'+
'</style>\\n';
inject+='<script id="tbHRevealFallback">setTimeout(function(){document.body?.classList.add("tb-h-reveal-fallback")},3200)</script>\\n';
h=h.replace("</head>",inject+"</head>");
fs.writeFileSync(p,h);
fs.mkdirSync("wiki-stage-h-artifacts",{recursive:true});
fs.writeFileSync("wiki-stage-h-artifacts/seo-build.json",JSON.stringify({stage:"H.1",canonical,guideCount:guides.guides.length,uniqueSeoPages:1,warning:"?guide= state shares the /wiki canonical; individual guides are not standalone indexable HTML."},null,2));
console.log("WIKI H.1 SEO: 1 canonical collection, 16 item entries; not claiming indexable guide pages");
