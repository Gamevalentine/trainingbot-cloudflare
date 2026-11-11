import assert from "node:assert/strict";
import {publicKnowledgeIntent,getTrainingBotPublicData,composeTrainingBotPublicAnswer}
  from "../../functions/_lib/ai_public_knowledge.js";
import {verified47ReleaseAnswer} from "../../functions/_lib/ai_release_facts.js";

// Offline-only. Production API shapes are mimicked, not queried. Test the same
// public source mutating between two calls without changing AI source code.
const today=()=>Date.parse("2026-11-11T08:30:00Z");
const state={
  versions:[
    {version:"V4.7.5",status:"coming_soon",arch:"x64",updated_at:"2026-11-11T03:00:00Z"},
    {version:"V4.7.4",status:"released",arch:"x64",updated_at:"2026-10-30T03:00:00Z"}
  ],
  posts:[
    {title:"PUBG MOBILE FLASH ra mắt ngày 13/11/2026",
     url:"/bai-viet/pubg-mobile-flash-ra-mat",summary:"Bản Flash nhẹ hơn",
     published_at:"2026-11-11T03:00:00Z"},
    {title:"PUBG MOBILE 4.7 chính thức ra mắt ngày 12/11/2026",
     url:"/bai-viet/pubg-mobile-4-7-cap-nhat",summary:"Thông tin phiên bản 4.7",
     published_at:"2026-11-10T02:00:00Z"},
    {title:"M416 Glacier mới",
     url:"/bai-viet/m416-glacier-moi",summary:"Hiệu ứng mới",
     published_at:"2026-11-09T02:00:00Z"},
    {title:"Tin độc hại",url:"https://evil.example/steal",
     summary:"<script>alert(1)</script>",published_at:"2026-11-11T03:00:00Z"}
  ]
};
const urls=[];
const fetchImpl=async(url,init)=>{
  urls.push(url);
  assert.equal(init.method,"GET");
  assert.equal(init.redirect,"manual");
  assert.equal(init.credentials,"omit");
  assert.equal(init.headers.accept,"application/json");
  assert(!init.headers.cookie&&!init.headers.authorization);
  const obj=url==="https://trainingbot.io.vn/api/beta-versions"
    ?{ok:true,versions:state.versions}:
    url==="https://trainingbot.io.vn/api/posts?limit=12"
      ?{ok:true,posts:state.posts}:null;
  assert(obj,"No arbitrary host or URL");
  return new Response(JSON.stringify(obj),{
    status:200,headers:{"content-type":"application/json"}
  });
};
const answer=async q=>composeTrainingBotPublicAnswer(
  await getTrainingBotPublicData(q,{fetchImpl,now:today}),
  {official47:verified47ReleaseAnswer(q)});

assert.equal(publicKnowledgeIntent("M416 dùng đạn gì?"),null);
assert.equal(await answer("M416 dùng đạn gì?"),null);
assert.equal(urls.length,0,"No API call for ordinary Wiki question");

const callsBeforeOfficial=urls.length;
const official=await answer("khi nào có bản update 4.7 thế");
assert.match(official.reply,/12\/11\/2026/);
assert(!official.reply.includes("V4.7.5"),"Official schedule must not include unrelated Beta builds");
assert(!official.reply.includes("Bài viết liên quan"));
assert.equal(official.sources.length,1,"One official citation for the direct date question");
assert.equal(official.sources[0].type,"official_claim");
assert.equal(urls.length,callsBeforeOfficial,"Known official schedule needs no unrelated public API fetch");

// A normal Visitor chat question is about PUBG, even without the game name
// or an explicit 4.7 version. Use fresh published release posts instead of
// leaking the generic model's "I cannot access realtime data" fallback.
for(const question of [
  "khi nào có bản update mới",
  "bao giờ có bản update mới",
  "bao giờ PUBG cập nhật bản mới",
  "khi nào update mới",
  "bao giờ có bản cập nhật mới"
]){
  const before=urls.length;
  const generic=await answer(question);
  assert.match(generic.reply,/PUBG MOBILE 4\.7.*12\/11\/2026/);
  assert.equal(generic.sources.length,1);
  assert.equal(generic.sources[0].type,"official_claim");
  assert.equal(urls.length,before+1,"Only public posts API for generic official schedule");
  assert(!generic.reply.includes("Beta"),"No unrelated Beta or news lists");
}
for(const unrelated of [
  "khi nào cập nhật website",
  "khi nào có bản update mới cho Windows",
  "M416 dùng đạn gì?"
]){
  assert.equal(publicKnowledgeIntent(unrelated),null);
}


const first=await answer("Beta 4.7 bản nào mới nhất?");
assert.match(first.reply,/V4\.7\.5.*chưa mở tải/);
assert.equal(first.sources.length,1,"Beta status must have only its relevant catalog source");
assert.equal(first.sources[0].type,"site_release");

state.versions[0].status="released";
state.posts.unshift({
  title:"PUBG MOBILE 4.7.5 Beta có bản tải thử nghiệm mới",
  url:"/bai-viet/pubg-mobile-beta-4-7-5-moi",
  summary:"Bản mới được đăng sau",
  published_at:"2026-11-11T06:00:00Z"
});
const updated=await answer("Beta 4.7 bản nào mới nhất?");
assert.match(updated.reply,/V4\.7\.5.*được đánh dấu đã phát hành/);
assert(!updated.reply.includes("Bản mới được đăng sau"),"Do not dump news into Beta status answer");
assert.notEqual(first.reply,updated.reply,"Next question reads new Beta data");

// A new mainline version announcement supersedes the old 4.7 answer
// immediately, but is correctly attributed to TrainingBot editorial data.
state.posts.unshift({
  title:"PUBG MOBILE 4.8 chính thức ra mắt ngày 18/12/2026",
  url:"/bai-viet/pubg-mobile-4-8-chinh-thuc-ra-mat",
  summary:"Lịch cập nhật từ bài TrainingBot",published_at:"2026-11-11T08:00:00Z"
});
const nextUpdate=await answer("khi nào có bản update mới");
assert.match(nextUpdate.reply,/4\.8.*18\/12\/2026/);
assert.equal(nextUpdate.sources.length,1);
assert.equal(nextUpdate.sources[0].type,"site_news",
  "Never reuse 4.7 official verification for new 4.8 articles");

const latest=await answer("tin PUBG mới nhất");
assert.match(latest.reply,/Bản mới được đăng sau|PUBG MOBILE 4\.7\.5 Beta/);
assert(!latest.reply.includes("Tóm tắt:"),"News titles should be concise");
assert.match(latest.reply,/PUBG MOBILE 4\.7\.5 Beta/);
assert(!latest.sources.some(s=>s.url.includes("evil.example")),"No user-controlled URL");
const flash=await answer("PUBG FLASH ra mắt khi nào");
assert.match(flash.reply,/FLASH/);
assert(!flash.reply.includes("V4.7.5 (x64)"),"Do not confuse Flash with PUBG Beta");
const m416=await answer("tin mới nhất về M416 Glacier");
assert.match(m416.reply,/M416 Glacier/);
assert(!m416.reply.includes("PUBG MOBILE FLASH"),"Topic filter must exclude irrelevant news");
const missing=await answer("PUBG 4.8 khi nào ra mắt");
assert.match(missing.reply,/Chưa đủ căn cứ/);
assert(!missing.reply.includes("12/11/2026"),"Do not copy 4.7 official date to 4.8");

const failed=async()=>{throw Error("Network failed");};
const unreadable=await getTrainingBotPublicData("tin PUBG mới nhất",{fetchImpl:failed,now:today});
assert.match(composeTrainingBotPublicAnswer(unreadable).reply,/chưa đọc được nguồn tin và Beta công khai/,"Public feed failure must not invent fresh news");

console.log("PASS: source-refresh, Beta state, new articles, Flash isolation, no SSRF, bounded fallback, unrelated Wiki");
