// Integrate the operational Visitor AI into the six approved TrainingBot pages.
// Navigation + a small persistent launcher only: no model, auth or admin secrets
// in the Production client. /ai opens the existing isolated chat as top-level
// navigation, since its Strict HttpOnly session cookies do not work in an iframe.
import fs from "node:fs";
import path from "node:path";

const ROOT=path.resolve("public");
const PAGES=["index.html","ban-cap-nhat.html","news.html","wiki.html","community.html","contact.html"];
const TARGET="/ai";
const DESKTOP='<a class="nav-link tb-ai-nav-link" href="'+TARGET+'" target="_blank" rel="noopener noreferrer" aria-label="Mở Trợ lý TrainingBot AI (tab mới)"><span class="tb-ai-spark" aria-hidden="true">✦</span>Trợ lý AI<span class="tb-ai-mini-beta">Beta</span></a>';
const MOBILE='<a class="tb-ai-nav-link" href="'+TARGET+'" target="_blank" rel="noopener noreferrer" aria-label="Mở Trợ lý TrainingBot AI (tab mới)"><span class="tb-ai-spark" aria-hidden="true">✦</span>Trợ lý AI <small>Beta</small></a>';
const FLOAT='<a class="tb-ai-floating" href="'+TARGET+'" target="_blank" rel="noopener noreferrer" aria-label="Trò chuyện với TrainingBot AI (đang thử nghiệm, mở tab mới)"><span class="tb-ai-orb" aria-hidden="true">✦</span><span class="tb-ai-label">Trợ lý AI</span><span class="tb-ai-state">Beta</span></a>';
const CSS='<link rel="stylesheet" href="/visitor-ai-entry-v1.css?v=1">';

function afterWiki(nav,link,page){
 const wiki=nav.match(/<a\b[^>]*\bhref=["']\/wiki["'][^>]*>[\s\S]*?<\/a>/i);
 if(!wiki)throw Error("AI-ENTRY: missing Wiki link on "+page);
 return nav.replace(wiki[0],wiki[0]+"\n"+link);
}
export function attachAI(html,page){
 if(!/\btb-community-header-unified\b/.test(html))throw Error("AI-ENTRY: unified header missing "+page);
 if(html.includes("tb-ai-floating")||html.includes("visitor-ai-entry-v1.css"))throw Error("AI-ENTRY: duplicate "+page);
 if(!html.includes("</head>")||!html.includes("</body>"))throw Error("AI-ENTRY: malformed "+page);
 const headerRe=/<header\b[^>]*>[\s\S]*?<\/header>/i;
 const header=html.match(headerRe)?.[0];
 if(!header)throw Error("AI-ENTRY: main header missing "+page);
 const desktopRe=/<nav\b[^>]*class=["']desktop-nav["'][^>]*>[\s\S]*?<\/nav>/i;
 const mobileRe=/<nav\b[^>]*class=["']mobile-nav["'][^>]*>[\s\S]*?<\/nav>/i;
 const desktop=header.match(desktopRe)?.[0],mobile=header.match(mobileRe)?.[0];
 if(!desktop||!mobile)throw Error("AI-ENTRY: desktop/mobile nav missing "+page);
 let updated=header.replace(desktop,afterWiki(desktop,DESKTOP,page));
 updated=updated.replace(mobile,afterWiki(mobile,MOBILE,page));
 html=html.replace(headerRe,updated);
 html=html.replace("</head>",CSS+"\n</head>");
 html=html.replace("</body>",FLOAT+"\n</body>");
 if((html.match(/class="tb-ai-floating"/g)||[]).length!==1
   ||(html.match(/href="\/ai"/g)||[]).length!==3)
   throw Error("AI-ENTRY: expected desktop/mobile/floating launch links "+page);
 return html;
}
for(const page of PAGES){
 const file=path.join(ROOT,page);
 const original=fs.readFileSync(file,"utf8");
 const updated=attachAI(original,page);
 fs.writeFileSync(file,updated);
 console.log("AI-ENTRY:",page,"desktop, mobile, floating");
}
