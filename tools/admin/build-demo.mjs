// Build a separate Demo from the already-generated A/B/C/D Admin loader.
// No original Admin source or Production functions are changed.
import fs from "node:fs";
const file="public/admin.html";
const source=fs.readFileSync(file,"utf8");
const marker="document.open();document.write(h);document.close()";
if(source.split(marker).length!==2)throw Error("Admin demo: exact loader marker missing");
if(!source.includes("admin-stage-d-ui.js"))throw Error("Admin demo: Stage D loader not present");
if(!fs.existsSync("public/admin-demo-runtime.js"))throw Error("Admin demo runtime not found");
if(fs.existsSync("public/admin-demo.html"))throw Error("Admin demo already generated; refuse stale duplicate");
const csp="<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self' data: blob:; connect-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-src 'none'; form-action 'none'\">";
const shim='<script src="/admin-demo-runtime.js"></script>';
const safeLiteral=s=>JSON.stringify(s).replace(/<\/script/gi,"<\\/script");
const patch="h=h.replace(/(<head\\b[^>]*>)/i, function(_,head){return head+"+safeLiteral(csp+shim)+";});";
const result=source.replace(marker,patch+marker);
if(result===source)throw Error("Admin demo: injection failed");
const outer=result.replace(/(<head[^>]*>)/i,"$1"+csp);
fs.writeFileSync("public/admin-demo.html",outer);
console.log("Demo built from A-D Admin with in-memory-only API interceptor and CSP; main Admin preserved");
