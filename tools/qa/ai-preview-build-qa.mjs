import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
for(const path of ['public/ai-preview.html','public/ai-admin-preview.html',
  'public/ai-preview.css','public/ai-preview.js']){
  assert.equal(existsSync(path),true,'Pages build must contain '+path);
}
for(const path of ['public/ai-preview.html','public/ai-admin-preview.html']){
 const html=readFileSync(path,'utf8');
 assert.match(html,/noindex,nofollow/);
 assert.match(html,/ai-preview\.js/);
 assert.doesNotMatch(html,/API_TOKEN|TRAININGBOT_AI_SESSION_HMAC_KEY/);
}
assert.equal(existsSync('public/admin.html'),true);
console.log('TrainingBot Pages Preview build PASS: both AI UI pages emitted; no credentials exposed.');
