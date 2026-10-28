/**
 * ADM-00: inspect original packed Admin V2 without editing its runtime.
 * No requests, no secrets, no DB access. Never commit decoded HTML to Git.
 * run: node tools/admin/audit-runtime.mjs
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {gunzipSync} from "node:zlib";

const root=process.cwd();
const dir=path.join(root,"overrides/admin-v2-runtime");
const source=fs.readFileSync(path.join(root,"overrides/admin.html"),"utf8");
const fetches=[...source.matchAll(/['"](\/admin-v2-runtime\/admin\.[^'"]+)['"]/g)].map(x=>x[1]);
const parts=[...new Set(fetches)];
assert.equal(parts.length,16,"Unexpected Admin loader part count. Inspect packaging before modifying.");
const chunks=parts.map(p=>{
  const filename=path.join(root,"overrides",p.slice(1));
  assert(fs.existsSync(filename),"Missing Admin runtime part: "+p);
  return fs.readFileSync(filename,"utf8").trim();
});
const raw=chunks.join("");
assert(/^[A-Za-z0-9+/=]+$/.test(raw),"Invalid packed Admin base64");
const decoded=gunzipSync(Buffer.from(raw,"base64")).toString("utf8");
assert(decoded.includes("</html>"),"Decoded runtime missing HTML end");
const matches=[...decoded.matchAll(/<button\b[^>]*class=["'][^"']*nav-item[^"']*["'][^>]*data-view=["']([^"']+)["'][^>]*>([\s\S]*?)<\/button>/gi)];
const menu=matches.map(m=>({
 view:m[1],
 label:m[2].replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,90)
}));
const panels=[...decoded.matchAll(/data-view-panel=["']([^"']+)["']/g)].map(m=>m[1]);
const handlers=[...new Set([...decoded.matchAll(/['"]((?:\/api\/)[a-zA-Z0-9/[\]?&=_.-]+)['"]/g)].map(x=>x[1]))];
const hashRoutes=[...decoded.matchAll(/location\.hash[^;\n]{0,100}/g)].map(x=>x[0].slice(0,100)).slice(0,12);
const keys=[...new Set([...decoded.matchAll(/(?:localStorage|sessionStorage)\.(?:getItem|setItem)\(["']([^"']+)["']/g)].map(x=>x[1]))].filter(x=>!/(secret|token|password)/i.test(x));
const report={
 base:"main",adminLoader:"overrides/admin.html",
 packedRuntime:{partCount:parts.length,decodedBytes:Buffer.byteLength(decoded),hasHtml:decoded.includes("<html")},
 menu,panelCount:panels.length,panels:[...new Set(panels)],
 confirmedAPIPrefixes:[...new Set(handlers.map(v=>v.split("/").slice(0,5).join("/")))].slice(0,30),
 routeHashSample:hashRoutes,
 benignStorageKeys:keys.slice(0,25),
 visibleWarningSigns:{
   localQueuedPosts:decoded.includes("postsQueueList")||source.includes("postsQueueList"),
   staticHealthScore:decoded.includes("Health 100")||decoded.includes("health-score"),
   injectedBetaManager:source.includes("admin_beta_versions_v175.js"),
   injectedPostsManager:source.includes("admin_posts_manual_v171.js"),
   customLoaderUsesDocumentWrite:source.includes("document.write(h)"),
 },
 serviceWorker:decoded.includes("serviceWorker"),
};
console.log("ADM-00 PACKED RUNTIME AUDIT (sanitized, no tokens or content printed)\n"+JSON.stringify(report,null,2));
if(process.argv.includes("--extract")){
  const target=path.join(root,".admin-audit-runtime","admin.decoded.html");
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,decoded);
  console.log("Decoded local-only copy: .admin-audit-runtime/admin.decoded.html");
}

if(process.argv.includes("--layout")){
  const offset=decoded.indexOf('class="nav-item"');
  const headerStart=offset>=0?Math.max(0,offset-850):0;
  const navChunk=decoded.slice(headerStart,offset+4400)
    .replace(/<script[\s\S]*?<\/script>/gi,"[script omitted]");
  const markers=["function showView","function setView","const titles","data-view-panel=\"dashboard\"","data-view-panel=\"content\"","const view=","function navigate","location.hash"];
  const snippets=Object.fromEntries(markers.map(marker=>{
    const i=decoded.indexOf(marker);
    return [marker,i>=0?decoded.slice(Math.max(0,i-120),i+420).replace(/\s+/g," ").slice(0,540):"(not present)"];
  }));
  console.log("ADM-00 LAYOUT MAP (source snippets only; no credentials)\n"+JSON.stringify({navChunk,snippets},null,2));
}
