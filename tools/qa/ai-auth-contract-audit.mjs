import{readFileSync,existsSync}from'node:fs';
const routes=['login','register','profile','logout'];
const files=['public/account.html','public/admin-users.html'];
function context(text,needle){
 const idx=text.indexOf(needle);if(idx<0)return null;
 let s=text.slice(Math.max(0,idx-230),Math.min(text.length,idx+350));
 s=s.replace(/\b[A-Za-z0-9+/_=-]{60,}\b/g,'[REDACTED-LONG-STRING]')
   .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,'[REDACTED-EMAIL]')
   .replace(/(?:['"])(?:sk_|ghp_|Bearer )[A-Za-z0-9._-]+['"]/gi,'[REDACTED-TOKEN]');
 return s;
}
for(const file of files){
 if(!existsSync(file))continue;
 const data=readFileSync(file,'utf8');
 let summary={file,usesCookies:/document\.cookie|credentials\s*:\s*['"]include/i.test(data),
  usesLocalStorage:/localStorage/.test(data),usesSessionStorage:/sessionStorage/.test(data),
  setsAuthorizationHeader:/authorization\s*:|headers\.set\(\s*['"]authorization/i.test(data),
  formNames:[...new Set([...data.matchAll(/name=["'](username|password|email|confirm|otp|code)[^"']*["']/gi)].map(x=>x[1]))],
  relevantRoutes:[]};
 for(const route of routes){
  const found=context(data,'/api/v49/'+route);
  if(found)summary.relevantRoutes.push({route,sourceContext:found});
 }
 for(const route of ['/api/v49/admin/user-status','/api/v49/admin/revoke-sessions']){
  const found=context(data,route);if(found)summary.relevantRoutes.push({route,sourceContext:found});
 }
 console.log('BUILD_AUTH_CONTRACT '+JSON.stringify(summary).slice(0,11500));
}
