import assert from 'node:assert/strict';
import {feedbackMode,publicAnswerTopic,groundedFollowup}
  from '../../functions/_lib/ai_followup_context.js';
import {verified47ReleaseAnswer}
  from '../../functions/_lib/ai_release_facts.js';
import {getTrainingBotPublicData,composeTrainingBotPublicAnswer}
  from '../../functions/_lib/ai_public_knowledge.js';

// Regression for the exact screenshot: the displayed response was a sourced
// 4.7 date, but the Worker had only persisted its stale generic model response.
for(const [input,mode] of [
  ['trả lời dở thế','feedback'],
  ['Trả lời dở quá','feedback'],
  ['nói rõ hơn đi','clarify'],
  ['tóm lại là sao','clarify'],
  ['thế ở Việt Nam thì sao','vietnam'],
  ['mấy giờ cập nhật','time']
]){
  assert.equal(feedbackMode(input),mode,input);
  const answer=await groundedFollowup(input,'official47',{fetchImpl:async()=>{
    throw Error('No public API needed for a reviewed official claim');
  }});
  assert.match(answer.reply,/12\/11\/2026/);
  assert.match(answer.reply,/chưa xác minh được giờ mở cập nhật riêng tại Việt Nam/);
  assert.equal(answer.sources.length,1);
  assert.equal(answer.sources[0].type,'official_claim');
}
for(const q of [
  'khi nào có bản update 4.8',
  'PUBG MOBILE FLASH có gì mới',
  'Beta 4.7.4 có tải được không',
  'trả lời dở thế nhưng tôi hỏi về 4.8',
  'mẹo M416 nào hay hơn'
]){
  assert.equal(feedbackMode(q),null,'Fresh topic must never inherit old context: '+q);
}
assert.equal(await groundedFollowup('trả lời dở thế','untrusted_kind',{
  fetchImpl:async()=>{throw Error('No fetch permitted');}
}),null,'Only allowlisted server topics may be used');

const source=verified47ReleaseAnswer('bao giờ có bản update 4.7');
assert.equal(publicAnswerTopic('bao giờ có bản update 4.7',source),'official47');
assert.equal(publicAnswerTopic('bao giờ có bản update 4.8',source),null);
assert.equal(publicAnswerTopic('hello',source),null);

const beta={ok:true,versions:[{
  version:'V4.7.4',status:'released',arch:'x64',updated_at:'2026-10-30T10:00:00Z'
}]};
const posts={ok:true,posts:[{
  title:'PUBG MOBILE FLASH ra mắt ngày 13/11/2026',
  url:'/bai-viet/pubg-mobile-flash-ra-mat',
  summary:'Tổng hợp chính sách phát hành',
  published_at:'2026-11-08T10:00:00Z'
}]};
const fetchImpl=async (url,opts)=>{
  assert.equal(opts.credentials,'omit');
  assert.equal(opts.redirect,'manual');
  assert.equal(opts.method,'GET');
  assert(['https://trainingbot.io.vn/api/beta-versions',
    'https://trainingbot.io.vn/api/posts?limit=12'].includes(url));
  return new Response(JSON.stringify(url.includes('beta-versions')?beta:posts),{
    status:200,headers:{'content-type':'application/json'}
  });
};
const betaData=await getTrainingBotPublicData('Beta 4.7 bản nào mới nhất?',{fetchImpl});
const betaResponse=composeTrainingBotPublicAnswer(betaData);
assert.equal(publicAnswerTopic('Beta 4.7 bản nào mới nhất?',betaResponse),'beta47');
const recovered=await groundedFollowup('trả lời dở thế','beta47',{fetchImpl});
assert.match(recovered.reply,/V4\.7\.4/);
assert(!recovered.reply.includes('12/11/2026'),'Never copy 4.7 mainline date into Beta follow-up');
assert.equal(recovered.sources.length,1);
assert.equal(recovered.sources[0].type,'site_release');

const newPostsData=await getTrainingBotPublicData('tin PUBG mới nhất',{fetchImpl});
const newsResponse=composeTrainingBotPublicAnswer(newPostsData);
assert.equal(publicAnswerTopic('tin PUBG mới nhất',newsResponse),'news');
const newsFollowup=await groundedFollowup('nói rõ hơn đi','news',{fetchImpl});
assert.match(newsFollowup.reply,/PUBG MOBILE FLASH/);
assert.equal(newsFollowup.sources[0].type,'site_news');

console.log('PASS: public chat follow-up memory topics, criticism/clarification, verified citations, and unrelated topic isolation');
