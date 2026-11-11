// Offline DOM harness: no external requests, no Cloudflare deploy and no paid CI.
// Run with: node tools/qa/ai-preview-availability-qa.mjs
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const source=readFileSync("overrides/ai-preview.js","utf8");
const response=(status,body)=>({ok:status>=200&&status<300,status,json:async()=>body});

async function scenario({ready=true,sessionStatus=200,chatStatus=200,submit=false}={}){
  const makeElement=()=>({
    textContent:"",value:"",disabled:true,placeholder:"",style:{},children:[],listeners:{},
    append(...children){this.children.push(...children);},
    setAttribute(){},scrollIntoView(){},
    addEventListener(name,callback){this.listeners[name]=callback;},
    querySelector(selector){
      if(!this.descendants)this.descendants={strong:makeElement(),p:makeElement()};
      return this.descendants[selector]??null;
    }
  });
  const nodes=Object.fromEntries(["readiness","access-label","prompt","send","chat-form","composer-help","thread"].map(id=>[id,makeElement()]));
  const calls=[];
  const fetch=async url=>{
    calls.push(url);
    if(url.endsWith("/status"))return response(200,{
      ready,anonymousVisitorReady:ready,surfaces:{visitor:ready,admin:false},identityVerified:false
    });
    if(url.endsWith("/session"))return response(sessionStatus,{ok:sessionStatus===200});
    if(url.endsWith("/chat"))return response(chatStatus,
      chatStatus===200?{reply:"Trả lời kiểm thử",conversationId:"conv_preview_12345678",sources:[]}:{
        error:{code:"RATE_LIMITED"}
      });
    throw Error("UNEXPECTED_FETCH");
  };
  const document={
    body:{dataset:{aiSurface:"visitor"}},
    getElementById:id=>nodes[id],
    createElement:()=>makeElement()
  };
  vm.runInNewContext(source,{document,fetch,Error,console},{filename:"ai-preview.js",timeout:1000});
  // Let check() settle after status + session fetch promises.
  await new Promise(resolve=>setImmediate(resolve));
  if(submit){
    assert.equal(nodes.prompt.disabled,false,"Chat must be ready before send");
    nodes.prompt.value="M416";
    await nodes["chat-form"].listeners.submit({preventDefault(){}});
  }
  return {nodes,calls};
}

const ready=await scenario();
assert.equal(ready.nodes.prompt.disabled,false);
assert.equal(ready.nodes.send.disabled,false);
assert.equal(ready.nodes["access-label"].textContent,"Visitor AI sẵn sàng");

const unavailable=await scenario({sessionStatus:503});
assert.equal(unavailable.nodes.prompt.disabled,true);
assert.equal(unavailable.nodes["access-label"].textContent,"Lỗi tạo phiên");
assert.match(unavailable.nodes.readiness.descendants.p.textContent,/chưa cấp được phiên/);

const limitedSession=await scenario({sessionStatus:429});
assert.equal(limitedSession.nodes.prompt.disabled,true);
assert.equal(limitedSession.nodes["access-label"].textContent,"Đã giới hạn lượt");
assert.match(limitedSession.nodes.readiness.descendants.p.textContent,/giới hạn lượt/);
assert.equal(limitedSession.calls.filter(x=>x.endsWith("/session")).length,1,"No automatic retry");

const disconnected=await scenario({ready:false});
assert.equal(disconnected.nodes.prompt.disabled,true);
assert.equal(disconnected.calls.filter(x=>x.endsWith("/session")).length,0);

const limitedChat=await scenario({chatStatus:429,submit:true});
assert.equal(limitedChat.nodes.prompt.disabled,true);
assert.equal(limitedChat.nodes.send.disabled,true);
assert.equal(limitedChat.nodes["access-label"].textContent,"Đã giới hạn lượt");
assert.equal(limitedChat.calls.filter(x=>x.endsWith("/chat")).length,1,"No automatic chat retry");
assert.equal(limitedChat.calls.filter(x=>x.endsWith("/session")).length,1,"No new session after chat quota");

console.log("PASS: Preview ready, session unavailable, session quota, offline, chat quota (no retries)");