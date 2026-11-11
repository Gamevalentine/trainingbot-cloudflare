import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
for(const path of ['public/ai-preview.html','public/ai-admin-preview.html',
  'public/ai-preview.css','public/ai-preview.js',
  'public/ai-widget.css','public/ai-widget.js']){
  assert.equal(existsSync(path),true,'Pages build must contain '+path);
}
for(const path of ['public/ai-preview.html','public/ai-admin-preview.html']){
 const html=readFileSync(path,'utf8');
 assert.match(html,/noindex,nofollow/);
 assert.doesNotMatch(html,/footer_v135\.js|visitor_tracking_v177\.js|header_search_v152\.js/);
 assert.match(html,/ai-preview\.js/);
 assert.doesNotMatch(html,/API_TOKEN|TRAININGBOT_AI_SESSION_HMAC_KEY/);
}

const widget=readFileSync('functions/ai-widget.js','utf8');
assert.match(widget,/frame-ancestors https:\/\/trainingbot\.io\.vn/);
assert.doesNotMatch(widget,/x-frame-options|TRAININGBOT_AI_PREVIEW_BRIDGE_SECRET/i);
const widgetScript=readFileSync('public/ai-widget.js','utf8');
assert.match(widgetScript,/\?embed=1/);
assert.match(widgetScript,/credentials:"same-origin"/);
assert.doesNotMatch(widgetScript,/localStorage|sessionStorage|innerHTML|admin-chat|TRAININGBOT_AI_PREVIEW_BRIDGE_SECRET/);
assert.equal(existsSync('public/admin.html'),true);
console.log('TrainingBot Pages Preview build PASS: both AI UI pages emitted; no credentials exposed.');
