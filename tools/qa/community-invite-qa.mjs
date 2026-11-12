// Build gate for public Telegram/Discord invitation dialog. No external calls.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const dir="public",cssTag="/community-invite-v1.css?v=2",jsTag="/community-invite-v1.js?v=2";
const main=["index.html","ban-cap-nhat.html","news.html","wiki.html","community.html","contact.html"];
for(const name of main){
  const source=fs.readFileSync(path.join(dir,name),"utf8");
  assert.equal(source.split(cssTag).length-1,1,name+" CSS once");
  assert.equal(source.split(jsTag).length-1,1,name+" script once");
  assert(source.indexOf(cssTag)<source.indexOf("</head>"),name+" stylesheet in head");
  assert(source.indexOf(jsTag)<source.lastIndexOf("</body>"),name+" script before body end");
}
for(const name of ["admin.html","admin-studio-v2.html","privacy.html","terms.html"]){
  const file=path.join(dir,name);
  if(!fs.existsSync(file))continue;
  const source=fs.readFileSync(file,"utf8");
  assert(!source.includes(cssTag)&&!source.includes(jsTag),
    name+" must not have unsolicited community dialogs");
}
for(const name of fs.readdirSync(dir).filter(x=>/^news-[a-z0-9-]+\.html$/.test(x))){
  const source=fs.readFileSync(path.join(dir,name),"utf8");
  assert(source.includes(cssTag)&&source.includes(jsTag),name+" article coverage");
}
const dyn=fs.readFileSync("functions/bai-viet/[slug].js","utf8");
assert(dyn.includes(cssTag)&&dyn.includes(jsTag),
  "Dynamic published articles receive the public welcome");
const css=fs.readFileSync(path.join(dir,"community-invite-v1.css"),"utf8");
const js=fs.readFileSync(path.join(dir,"community-invite-v1.js"),"utf8");
for(const brand of ["telegram","discord"]){
  const icon=fs.readFileSync(path.join(dir,"community-logo-"+brand+"-v1.svg"),"utf8");
  assert.match(icon,/<svg\b/,"Local official "+brand+" SVG must exist");
  assert.match(icon,/<path d=/,"Logo must contain actual brand vector path");
  assert.match(icon,/fill="#ffffff"/,"Logo must stay visible on colored button");
}
assert.match(css,/position:fixed;inset:0;z-index:99991/);
assert.match(css,/max-height:calc\(100dvh - 32px\)/);
assert.match(css,/@media\(max-width:480px\)/);
assert(!/localStorage|document\.cookie|fetch\(|XMLHttpRequest|innerHTML/.test(js),
  "Modal is not allowed to track, create unsafe DOM or make API calls");
assert(js.includes('https://t.me/TraininggBott'));
assert(js.includes('https://discord.com/invite/5u5PbZMqx'));
assert(js.includes('aria-modal'));
assert(js.includes('sessionStorage.setItem'));
assert(js.includes('event.key==="Escape"'));

// Test actual browser-side JS in a minimal native DOM simulation.
function boot(memory){
  const callbacks={};
  class Element{
    constructor(tag){
      this.tagName=tag;this.children=[];this.attributes={};this.listeners={};
      this.className="";this.textContent="";this.hidden=false;this.isConnected=true;
      this.classList={items:new Set(),add:n=>this.classList.items.add(n),
        remove:n=>this.classList.items.delete(n),
        contains:n=>this.classList.items.has(n)};
    }
    setAttribute(k,v){this.attributes[k]=v;}
    append(...nodes){this.children.push(...nodes);}
    addEventListener(k,cb){this.listeners[k]=cb;}
    focus(){document.activeElement=this;}
  }
  const body=new Element("body");
  const document={
    body,activeElement:body,readyState:"complete",
    createElement:t=>new Element(t),
    querySelector:()=>body.children.find(x=>x.attributes["data-tb-community-invite"]!==undefined)||null,
    addEventListener:(k,cb)=>{callbacks[k]=cb;},
    removeEventListener:k=>{delete callbacks[k];}
  };
  const sessionStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v))};
  vm.runInNewContext(js,{document,sessionStorage},{timeout:1000});
  return {body,document,callbacks,overlay:body.children[0],memory};
}
const memory=new Map();
const first=boot(memory);
assert(first.overlay&&!first.overlay.hidden,"New visitor sees modal on arrival");
assert(first.body.classList.contains("tb-community-invite-active"),"Background scroll is locked");
const card=first.overlay.children[0],x=card.children[0],buttons=card.children[5],later=card.children[6];
const brand=card.children[1];
assert.equal(brand.className,"tb-community-invite-brand");
assert.equal(brand.children[0].src,"/trainingbot-logo-v110.png",
  "Use the same TrainingBot logo as the site header, not the generic favicon");
assert.equal(brand.children[0].alt,"Logo TrainingBot");
assert.equal(brand.children[1].children[0].textContent,"TRAININGBOT");
assert.equal(brand.children[1].children[1].textContent,"GAMING KNOWLEDGE HUB");
assert.equal(card.attributes.role,"dialog");
assert.equal(card.attributes["aria-modal"],"true");
const telegram=buttons.children[0],discord=buttons.children[1];
assert.equal(telegram.href,"https://t.me/TraininggBott");
assert.equal(telegram.children[0].src,"/community-logo-telegram-v1.svg");
assert.equal(telegram.children[0].alt,"");
assert.equal(telegram.children[1].children[0].textContent,"Tham gia Telegram");
assert.equal(discord.children[0].src,"/community-logo-discord-v1.svg");
assert.equal(discord.children[0].alt,"");
assert.equal(discord.children[1].children[0].textContent,"Tham gia Discord");
assert.equal(discord.href,"https://discord.com/invite/5u5PbZMqx");
assert.equal(telegram.target,"_blank");
assert.equal(discord.rel,"noopener noreferrer");
assert.equal(x.attributes["aria-label"],"Đóng thông báo cộng đồng");
assert.equal(first.document.activeElement,x,"First focus on accessible Close control");
later.listeners.click();
assert(first.overlay.hidden,"Dismiss restores site access");
assert.equal(memory.get("tb-community-invite-seen-v1"),"1");
assert(!first.body.classList.contains("tb-community-invite-active"));

const second=boot(memory);
assert.equal(second.overlay,undefined,"No repeated popup within session");
const next=boot(new Map());
assert(next.overlay&&!next.overlay.hidden,"Fresh tab session gets a welcome");
next.callbacks.keydown({key:"Escape",preventDefault(){}});
assert(next.overlay.hidden,"Escape closes without forcing community membership");
const joined=boot(new Map());
joined.overlay.children[0].children[5].children[0].listeners.click();
assert(joined.overlay.hidden,"Telegram click dismisses modal while opening new tab");

console.log("PASS: TrainingBot real logo, Telegram/Discord local marks, first-visit invitation, trusted links, dismissal, session dedupe, Admin isolation");
