// Unify the six first-party main headers using the EXACT existing Community
// header markup as canonical source; no duplicate navigation components.
// Runs AFTER original HTML reconstruction, before Cloudflare Pages publishing.
import fs from "node:fs";
const pages = new Map([
 ["index.html","/"],
 ["ban-cap-nhat.html","/ban-cap-nhat"],
 ["updates.html","/ban-cap-nhat"],
 ["news.html","/news"],
 ["wiki.html","/wiki"],
 ["community.html","/community"],
 ["contact.html","/contact"]
]);
const root="public";
const headerPattern=/<header\b[^>]*>[\s\S]*?<\/header>/gi;
const example=fs.readFileSync(root+"/community.html","utf8");
const found=[...example.matchAll(headerPattern)];
if(found.length!==1||!found[0][0].includes("desktop-nav")||!found[0][0].includes("header-actions")){
 throw Error("Community reference header no longer has the expected layout");
}
const canonical=found[0][0];
const paths=["/","/ban-cap-nhat","/news","/wiki","/community","/contact"];
const canonLinks=[...canonical.matchAll(/<a\s+class="nav-link(?: active)?"\s+href="([^"]+)"/g)].map(m=>m[1]);
if(JSON.stringify(canonLinks)!==JSON.stringify(paths))throw Error("Community reference nav differs from six main routes");
for(const [file,route] of pages){
 const path=root+"/"+file;
 let html=fs.readFileSync(path,"utf8");
 const originalHeaders=[...html.matchAll(headerPattern)];
 if(originalHeaders.length!==1)throw Error(file+": expected one header, got "+originalHeaders.length);
 if(!/<body\b/i.test(html)||!/<\/head>/i.test(html))throw Error(file+": missing document structure");
 const countBefore=(html.match(/<nav\b/gi)||[]).length;
 let header=canonical
   .replace(/\bclass="nav-link active"/g,'class="nav-link"')
   .replace(/\s+aria-current="page"/g,"");
 // Preserve the existing Wiki search focus action and inline script binding.
 // The other five pages share the standard global search button behavior.
 if(route==="/wiki"){
  header=header.replace('aria-label="Tìm kiếm"','id="focusSearch" aria-label="Tìm kiếm Wiki"');
  if(!header.includes('id="focusSearch"'))throw Error("Wiki focusSearch missing");
 }
 const anchor='<a class="nav-link" href="'+route+'">';
 if(!header.includes(anchor))throw Error(file+": active nav destination missing");
 header=header.replace(anchor,'<a class="nav-link active" aria-current="page" href="'+route+'">');
 html=html.replace(headerPattern,header);
 html=html.replace(/<body\b([^>]*)>/i,(_,attrs)=>{
  if(/class="/i.test(attrs)){
   return "<body"+attrs.replace(/class="([^"]*)"/i,(_whole,classes)=>'class="'+classes+' tb-community-header-unified"')+">";
  }
  return '<body'+attrs+' class="tb-community-header-unified">';
 });
 const styleTag='<link rel="stylesheet" href="/tb-community-header-v205.css?v=205">';
 if(html.includes("tb-community-header-v205.css"))throw Error(file+": header CSS already injected");
 html=html.replace("</head>",styleTag+"\n</head>");
 const outLinks=[...header.matchAll(/<a\s+class="nav-link(?: active)?"(?:\s+aria-current="page")?\s+href="([^"]+)"/g)].map(m=>m[1]);
 if(JSON.stringify(outLinks)!==JSON.stringify(paths))throw Error(file+": navigation incomplete");
 if((header.match(/aria-current="page"/g)||[]).length!==1)throw Error(file+": expected one active link");
 if((html.match(headerPattern)||[]).length!==1||!html.includes("header-actions"))throw Error(file+": header damaged");
 // Guard against accidentally rewriting unrelated content outside the header.
 if(countBefore!==((html.match(/<nav\b/gi)||[]).length))throw Error(file+": total nav count unexpectedly changed");
 fs.writeFileSync(path,html);
 console.log("HEADER v205:",file,"active:",route);
}
