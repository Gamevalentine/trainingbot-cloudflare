import assert from 'node:assert/strict';
import {verified47ReleaseAnswer} from '../../functions/_lib/ai_release_facts.js';

const globalPost='https://www.instagram.com/reel/DfbazBRtgl5/';
const trainingbotArticle='https://trainingbot.io.vn/bai-viet/pubg-mobile-4-7-chinh-thuc-ra-mat-ngay-12-11-2026-lich-cap-nhat-va-nhung-dieu-can-biet';
for(const question of [
  'bao giờ có bản update 4.7',
  'Khi nào PUBG mobile v4.7 cập nhật?',
  'PUBG MOBILE 4.7 chính thức ra mắt ngày nào?'
]){
  const answer=verified47ReleaseAnswer(question);
  assert(answer);
  assert.equal(answer.reply,'PUBG MOBILE 4.7 bản quốc tế (Global) cập nhật ngày 12/11/2026.');
  assert(!/Nhật Bản|khu vực Nhật|không thể cung cấp/.test(answer.reply));
  assert.deepEqual(answer.sources.map(s=>s.type),['official_claim','site_news']);
  assert.deepEqual(answer.sources.map(s=>s.url),[globalPost,trainingbotArticle]);
  assert.equal(answer.sources[0].checkedAt,'2026-11-11');
}
for(const question of ['Beta 4.7 đã có chưa?','v4.7.4 beta tải được chưa?']){
  const answer=verified47ReleaseAnswer(question);
  assert(answer);
  assert.match(answer.reply,/V4\.7\.4/);
  assert.match(answer.reply,/bản cập nhật chính thức/);
  assert.deepEqual(answer.sources.map(s=>s.type),['site_release']);
  assert.equal(answer.sources[0].url,'https://trainingbot.io.vn/ban-cap-nhat');
}
for(const question of [
  'PUBG MOBILE Flash Beta v4.7.0 khi nào có',
  'bao giờ có bản update 4.6',
  'M416 bắn thế nào',
  'cách dùng súng 4.7',
  '',
  'A'.repeat(3001)
]){
  assert.equal(verified47ReleaseAnswer(question),null,
    'Do not generate unsupported release claims: '+question.slice(0,60));
}
console.log('PASS: global official PUBG MOBILE 4.7 direct date + TrainingBot news citations; no Japan attribution');
