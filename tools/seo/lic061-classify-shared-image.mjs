// LIC-06.1: classify all generated HTML references to a legacy share image.
// Run after npm run build; read-only, no private APIs, D1 or R2 calls.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const needle="news-pubg-mobile-4-6-cover.webp";
const root="public";
const walk=folder=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(x=>{
 const f=path.join(folder,x.name);return x.isDirectory()?walk(f):[f];
});
const attribute=(tag,key)=>{
 const m=tag.match(new RegExp("(?:^|\\s)"+key+"\\s*=\\s*([\"'])(.*?)\\1","i"));
 return m?m[2]:"";
};
function classify(text,pos,file){
 if(!file.endsWith(".html"))return "non_html_reference";
 const before=text.slice(0,pos);
 const open=before.lastIndexOf("<"),closed=before.lastIndexOf(">");
 if(open>closed){
  const end=text.indexOf(">",open);
  if(end>=pos){
   const tag=text.slice(open,end+1),name=(tag.match(/^<\s*([\w:-]+)/)||[])[1]?.toLowerCase()||"unknown";
   if(name==="meta"){
    if(attribute(tag,"property")==="og:image")return "opengraph_image";
    if(attribute(tag,"name")==="twitter:image")return "twitter_image";
    return "other_meta";
   }
   if(["img","picture","source"].includes(name))return "displayed_image";
   if(name==="a")return "link_reference";
   if(name==="link")return "linked_resource";
   return "other_html_attribute";
  }
 }
 const scriptStart=before.toLowerCase().lastIndexOf("<script");
 const scriptEnd=before.toLowerCase().lastIndexOf("</script");
 if(scriptStart>scriptEnd){
  const tag=text.slice(scriptStart,text.indexOf(">",scriptStart)+1);
  if(attribute(tag,"type")==="application/ld+json"){
   const end=text.toLowerCase().indexOf("</script",pos);
   let valid=false;
   try{valid=Boolean(JSON.parse(text.slice(text.indexOf(">",scriptStart)+1,end)))}catch{}
   return valid?"structured_data_image":"invalid_jsonld";
  }
  return "inline_script_reference";
 }
 const styleStart=before.toLowerCase().lastIndexOf("<style");
 const styleEnd=before.toLowerCase().lastIndexOf("</style");
 if(styleStart>styleEnd)return "inline_css_reference";
 return "unclassified_html_text";
}
function pageGroup(f){
 if(f.startsWith("mobile/")||f.startsWith("mobile_recovered_v79/"))return "legacy_mobile";
 if(f.startsWith("wiki_recovered/"))return "legacy_recovered_wiki";
 if(f==="account.html")return "account";
 if(f==="updates.html")return "duplicate_beta_alias";
 if(["index.html","wiki.html","news.html","ban-cap-nhat.html","community.html","contact.html"].includes(f))return "main_navigation";
 if(f.startsWith("admin"))return "admin";
 return "other_public";
}
const build=fs.readFileSync("build.sh","utf8");
assert(/const\s+defaultShareImage\s*=\s*origin\s*\+\s*['"]\/news-pubg-mobile-4-6-cover\.webp['"]/i.test(build),
 "The default share image source changed; cannot infer build pipeline origin");
const candidates=walk(root).filter(f=>/\.(?:html|css|js|json|svg|xml|txt)$/i.test(f)&&fs.statSync(f).size<=3*1024*1024);
const files=[];
for(const absolute of candidates){
 const html=fs.readFileSync(absolute,"utf8");
 if(!html.includes(needle))continue;
 const rel=path.relative(root,absolute).split(path.sep).join("/");
 const references=[];
 let pos=0;
 while((pos=html.indexOf(needle,pos))>=0){
  references.push({line:html.slice(0,pos).split("\n").length,role:classify(html,pos,rel),
    snippet:html.slice(Math.max(0,pos-92),Math.min(html.length,pos+needle.length+75)).replace(/\s+/g," ").slice(0,220)});
  pos+=needle.length;
 }
 const robotsTag=(html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i)||[])[0]||"";
 const canonicalTag=(html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)||[])[0]||"";
 const group=pageGroup(rel);
 const robots=attribute(robotsTag,"content")||null;
 files.push({path:rel,group,robots,canonical:attribute(canonicalTag,"href")||null,
  noindex:Boolean(robots&&/\bnoindex\b/i.test(robots)),
  referenceCount:references.length,
  roles:[...new Set(references.map(x=>x.role))].sort(),
  references});
}
files.sort((a,b)=>a.path.localeCompare(b.path,"en"));
const counts=Object.fromEntries([...new Set(files.flatMap(f=>f.references.map(r=>r.role)))].sort().map(k=>
 [k,files.reduce((n,f)=>n+f.references.filter(r=>r.role===k).length,0)]));
const cohorts=Object.fromEntries([...new Set(files.map(f=>f.group))].sort().map(g=>[g,files.filter(f=>f.group===g).length]));
const safe=new Set(["opengraph_image","twitter_image","structured_data_image"]);
const risky=files.filter(f=>f.references.some(r=>!safe.has(r.role)));
const report={checkedAt:new Date().toISOString(),stage:"LIC-06.1",sourceOfReference:"build.sh:defaultShareImage",
 filesScanned:candidates.length,baselineFileCount:35,filesWithReference:files.length,
 deltaFromBaseline:files.length-35,
 referenceOccurrences:files.reduce((n,f)=>n+f.referenceCount,0),
 byRole:counts,byGroup:cohorts,
 safeMetadataOnly:risky.length===0,
 riskFiles:risky.map(f=>({path:f.path,roles:f.roles})),files,
 rightsStatus:"unverified",safety:"No D1 or R2 data changed"};
fs.mkdirSync("lic061-audit-artifacts",{recursive:true});
fs.writeFileSync("lic061-audit-artifacts/classification.json",JSON.stringify(report,null,2));
const lines=[
 "# LIC-06.1 — Phân loại 35 tệp tham chiếu ảnh chia sẻ cũ",
 "",
 "Nguồn thực thi: npm run build (CF_PAGES_BRANCH=main), sau đó kiểm tra các tệp public được tạo ra. Không ghi D1/R2.",
 "",
 "- Tệp tham chiếu: "+files.length+" (mốc cũ 35; chênh "+report.deltaFromBaseline+")",
 "- Tổng lần xuất hiện: "+report.referenceOccurrences,
 "- Kiểu tham chiếu: "+Object.entries(counts).map(x=>x.join("=")).join(", "),
 "- Nhóm trang: "+Object.entries(cohorts).map(x=>x.join("=")).join(", "),
 "- Số tệp chứa tham chiếu ngoài SEO metadata/JSON-LD: "+risky.length,
 "- Chỉ thay cấu hình SEO dùng chung được không: "+(report.safeMetadataOnly?"CÓ, nếu ảnh mới có quyền rõ ràng và QA đầy đủ":"CHƯA, cần rà từng tham chiếu khác metadata"),
 "",
 "| Tệp | Nhóm | Robots | Vai trò | Số lần |",
 "|---|---|---|---|---:|"
];
for(const f of files)lines.push("| "+f.path+" | "+f.group+" | "+(f.robots||"không rõ")+" | "+f.roles.join(", ")+" | "+f.referenceCount+" |");
lines.push("","## LIC-06.2","Chỉ khi mọi vị trí được phân loại và có bản ảnh branded gốc đủ quyền, thay tại nguồn tạo SEO metadata trong build.sh, giữ canonical/title/robots/JSON-LD, kiểm thử Wiki, SEO, Pages và mạng xã hội. Không sửa dữ liệu D1 hoặc xóa tệp ảnh gốc.","");
fs.writeFileSync("lic061-audit-artifacts/classification.md",lines.join("\n"));
console.log("LIC061_RESULTS",JSON.stringify({
 filesWithReference:files.length,referenceOccurrences:report.referenceOccurrences,
 byRole:counts,byGroup:cohorts,riskFiles:report.riskFiles,safeMetadataOnly:report.safeMetadataOnly
}));
console.log("LIC061_PER_FILE",JSON.stringify(files.map(f=>({path:f.path,group:f.group,robots:f.robots,roles:f.references.map(r=>r.role)}))));
assert(files.length>0,"No references found; please investigate changed build");
console.log("LIC061_AUDIT_COMPLETE_READ_ONLY");
