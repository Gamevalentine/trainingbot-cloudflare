// SEO hygiene: stop linking to legacy /updates (noindex) from public HTML.
// Keep the old route functional for existing external users; only internal hrefs change.
import fs from "node:fs";
import path from "node:path";
let filesChanged=0,linksChanged=0;
function visit(dir){
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,item.name);
  if(item.isDirectory()){visit(file);continue}
  if(!item.isFile()||!item.name.endsWith(".html"))continue;
  const current=fs.readFileSync(file,"utf8");
  let count=0;
  const next=current.replace(/\bhref=(["'])\/updates\/?\1/g,(_,quote)=>{count++;return "href="+quote+"/ban-cap-nhat"+quote});
  if(next!==current){fs.writeFileSync(file,next);filesChanged++;linksChanged+=count}
 }
}
visit("public");
console.log("SEO legacy internal links normalized: "+linksChanged+" links across "+filesChanged+" HTML files");
