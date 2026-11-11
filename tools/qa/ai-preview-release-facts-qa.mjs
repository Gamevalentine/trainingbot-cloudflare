import assert from 'node:assert/strict';
import {verified47ReleaseAnswer} from '../../functions/_lib/ai_release_facts.js';

// Exact editorial facts: a scheduled global date is not the same as live store
// availability; Beta catalog is an observed TrainingBot state, not official.
for(const question of [
  'bao giờ có bản update 4.7',
  'Khi nào PUBG mobile v4.7 cập nhật?'
]){
  const result=verified47ReleaseAnswer(question);
  assert(result);
  assert.match(result.reply,/12\/11\/2026/);
  assert.match(result.reply,/khu vực Nhật Bản/);
  assert.match(result.reply,/không phải dữ liệu cửa hàng thời gian thực/);
  assert.equal(result.sources[0].url,
    'https://www.pubgmobile.jp/version-4-7-0-update-notice-20261105/');
  assert.equal(result.sources[0].checkedAt,'2026-11-11');
}
for(const question of ['Beta 4.7 đã có chưa?','v4.7.4 beta tải được chưa?']){
  const result=verified47ReleaseAnswer(question);
  assert(result);
  assert.match(result.reply,/V4\.7\.4/);
  assert.match(result.reply,/bản thử nghiệm, không phải bản cập nhật chính thức/);
  assert.equal(result.sources[1].url,'https://trainingbot.io.vn/ban-cap-nhat');
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
console.log('PASS: sourced PUBG MOBILE 4.7 schedule, Beta distinction, no Flash/version leakage');
