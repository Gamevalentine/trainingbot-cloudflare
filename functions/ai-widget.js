// First-party public chat UI. No Production D1 or Admin APIs are used.
// Anonymous chat calls the fixed, bounded Production-to-Preview BFF bridge.
const HTML=`<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="color-scheme" content="dark">
<title>TrainingBot AI · Chat</title>
<link rel="stylesheet" href="/ai-widget.css?v=1">
<script defer src="/ai-widget.js?v=1"></script>
</head><body>
<main class="tb-frame" aria-label="Trò chuyện với TrainingBot AI">
<header class="tb-head">
  <div class="tb-face" aria-hidden="true"><span>◉</span></div>
  <div class="tb-titles"><strong>TrainingBot AI</strong><small>Trợ lý PUBG MOBILE · Beta</small></div>
  <button class="tb-x" id="tb-close" type="button" aria-label="Đóng trợ lý AI">×</button>
</header>
<div class="tb-thread" id="tb-thread" role="log" aria-live="polite" aria-relevant="additions">
  <div class="tb-message tb-assistant"><span class="tb-small-avatar" aria-hidden="true">✦</span><div class="tb-bubble">Mình có thể giúp gì cho bạn?</div></div>
</div>
<p class="tb-status" role="status" id="tb-status">Đang kết nối trợ lý…</p>
<form class="tb-compose" id="tb-form" autocomplete="off">
  <label class="tb-sr" for="tb-question">Nhập câu hỏi</label>
  <textarea id="tb-question" rows="1" maxlength="3000" disabled placeholder="Hỏi mình về PUBG MOBILE…"></textarea>
  <button type="submit" id="tb-send" disabled aria-label="Gửi câu hỏi">➤</button>
</form>
<footer class="tb-footer"><span>✦ TrainingBot AI · Beta</span><a href="/ai" target="_blank" rel="noopener noreferrer">Mở toàn màn hình ↗</a></footer>
</main></body></html>`;
export function onRequestGet({request}){
 const u=new URL(request.url);
 if(u.origin!=='https://trainingbot.io.vn')
   return new Response('Not found',{status:404,headers:{'cache-control':'no-store'}});
 return new Response(HTML,{status:200,headers:{
   'content-type':'text/html; charset=utf-8',
   'cache-control':'no-store, max-age=0',
   'x-content-type-options':'nosniff',
   'x-robots-tag':'noindex, nofollow',
   'referrer-policy':'no-referrer',
   'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'self'; object-src 'none'",
   'permissions-policy':'camera=(), microphone=(), geolocation=()'
 }});
}
