// TrainingBot public AI widget injection, six main pages only.
// The iframe lives on isolated AI Preview; no credential/model/Admin API is
// imported into the Production website. Plain /ai stays a fallback route.
import fs from "node:fs";
import path from "node:path";
const ROOT=path.resolve("public");
const PAGES=["index.html","ban-cap-nhat.html","news.html","wiki.html","community.html","contact.html"];
const TARGET="/ai";
const DESKTOP='<a class="nav-link tb-ai-nav-link" data-tb-ai-toggle href="/ai" aria-controls="tb-ai-popup" aria-expanded="false" aria-label="Mở trò chuyện TrainingBot AI tại trang"><span class="tb-ai-spark" aria-hidden="true">✦</span>Trợ lý AI<span class="tb-ai-mini-beta">Beta</span></a>';
const MOBILE='<a class="tb-ai-nav-link" data-tb-ai-toggle href="/ai" aria-controls="tb-ai-popup" aria-expanded="false" aria-label="Mở trò chuyện TrainingBot AI tại trang"><span class="tb-ai-spark" aria-hidden="true">✦</span>Trợ lý AI <small>Beta</small></a>';
const ROBOT='<svg class="tb-bot-drawing" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" role="img" aria-label="Robot TrainingBot AI">'
 +'<defs><linearGradient id="tbAiFace" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#776af7"/><stop offset=".6" stop-color="#352e74"/><stop offset="1" stop-color="#1e2351"/></linearGradient><linearGradient id="tbAiLight" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b2acff"/><stop offset="1" stop-color="#7becfc"/></linearGradient></defs>'
 +'<ellipse cx="40" cy="73" rx="29" ry="5" fill="#25265d" opacity=".45"/><path d="M40 9v7" stroke="#baadff" stroke-width="3" stroke-linecap="round"/><circle cx="40" cy="8" r="4" fill="#8deaff" stroke="#8880f4" stroke-width="2"/>'
 +'<path d="M21 24c-10 3-13 10-11 23m49-23c10 3 13 10 11 23" fill="none" stroke="#b5a3fe" stroke-width="6" stroke-linecap="round"/><rect x="8" y="33" width="10" height="17" rx="5" fill="#6460eb" stroke="#b4a0fc" stroke-width="2"/><rect x="62" y="33" width="10" height="17" rx="5" fill="#6460eb" stroke="#b4a0fc" stroke-width="2"/>'
 +'<rect x="18" y="16" width="44" height="47" rx="15" fill="url(#tbAiFace)" stroke="#b3a6ff" stroke-width="2.3"/><rect x="23" y="23" width="34" height="27" rx="10" fill="#101433" stroke="#8989e8" stroke-width="1.4"/>'
 +'<rect x="29" y="32" width="7" height="12" rx="3.5" fill="url(#tbAiLight)"/><rect x="44" y="32" width="7" height="12" rx="3.5" fill="url(#tbAiLight)"/><path d="M35 48q5 4 10 0" fill="none" stroke="#8aeeff" stroke-width="2.2" stroke-linecap="round"/><path d="M30 57q10 5 20 0" fill="none" stroke="#beabff" stroke-width="2" stroke-linecap="round"/>'
 +'<rect x="23" y="63" width="14" height="7" rx="3" fill="#6f64d8" stroke="#b3a4f7"/><rect x="43" y="63" width="14" height="7" rx="3" fill="#6f64d8" stroke="#b3a4f7"/></svg>';
const FLOAT='<a class="tb-ai-widget-launch" data-tb-ai-toggle href="/ai" aria-controls="tb-ai-popup" aria-expanded="false" aria-label="Mở hộp chat TrainingBot AI">'+ROBOT+'<span class="tb-bot-chip">Trợ lý AI · Beta</span></a>';
const PANEL='<section class="tb-ai-popup" id="tb-ai-popup" role="dialog" aria-label="Trò chuyện cùng TrainingBot AI" hidden>'
 +'<span class="tb-ai-loading">Đang mở TrainingBot AI…</span>'
 +'<div class="tb-ai-frame-mount"></div>'
 +'<div class="tb-ai-popup-backup" hidden><strong>Không thể mở chat thu gọn trên trình duyệt này.</strong><p>Bạn vẫn có thể trò chuyện bằng giao diện đầy đủ.</p><a href="/ai" target="_blank" rel="noopener noreferrer">Mở AI toàn màn hình ↗</a></div>'
 +'</section>';
const CSS='<link rel="stylesheet" href="/visitor-ai-widget-v2.css?v=2">';
const SCRIPT='<script defer src="/visitor-ai-widget-v2.js?v=2"></script>';
function afterWiki(nav,link,page){
 const wiki=nav.match(/<a\b[^>]*\bhref=["']\/wiki["'][^>]*>[\s\S]*?<\/a>/i);
 if(!wiki)throw Error("AI-WIDGET: missing Wiki link on "+page);
 return nav.replace(wiki[0],wiki[0]+"\n"+link);
}
export function attachAI(html,page){
 if(!/\btb-community-header-unified\b/.test(html))throw Error("AI-WIDGET: unified header missing "+page);
 if(html.includes("tb-ai-widget-launch")||html.includes("visitor-ai-widget-v2.css"))throw Error("AI-WIDGET: duplicate "+page);
 if(!html.includes("</head>")||!html.includes("</body>"))throw Error("AI-WIDGET: malformed "+page);
 const headerRe=/<header\b[^>]*>[\s\S]*?<\/header>/i;
 const header=html.match(headerRe)?.[0];
 if(!header)throw Error("AI-WIDGET: main header missing "+page);
 const desktopRe=/<nav\b[^>]*class=["']desktop-nav["'][^>]*>[\s\S]*?<\/nav>/i;
 const mobileRe=/<nav\b[^>]*class=["']mobile-nav["'][^>]*>[\s\S]*?<\/nav>/i;
 const desktop=header.match(desktopRe)?.[0],mobile=header.match(mobileRe)?.[0];
 if(!desktop||!mobile)throw Error("AI-WIDGET: desktop/mobile nav missing "+page);
 let updated=header.replace(desktop,afterWiki(desktop,DESKTOP,page));
 updated=updated.replace(mobile,mobile.includes('href="/wiki"')
   ?afterWiki(mobile,MOBILE,page)
   :mobile.replace("</nav>",MOBILE+"</nav>"));
 html=html.replace(headerRe,updated);
 html=html.replace("</head>",CSS+"\n</head>");
 html=html.replace("</body>",PANEL+"\n"+FLOAT+"\n"+SCRIPT+"\n</body>");
 if((html.match(/class="tb-ai-widget-launch"/g)||[]).length!==1
   ||(html.match(/data-tb-ai-toggle/g)||[]).length!==3
   ||(html.match(/id="tb-ai-popup"/g)||[]).length!==1)
   throw Error("AI-WIDGET: expected three launch controls and one dialog "+page);
 return html;
}
for(const page of PAGES){
 const file=path.join(ROOT,page);
 const updated=attachAI(fs.readFileSync(file,"utf8"),page);
 fs.writeFileSync(file,updated);
 console.log("AI-WIDGET:",page,"desktop, mobile, compact popup");
}
