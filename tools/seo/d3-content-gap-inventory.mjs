// D3.1: read-only, source-backed inventory of public category coverage and
// editorial gaps. Dynamic article counts come from the public SELECT-only
// sitemap endpoint; do not call /api/posts, which has setup DDL on GET.
import fs from "node:fs";
import assert from "node:assert/strict";
const origin="https://trainingbot-cloudflare.pages.dev";
const wikiC=JSON.parse(fs.readFileSync("overrides/wiki-stage-c-evidence.json","utf8"));
const wikiD=JSON.parse(fs.readFileSync("overrides/wiki-stage-d-evidence.json","utf8"));
const wikiF=JSON.parse(fs.readFileSync("overrides/wiki-stage-f-guides.json","utf8"));
const sections=[
 {id:"home",path:"/",file:"overrides/index.html",category:"Trang chủ"},
 {id:"wiki",path:"/wiki",file:"overrides/wiki.html",category:"Wiki"},
 {id:"beta",path:"/ban-cap-nhat",file:"overrides/updates.html",category:"PUBG Mobile Beta"},
 {id:"news",path:"/news",file:"overrides/news.html",category:"Tin tức"},
 {id:"versions",path:"/news-versions",file:"overrides/news-versions.html",category:"Tin phiên bản"},
 {id:"esports",path:"/news-esports",file:"overrides/news-esports.html",category:"Esports"},
 {id:"communityNews",path:"/news-community",file:"overrides/news-community.html",category:"Tin cộng đồng"},
 {id:"community",path:"/community",file:"overrides/community.html",category:"Cộng đồng"},
 {id:"contact",path:"/contact",file:"overrides/contact.html",category:"Liên hệ"}
];
const note=(text)=>String(text||"").replace(/\s+/g," ").trim();
const report={checkedAt:new Date().toISOString(),scope:"GitHub source evidence + HTTP GET public pages; no credentials or D1 writes",
 sections:[],wiki:{},editorial:{},gaps:[],unknowns:[]};
for(const entry of sections){
 const item={...entry,sourceExists:fs.existsSync(entry.file),http:null,canonical:null,
  title:null,description:null,robots:null,h1:null,notes:[]};
 if(!item.sourceExists)item.notes.push("source path not found in overrides; check build archive/route");
 try{
  const res=await fetch(origin+entry.path,{method:"GET",signal:AbortSignal.timeout(18000)});
  item.http=res.status;
  if(res.ok){
   const html=await res.text();
   item.title=note(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]);
   item.canonical=html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1]||null;
   item.description=html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)/i)?.[1]||null;
   item.robots=html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)/i)?.[1]||null;
   item.h1=note(html.match(/<h1[^>]*>([\s\S]{0,300}?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g," "));
   if(!item.description)item.notes.push("meta description not visible");
   if(!item.title)item.notes.push("document title missing");
  }
 }catch(e){item.notes.push("request error: "+String(e?.name||"Error"))}
 report.sections.push(item);
}
report.wiki={
 weapons:{officialEvidenceProfiles:Object.keys(wikiC.weapons||{}).length,
  limitation:"11 evidence-backed profiles, not asserted to cover complete legacy catalog"},
 attachments:wikiD.coverage.attachments,
 vehicles:wikiD.coverage.vehicles,
 maps:wikiD.coverage.maps,
 editorialGuides:wikiF.guides.length,
 guideDistribution:Object.fromEntries(wikiF.categories.filter(c=>c.id!=="all")
  .map(c=>[c.id,wikiF.guides.filter(g=>g.category===c.id).length])),
 unlistedOfficialItems:Object.keys(wikiD.unlisted||{})
};
const sitemap=await fetch(origin+"/sitemap-posts.xml",{signal:AbortSignal.timeout(18000)});
report.editorial.sitemapHttp=sitemap.status;
if(sitemap.ok){
 const xml=await sitemap.text();
 const urlPaths=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 report.editorial.publishedSitemapUrlCount=urlPaths.length;
 report.editorial.articleUrls=urlPaths;
}else report.unknowns.push("Cannot read current dynamic sitemap; public D1 post count unverified");
report.editorial.knownFiveD1Articles=5;
report.editorial.completeEditorialSourceCoverage=false;
const g=(id,priority,reason,proposedNext)=>report.gaps.push({id,priority,reason,proposedNext});
g("D3-01","P0","51 phụ kiện đã được kiểm kê nhưng 0 trường hợp có tương thích được xác minh và 0 xác minh quyền ảnh theo wiki D.","Lập bảng nguồn theo từng phiên bản và trạng thái giấy phép, ưu tiên 10 phụ kiện phổ biến");
g("D3-02","P0","26 phương tiện trong Wiki D chưa có hồ sơ thông số đầy đủ được xác minh; Thuyền Cao Su 4.6 chưa có trong danh mục cũ.","Đối chiếu tài liệu 4.6 và thêm mục được nguồn xác nhận sau khi QA");
g("D3-03","P1","8 bản đồ, nhưng mới 3 bản đồ có ghi chú chính thức theo phiên bản/chế độ.","Kiểm chứng năm bản đồ còn lại, ghi rõ chế độ và phiên bản, tránh dùng số liệu cũ");
g("D3-04","P1","Wiki C chỉ có 11 hồ sơ vũ khí theo nguồn, không thể mặc định các vũ khí còn lại đều đã xác minh.","Đối chiếu danh mục vũ khí trong Wiki chính và tạo danh sách còn thiếu nguồn");
g("D3-05","P1","16 hướng dẫn thực hành đã có, nhưng đây là hướng dẫn biên tập, không phải nguồn game chính thức.","Gắn cảnh báo phiên bản và internal link tới từng hồ sơ kiểm chứng");
g("D3-06","P1","5 bài D1 đã kiểm tra nguồn, 5 ảnh chưa có hồ sơ quyền sử dụng cụ thể (issue #61).","Chỉ tạo ảnh mới đủ quyền hoặc có giấy phép; không tự xóa D1/R2");
g("D3-07","P2","Bài Beta 4.7 có metadata riêng, nhưng chưa có báo cáo Google Search Console và kết quả truy vấn/index thật.","Đối chiếu GSC theo lịch và kiểm tra sitemap/canonical, không tuyên bố thứ hạng");
g("D3-08","P2","Danh mục tin phiên bản, Esports, cộng đồng tồn tại, nhưng chưa kiểm chứng sự đầy đủ/chất lượng biên tập bằng dữ liệu người dùng.","Kiểm kê danh sách bài công khai của từng danh mục và thời gian cập nhật");
assert.equal(report.wiki.attachments.total,51);
assert.equal(report.wiki.vehicles.total,26);
assert.equal(report.wiki.maps.total,8);
assert.equal(report.wiki.editorialGuides,16);
assert.equal(report.wiki.weapons.officialEvidenceProfiles,11);
if(report.sections.filter(s=>s.http===200).length<7)throw Error("D3.1 public sample lacks seven working sections");
if(!sitemap.ok)throw Error("D3.1 dynamic sitemap unavailable");
fs.mkdirSync("d3-inventory-artifacts",{recursive:true});
fs.writeFileSync("d3-inventory-artifacts/gaps.json",JSON.stringify(report,null,2));
console.log("D3_SOURCE_INVENTORY",JSON.stringify({sections:report.sections.map(s=>({id:s.id,http:s.http,canonical:s.canonical,title:s.title})),
 wiki:report.wiki,sitemap:report.editorial.publishedSitemapUrlCount,gaps:report.gaps.map(g=>g.id)}));
console.log("D3_1_INVENTORY_QA_PASS (scoped sample; not a complete rights or Google indexing audit)");
