// ADM-01: versioned, readable transforms of the decoded historical Admin
// runtime. Does not edit compressed parts, API code, database or secrets.
// Applied to the generated public/admin.html loader only after build, and
// guarded against upstream changes so a mismatched runtime FAILS the build.
import fs from "node:fs";
import path from "node:path";
import {gunzipSync} from "node:zlib";

const loaderPath="public/admin.html";
const file=fs.readFileSync(loaderPath,"utf8");
const paths=[...file.matchAll(/['"](\/admin-v2-runtime\/admin\.[^'"]+)['"]/g)]
 .map(m=>m[1]);
const parts=[...new Set(paths)];
if(parts.length!==16)throw Error("ADM-01: Admin loader changed, inspect before applying");
const decoded=gunzipSync(Buffer.from(parts.map(x=>
 fs.readFileSync(path.join("public",x.slice(1)),"utf8").trim()).join(""),"base64")).toString("utf8");
const patches=[];
const apply=(label,before,after)=>{
 const n=decoded.split(before).length-1;
 if(n!==1)throw Error("ADM-01: expected exactly one anchor "+label+"; got "+n);
 patches.push({label,before,after});
};
apply("userStats mapping",
 'const map = {kpiUsers:stats.total??0,kpiActive24:stats.active_24h??0,kpiNewToday:stats.new_today??0,usersTotal:stats.total??0,users24:stats.active_24h??0,users7:stats.active_7d??0,usersToday:stats.new_today??0};',
 'const map = {kpiUsers:stats.total??"—",kpiActive24:stats.active_24h??"—",kpiNewToday:stats.new_today??"—",usersTotal:stats.total??"—",users24:stats.active_24h??"—",users7:stats.active_7d??"—",usersToday:stats.new_today??"—"};');
apply("users7 field",
 '$( "kpiActive7" )'.replaceAll(" ",""),
 '$( "kpiActive7" )'.replaceAll(" ","")); // additional exact field replacement follows below
patches.pop(); // above marker only checks existence; avoid a no-op patch
apply("users7 count",
 'stats.active_7d ?? 0',
 'stats.active_7d ?? "—"');
apply("users badge",
 '$( "userNavBadge" ).textContent = stats.total ?? 0;'.replaceAll(" ",""),
 '$( "userNavBadge" ).textContent = stats.total ?? "—";'.replaceAll(" ",""));
apply("inbox counts map",
 'const map = {kpiUnread:counts.unread??0,mailTotal:counts.total??0,mailUnread:counts.unread??0,mailRead:counts.read??0,mailReplied:counts.replied??0};',
 'const map = {kpiUnread:counts.unread??"—",mailTotal:counts.total??"—",mailUnread:counts.unread??"—",mailRead:counts.read??"—",mailReplied:counts.replied??"—"};');
apply("inbox total sublabel",
 'counts.total ?? 0',
 'counts.total ?? "—"');
apply("inbox badge",
 '$( "inboxNavBadge" ).textContent = counts.unread ?? 0;'.replaceAll(" ",""),
 '$( "inboxNavBadge" ).textContent = counts.unread ?? "—";'.replaceAll(" ",""));
apply("dashboard user fetch fallbacks",
 [
 '    if (u.status === "fulfilled") {',
 '      userStats = u.value.stats || {};',
 '      userRows = u.value.users || [];',
 '      renderDashboardUsers(userRows);',
 '      applyUserStats(userStats);',
 '    }',
 ].join("\n"),
 [
 '    if (u.status === "fulfilled" && u.value.stats && Array.isArray(u.value.users)) {',
 '      userStats = u.value.stats;',
 '      userRows = u.value.users;',
 '      renderDashboardUsers(userRows);',
 '      applyUserStats(userStats);',
 '    } else {',
 '      userStats = {};userRows = [];applyUserStats({});',
 '      if ($("recentUsers")) $("recentUsers").textContent = "Không tải được danh sách người dùng; chưa thể xác nhận số lượng.";',
 '      if ($("kpiUsersSub")) $("kpiUsersSub").textContent = "Dữ liệu chưa xác thực";',
 '    }',
 ].join("\n"));
apply("dashboard inbox fetch fallbacks",
 [
 '    if (m.status === "fulfilled") {',
 '      inboxCounts = m.value.counts || {};',
 '      inboxRows = m.value.messages || [];',
 '      renderDashboardMessages(inboxRows);',
 '      applyInboxCounts(inboxCounts);',
 '    }',
 ].join("\n"),
 [
 '    if (m.status === "fulfilled" && m.value.counts && Array.isArray(m.value.messages)) {',
 '      inboxCounts = m.value.counts;',
 '      inboxRows = m.value.messages;',
 '      renderDashboardMessages(inboxRows);',
 '      applyInboxCounts(inboxCounts);',
 '    } else {',
 '      inboxCounts = {};inboxRows = [];applyInboxCounts({});',
 '      if ($("recentMessages")) $("recentMessages").textContent = "Không tải được hộp thư; chưa thể xác nhận số thư.";',
 '      if ($("kpiInboxTotal")) $("kpiInboxTotal").textContent = "Dữ liệu chưa xác thực";',
 '    }',
 ].join("\n"));
apply("action center user unknown",
 'const newToday = userStats?.new_today || 0;',
 'const newToday = userStats?.new_today;');
apply("action center inbox unknown",
 'const unread = inboxCounts?.unread || 0;',
 'const unread = inboxCounts?.unread;');
apply("action center fallback when reads failed",
 '    $("actionCenter").innerHTML = actions.map',
 [
 '    if (unread == null) actions[0] = ["✉","Hộp thư chưa tải được","Không có số liệu xác thực; hãy thử làm mới","inbox"];',
 '    if (newToday == null) actions[1] = ["+","Người dùng chưa tải được","Không có số liệu xác thực; hãy thử làm mới","users"];',
 '    $("actionCenter").innerHTML = actions.map'
 ].join("\n"));
apply("health label title",
 '<h3>Admin & API</h3>',
 '<h3>Tình trạng 3 API kiểm tra</h3>');
apply("health ring descriptor",
 '<small>/100</small>',
 '<small>API kiểm tra</small>');
apply("health score precise",
 '$("healthScore").textContent = score;',
 '$("healthScore").textContent = good + "/" + results.length;');
apply("health global status",
 '"Hệ thống ổn định"',
 '"Các phép thử API đã hoàn tất"');
let checked=decoded;
for(const patch of patches){
 if(checked.split(patch.before).length!==2)throw Error("ADM-01: transform overlaps "+patch.label);
 checked=checked.replace(patch.before,patch.after);
}
const marker="document.open();document.write(h);document.close()";
if(file.split(marker).length!==2)throw Error("ADM-01: loader changed, abort safe patch");
if(file.includes("ADM-01-RUNTIME-STATE-PATCH")){
 console.log("ADM-01 transform already installed");
 process.exit(0);
}
const statements=patches.map(p=>"h=h.replace("+JSON.stringify(p.before)+","+JSON.stringify(p.after)+");").join("");
const result=file.replace(marker,"/*ADM-01-RUNTIME-STATE-PATCH*/"+statements+marker);
fs.writeFileSync(loaderPath,result);
console.log("ADM-01 runtime transformed (build only): "+patches.map(x=>x.label).join(", "));
