// ADM-07 inventory of legacy packed Admin UI — purely local, no remote/API reads.
import fs from "node:fs";
import {gunzipSync} from "node:zlib";
const loader=fs.readFileSync("overrides/admin.html","utf8");
const parts=[...new Set([...loader.matchAll(/['"](\/admin-v2-runtime\/admin\.[^'"]+)['"]/g)].map(m=>m[1]))];
if(parts.length!==16)throw Error("Admin loader runtime changed");
const raw=gunzipSync(Buffer.from(parts.map(p=>fs.readFileSync("overrides"+p,"utf8").trim()).join(""),"base64")).toString("utf8");
function panel(name){
 const marker='data-view-panel="'+name+'"',i=raw.indexOf(marker);
 if(i<0)return {name,found:false};
 const end=raw.indexOf('data-view-panel="',i+marker.length);
 const sub=raw.slice(i,Math.min(end>=0?end:raw.length,i+11000));
 return {name,found:true,identifiers:[...new Set([...sub.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]))].slice(0,65),
  buttons:[...new Set([...sub.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(m=>m[0].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,80)))].slice(0,30),
  apiPaths:[...new Set([...sub.matchAll(/\/api\/[a-zA-Z0-9?&=_.\/-]+/g)].map(m=>m[0]))].slice(0,20)};
}
const functionHints=["loadMedia","renderMedia","loadUsers","loadInbox","renderUsers","renderInbox","renderAnalytics","loadAnalytics","runHealthCheck","checkService","loadSecurity","loadSystem","refreshGlobalData"];
const functions=functionHints.map(name=>{
 const matches=[...raw.matchAll(new RegExp("(?:async )?function "+name+"\\s*\\(","g"))];
 return {name,count:matches.length,
  preview:matches[0]?raw.slice(matches[0].index,Math.min(matches[0].index+720,raw.length)).replace(/\s+/g," ").replace(/Bearer\s+[^\s"']+/gi,"Bearer [REDACTED]"):""};
});
console.log("ADM-07 PANELS "+JSON.stringify(["media","users","inbox","analytics","security","system"].map(panel),null,2));
console.log("ADM-07 FUNCTIONS "+JSON.stringify(functions,null,2));
