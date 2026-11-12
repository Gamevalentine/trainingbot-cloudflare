// Public welcome modal: static homepage, Wiki, Beta, news, community, contact,
// and standalone news articles. Excludes Admin, chat iframe, account & legal.
import fs from "node:fs";
import path from "node:path";
const dir=path.resolve("public");
const core=new Set(["index.html","ban-cap-nhat.html","updates.html",
  "news.html","wiki.html","community.html","contact.html","tim-dong-doi.html"]);
const eligible=name=>core.has(name)||/^news-[a-z0-9-]+\.html$/.test(name);
const css='<link rel="stylesheet" href="/community-invite-v1.css?v=1">';
const js='<script defer src="/community-invite-v1.js?v=1"></script>';
let count=0;
for(const name of fs.readdirSync(dir)){
  if(!eligible(name))continue;
  const file=path.join(dir,name);
  if(!fs.statSync(file).isFile())continue;
  let html=fs.readFileSync(file,"utf8");
  if(!/<\/head>/i.test(html)||!/<\/body>/i.test(html))
    throw Error("COMMUNITY-INVITE: malformed public HTML "+name);
  if(html.includes("community-invite-v1.css")||html.includes("community-invite-v1.js"))
    throw Error("COMMUNITY-INVITE: duplicate scripts "+name);
  html=html.replace(/<\/head>/i,css+"\n</head>");
  const where=html.toLowerCase().lastIndexOf("</body>");
  html=html.slice(0,where)+js+"\n"+html.slice(where);
  fs.writeFileSync(file,html);
  count++;
}
for(const name of ["index.html","ban-cap-nhat.html","news.html",
                   "wiki.html","community.html","contact.html"]){
  const html=fs.readFileSync(path.join(dir,name),"utf8");
  if(!html.includes(css)||!html.includes(js))
    throw Error("COMMUNITY-INVITE: missing main page "+name);
}
if(count<6)throw Error("COMMUNITY-INVITE: insufficient public pages");
console.log("COMMUNITY-INVITE: installed on "+count+" public HTML pages");
