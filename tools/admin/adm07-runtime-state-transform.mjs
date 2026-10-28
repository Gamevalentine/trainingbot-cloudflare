// ADM-07: guarded transforms on generated Admin loader, not its packed source.
import fs from "node:fs";
import {gunzipSync} from "node:zlib";
const file="public/admin.html",loader=fs.readFileSync(file,"utf8");
const chunks=[...new Set([...loader.matchAll(/['"](\/admin-v2-runtime\/admin\.[^'"]+)['"]/g)].map(x=>x[1]))];
if(chunks.length!==16)throw Error("ADM-D unexpected packed runtime shape");
const original=gunzipSync(Buffer.from(chunks.map(x=>fs.readFileSync("public"+x,"utf8").trim()).join(""),"base64")).toString("utf8");
const patches=[];
function section(name,start,end,changes){
 const i=original.indexOf(start),j=original.indexOf(end,i+start.length);
 if(i<0||j<0)throw Error("ADM-D missing "+name+" function boundaries");
 let before=original.slice(i,j),after=before;
 for(const [oldText,newText] of changes){
  const occurrences=after.split(oldText).length-1;
  if(occurrences!==1)throw Error("ADM-D "+name+" anchor count="+occurrences);
  after=after.replace(oldText,newText);
 }
 patches.push({before,after,name});
}
section("users","  async function loadUsers() {","  function renderUsers() {",[
 ['      userRows = data.users || [];','      if (!Array.isArray(data.users) || !data.stats || typeof data.stats !== "object") throw new Error("Dữ liệu người dùng không hợp lệ.");\n      userRows = data.users;'],
 ['    } catch (error) { setNotice($("usersNotice"), error.message, "error"); if (error.status === 401) logout(); }',
 '    } catch (error) { userRows=[];userStats={};applyUserStats({});$("usersTable").innerHTML="<tr><td colspan=7>Không tải được người dùng; chưa thể xác nhận số lượng.</td></tr>";renderAnalytics();setNotice($("usersNotice"),error.message||"Không tải được người dùng.","error");if(error.status===401)logout(); }']
]);
section("inbox","  async function loadInbox() {","  function filteredInbox() {",[
 ['      inboxRows = data.messages || [];','      if (!Array.isArray(data.messages) || !data.counts || typeof data.counts !== "object") throw new Error("Dữ liệu hộp thư không hợp lệ.");\n      inboxRows = data.messages;'],
 ['    } catch (error) { setNotice($("inboxNotice"), error.message, "error"); if (error.status === 401) logout(); }',
 '    } catch (error) { inboxRows=[];inboxCounts={};applyInboxCounts({});$("mailList").textContent="Không tải được hộp thư; chưa thể xác nhận số lượng.";renderAnalytics();renderActionCenter();setNotice($("inboxNotice"),error.message||"Không tải được hộp thư.","error");if(error.status===401)logout(); }']
]);
section("analytics","  function renderAnalytics() {","  async function healthOne(",[
 ['["Media trong thư viện", mediaRows.length]','["Media trên trình duyệt này", mediaRows.length]'],
 ['    $("analyticsSummary").innerHTML = lines.map(([a,b]) => ',
 '    if(userStats?.total==null){$("userActivityChart").textContent="Chưa có dữ liệu người dùng đã xác thực.";}if(inboxCounts?.total==null){$("mailLegend").textContent="Chưa có dữ liệu hộp thư đã xác thực.";$("mailReplyRate").textContent="—";$("mailDonut").style.setProperty("--a",0);$("mailDonut").style.setProperty("--b",0);}\n    $("analyticsSummary").innerHTML = lines.map(([a,b]) => ']
]);
section("inbox-compose","  async function inboxAction(id, action) {","  function renderAnalytics() {",[
 ['      action = "read";','      return; // Gmail composer opened; no proof of sending, no status write.']
]);
const marker="document.open();document.write(h);document.close()";
if(loader.split(marker).length!==2||loader.includes("ADM-07-PATCH"))throw Error("ADM-D loader mismatch");
let rebuilt=original,statements="";
for(const p of patches){
 if(rebuilt.split(p.before).length!==2)throw Error("ADM-D overlapping/missing "+p.name);
 rebuilt=rebuilt.replace(p.before,p.after);
 statements+="h=h.replace("+JSON.stringify(p.before)+","+JSON.stringify(p.after)+");";
}
fs.writeFileSync(file,loader.replace(marker,"/*ADM-07-PATCH*/"+statements+marker));
console.log("ADM-07 packed runtime untouched; guarded generated fixes: "+patches.map(x=>x.name).join(", "));
