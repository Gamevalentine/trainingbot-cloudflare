import assert from "node:assert/strict";
import {publicKnowledgeIntent,getTrainingBotPublicData,composeTrainingBotPublicAnswer}
  from "../../functions/_lib/ai_public_knowledge.js";

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
    {title:"PUBG MOBILE 4.7 cập nhật ngày 12/11/2026",
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
const answer=async q=>composeTrainingBotPublicAnswer(await getTrainingBotPublicData(q,{fetchImpl,now:today}));

assert.equal(publicKnowledgeIntent("M416 dùng đạn gì?"),null);
assert.equal(await answer("M416 dùng đạn gì?"),null);
assert.equal(urls.length,0,"No API call for ordinary Wiki question");

const first=await answer("bao giờ có bản update 4.7");
assert.match(first.reply,/V4\.7\.5.*chưa mở tải/);
assert(first.sources.some(s=>s.type==="site_release"));
assert(first.sources.some(s=>s.type==="site_news"));

state.versions[0].status="released";
state.posts.unshift({
  title:"PUBG MOBILE 4.7.5 Beta có bản tải thử nghiệm mới",
  url:"/bai-viet/pubg-mobile-beta-4-7-5-moi",
  summary:"Bản mới được đăng sau",
  published_at:"2026-11-11T06:00:00Z"
});
const updated=await answer("bao giờ có bản update 4.7");
assert.match(updated.reply,/V4\.7\.5.*được đánh dấu đã phát hành/);
assert.match(updated.reply,/Bản mới được đăng sau/);
assert.notEqual(first.reply,updated.reply,"Next question reads new public data");

const latest=await answer("tin PUBG mới nhất");
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
assert.equal(composeTrainingBotPublicAnswer(unreadable),null,"Public feed failure must not invent fresh news");

console.log("PASS: source-refresh, Beta state, new articles, Flash isolation, no SSRF, bounded fallback, unrelated Wiki");
