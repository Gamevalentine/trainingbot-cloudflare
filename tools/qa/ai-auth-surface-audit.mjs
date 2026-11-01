import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {basename,join} from 'node:path';
const root='public';
const paths=['account.html','admin.html','index.html'].filter(p=>existsSync(join(root,p)));
const files=readdirSync(root).filter(p=>/\.(?:js|html)$/i.test(p)&&/account|auth|login|user|header|navigation|admin/i.test(p)).slice(0,75);
const selected=[...new Set([...paths,...files])];
function evidence(text) {
  const routes=[...text.matchAll(/\/api\/(?:v[0-9]{1,3}\/)?(?:auth|users?|account|login|logout|session|register|profile|admin)[a-z0-9/_-]{0,90}/ig)]
    .map(m=>m[0].replace(/\/+$/,'')).filter(x=>x.length<=95);
  const safe=[...new Set(routes)].filter(x=>!/\d{9,}|[A-Za-z0-9_-]{32,}/.test(x)).slice(0,30);
  const upstream=[...text.matchAll(/https:\/\/(?:[a-z0-9-]+\.)?(?:ai-vn\.workers\.dev|trainingbot\.io\.vn)/ig)].map(x=>x[0]);
  const refs=[...text.matchAll(/(?:src|href)\s*=\s*["']([^"']+\.js(?:\?[^"']*)?)["']/ig)]
    .map(x=>x[1]).filter(x=>x.startsWith('/')||x.startsWith('./')).slice(0,40);
  return {routes:safe,upstreamHosts:[...new Set(upstream)].slice(0,10),
    scriptRefs:[...new Set(refs)].slice(0,25),
    markers:{
      emailPassword:/password|mật khẩu|forgot.password/i.test(text),
      oauthGoogle:/accounts\.google|google\.accounts|google\.com\/gsi|google-client/i.test(text),
      oauthDiscord:/discord\.com\/oauth|discord\.com\/api\/oauth/i.test(text),
      oauthApple:/appleid\.apple\.com/i.test(text),
      cookie:/document\.cookie|Set-Cookie|credentials\s*:\s*['"]include/i.test(text),
      localStorage:/localStorage/.test(text),
      sessionStorage:/sessionStorage/.test(text),
      sessionToken:/sessionToken|accessToken|refreshToken|session_token|access_token/i.test(text),
      login:/\blogin\b|đăng nhập/i.test(text),
      logout:/\blogout\b|đăng xuất/i.test(text),
      accountStatus:/suspended|account_status|user_status/i.test(text)
    }};
}
const output=[];
for(const path of selected){
  const full=join(root,path);
  if(!statSync(full).isFile()||statSync(full).size>4_000_000)continue;
  const content=readFileSync(full,'utf8');
  const x=evidence(content);
  if(x.routes.length||path==='account.html'||x.scriptRefs.length)output.push({file:path,bytes:content.length,...x});
}
console.log('READ_ONLY_PACKAGED_WEBSITE_AUTH_EVIDENCE '+JSON.stringify(output).slice(0,17000));
console.log('All evidence derives from public build assets; no user records, cookies, tokens or live API calls accessed.');
