import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const source=await fs.readFile("overrides/admin_visitor_analytics_v2.js","utf8");
const match=source.match(/const isRecentlyActive=value=>\{[\s\S]*?\n  \};/);
assert.ok(match,"Online detection function must exist in real Admin analytics source");
const mockedNow=Date.parse("2026-10-29T00:00:00.000Z");
class MockDate extends Date{
  static now(){return mockedNow;}
}
const expression=match[0].replace("const isRecentlyActive=","").replace(/;$/,"");
const isActive=vm.runInNewContext("("+expression+")",{Date:MockDate},{timeout:1000});
const timeAgo=ms=>new Date(mockedNow-ms).toISOString();

assert.equal(isActive(timeAgo(0)),true,"current activity online");
assert.equal(isActive(timeAgo(5*60000)),true,"5-minute threshold inclusive");
assert.equal(isActive(timeAgo(5*60000+1000)),false,"older than five minutes offline");
assert.equal(isActive(timeAgo(30*60000)),false,"30-minute visitor visit is not online");
assert.equal(isActive(""),false,"missing timestamp offline");
assert.equal(isActive("not a date"),false,"invalid timestamp offline");
assert.equal(isActive(new Date(mockedNow+59000).toISOString()),true,"allow 59 seconds clock skew");
assert.equal(isActive(new Date(mockedNow+61000).toISOString()),false,"reject future timestamps beyond clock skew");

// Require both machine-readable and visual cues and retain Admin tagging.
for(const marker of [
  'class="tb-audience-presence-legend"',
  '<th>Trạng thái</th>',
  'const active=isRecentlyActive(v.last_seen_at)',
  'class="tb-audience-presence ${active?"is-online":"is-offline"}"',
  'aria-label="${status}"',
  '.tb-audience-presence.is-online i{background:#34d399',
  '.tb-audience-presence.is-offline i{background:#64748b',
  'class="tb-admin-tag"',
  'value="admin"',
  'colspan="10"',
  'setInterval(()=>{if(original.classList.contains("active"))load();},30000)'
])assert.ok(source.includes(marker),"Missing status or existing Admin behavior: "+marker);

const built=await fs.readFile("public/admin.html","utf8");
assert.ok(built.includes("admin_visitor_analytics_v2.js?v=4"),"built Admin must request cache-busted visitor analytics");
assert.ok(built.includes("admin_browser_label_v1.js"),"keep verified Admin identity");
assert.ok(!built.includes("admin-demo-runtime.js"),"never ship demo runtime in production");
console.log("PASS visitor live indicator: 5-minute activity thresholds, invalid timestamps, visible green/gray + accessible labels, Admin tag, 30-second refresh and built asset v4");
