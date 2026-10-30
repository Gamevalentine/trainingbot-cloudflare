const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

function inline(value){
  return esc(value).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
}

function renderContent(source){
  const lines=String(source||"").replace(/\r/g,"").split("\n");
  const out=[];
  let paragraph=[];
  let list=[];
  const flushParagraph=()=>{if(paragraph.length){out.push(`<p>${paragraph.map(inline).join("<br>")}</p>`);paragraph=[];}};
  const flushList=()=>{if(list.length){out.push(`<ul>${list.map(item=>`<li>${inline(item)}</li>`).join("")}</ul>`);list=[];}};
  for(const raw of lines){
    const line=raw.trim();
    if(!line){flushParagraph();flushList();continue;}
    if(line.startsWith("### ")){flushParagraph();flushList();out.push(`<h3>${inline(line.slice(4))}</h3>`);continue;}
    if(line.startsWith("## ")){flushParagraph();flushList();out.push(`<h2>${inline(line.slice(3))}</h2>`);continue;}
    if(line.startsWith("- ")||line.startsWith("* ")){flushParagraph();list.push(line.slice(2));continue;}
    flushList();paragraph.push(line);
  }
  flushParagraph();flushList();
  return out.join("\n");
}

function safeUrl(value,kind="link"){
  const raw=String(value||"").trim();
  if(!raw)return "";
  // Protocol-relative URLs (//host), backslashes and control bytes can turn
  // ostensibly local editorial links into untrusted cross-origin navigation.
  if(/[\u0000-\u001f\\]/.test(raw))return "";
  if(raw.startsWith("/") && !raw.startsWith("//"))return raw;
  try{
    const url=new URL(raw);
    if(url.username||url.password)return "";
    if(kind==="image" && url.protocol==="https:")return url.href;
    if(kind==="link" && (url.protocol==="https:"||url.protocol==="http:"))return url.href;
  }catch{}
  return "";
}
function safeFontFamily(value){
  const key=String(value||"").replace(/["']/g,"").trim().toLowerCase();
  const fonts={
    "segoe ui":'"Segoe UI",Arial,sans-serif',
    "arial":"Arial,sans-serif",
    "arial black":'"Arial Black","Segoe UI Black",Arial,sans-serif',
    "georgia":"Georgia,serif",
    "tahoma":"Tahoma,Arial,sans-serif",
    "verdana":"Verdana,Arial,sans-serif",
    "trebuchet ms":'"Trebuchet MS",Arial,sans-serif',
    "times new roman":'"Times New Roman",serif'
  };
  return fonts[key]||"";
}
function safeStyle(value,tag){
  const out=[];
  for(const raw of String(value||"").split(";")){
    const [name,...rest]=raw.split(":");
    const prop=String(name||"").trim().toLowerCase();
    const val=rest.join(":").trim().toLowerCase();
    if(!prop||!val)continue;
    if(prop==="font-size" && /^(?:1[0-9]|[2-6][0-9]|7[0-2])px$/.test(val) && ["span","p","h2","h3","h4","li","blockquote"].includes(tag))out.push(`font-size:${val}`);
    if(prop==="font-family" && ["span","p","h2","h3","h4","li","blockquote"].includes(tag)){
      const family=safeFontFamily(val);if(family)out.push(`font-family:${family}`);
    }
    if(prop==="text-align" && /^(left|center|right)$/.test(val) && ["p","h2","h3","h4","blockquote","figure"].includes(tag))out.push(`text-align:${val}`);
    if(prop==="width" && /^(?:[1-9]|[1-9][0-9]|100)%$/.test(val) && tag==="img")out.push(`width:${val}`);
  }
  return out.join(";");
}
function sanitizeRich(input){
  let html=String(input||"").slice(0,120000);
  html=html.replace(/<!--([\s\S]*?)-->/g,"");
  html=html.replace(/<(script|style|iframe|object|embed|svg|math|form|button|input|textarea|select|option)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,"");
  html=html.replace(/<(script|style|iframe|object|embed|svg|math|form|button|input|textarea|select|option)\b[^>]*\/?>/gi,"");
  const allowed=new Set(["p","br","h2","h3","h4","strong","b","em","i","u","s","ul","ol","li","blockquote","span","img","figure","figcaption","a","hr"]);
  return html.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g,(full,rawTag,rawAttrs)=>{
    const tag=String(rawTag||"").toLowerCase();
    if(!allowed.has(tag))return "";
    if(/^<\//.test(full))return `</${tag}>`;
    if(tag==="br"||tag==="hr")return `<${tag}>`;
    const attrs={};
    String(rawAttrs||"").replace(/([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/g,(_,name,a,b,c)=>{
      attrs[String(name||"").toLowerCase()]=a??b??c??"";
      return "";
    });
    const out=[];
    const style=safeStyle(attrs.style,tag);
    if(style)out.push(`style="${esc(style)}"`);
    if(tag==="img"){
      const src=safeUrl(attrs.src,"image");
      if(!src)return "";
      out.push(`src="${esc(src)}"`,`alt="${esc(attrs.alt||"")}"`,'loading="lazy"','decoding="async"');
    }else if(tag==="a"){
      const href=safeUrl(attrs.href,"link");
      if(href)out.push(`href="${esc(href)}"`,'target="_blank"','rel="noopener noreferrer"');
    }else if(attrs.title){
      out.push(`title="${esc(attrs.title)}"`);
    }
    return `<${tag}${out.length?" "+out.join(" "):""}>`;
  });
}

function dateVi(value){
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return "";
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

const ORIGIN="https://trainingbot.io.vn";
function absoluteUrl(value,fallback=""){
  try{
    const url=new URL(String(value||fallback),ORIGIN);
    return /^https?:$/.test(url.protocol)?url.href:fallback;
  }catch{return fallback;}
}
function isoDate(value){
  const d=new Date(value);
  return Number.isNaN(d.getTime())?"":d.toISOString();
}


function articleExcerpt(post){
 const text=String(post.summary||post.content||post.rich_content||"").replace(/<[^>]*>/g," ").replace(/^#{1,6}\s+/gm,"").replace(/\*\*/g,"").replace(/\s+/g," ").trim();
 if(text.length<=165)return text;
 const cut=text.slice(0,163),end=Math.max(cut.lastIndexOf(". "),cut.lastIndexOf("? "),cut.lastIndexOf("! "));
 if(end>=90)return cut.slice(0,end+1);
 const space=cut.lastIndexOf(" ");return (space>=90?cut.slice(0,space):cut)+"…";
}
const VERIFIED_EDITORIAL_SOURCES = {
  "battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2": {
    "status": "ĐÍNH CHÍNH — bài cũ trộn dữ liệu PUBG PC với PUBG Mobile",
    "note": "Frost Zone Bomb, Thermal Protection Suit, Satellite Crash với sát thương 10–14 HP/giây và bán kính 20 m thuộc bản PUBG: BATTLEGROUNDS 39.2 (PC/console, 01/2026). PUBG Mobile Beta Test 2 ngày 10/10/2026 công bố Erangel Subzero nhưng danh sách cơ chế khác. Chưa xác minh được tên bản build Mobile 'Beta 4.7.2' là tên phát hành chính thức.",
    "refs": [
      {
        "label": "PUBG: BATTLEGROUNDS — Patch Notes Update 39.2 (PC/console)",
        "url": "https://www.pubg.com/en/news/9635"
      },
      {
        "label": "PUBG Mobile — V4.7 Beta Test 2 Update Announcement",
        "url": "https://www.pubgmobile.com/en-US/news-detail.shtml?from=news&gid=om6ct49bmmb2wvz95pl2t8lu&pid=om6ct49bmmb2wvz95pl2t8lu_en"
      },
      {
        "label": "Nội dung chi tiết thông báo Beta Test 2 (bản lưu)",
        "url": "https://event.bittopup.com/news/v4-7-beta-test-2-update-announcement"
      }
    ]
  },
  "pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y": {
    "status": "ĐÃ ĐỐI CHIẾU — thông báo Beta Test 1, chưa phải bản chính thức",
    "note": "Vật phẩm hồi phục, Battle Ready Kit, camera phương tiện và Staged Reload được nêu trong thông báo Beta 1 ngày 23/09/2026. Kết quả thử nghiệm không bảo đảm tính năng giữ nguyên khi phát hành.",
    "refs": [
      {
        "label": "PUBG Mobile — mục thông báo phiên bản (23/09/2026)",
        "url": "https://www.pubgmobile.com/en-US/news.shtml"
      },
      {
        "label": "Thông báo V4.7 Beta Test 1 (bản lưu nội dung)",
        "url": "https://event.bittopup.com/news/v4-7-beta-test-1-update-announcement"
      }
    ]
  },
  "pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin": {
    "status": "XÁC MINH MỘT PHẦN — nhà phát hành thông báo đang phát triển",
    "note": "Lời công bố M416 Glacier Switch Effect 'almost done' xuất hiện trên tài khoản PUBG MOBILE Global, được DearPlayers lưu lại. Chưa có bằng chứng từ nguồn này xác nhận ngày ra mắt, điều kiện mở khóa hoặc áp dụng tại Việt Nam. DearPlayers là trang lưu lại, không phải chính website nhà phát hành.",
    "refs": [
      {
        "label": "PUBG MOBILE Global — bản lưu thông báo M416 Glacier trên DearPlayers",
        "url": "https://www.dearplayers.com/en-US/updates/pubg-mobile-global/2102005997917417884"
      }
    ]
  },
  "pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi": {
    "status": "ĐÃ XÁC MINH NGÀY CẬP NHẬT VÀ CHẾ ĐỘ; thông số phụ chưa đối chiếu",
    "note": "Nhà phát hành PUBG MOBILE Việt Nam thông báo bắt đầu đợt cập nhật 4.6 từ 08/09/2026, hoàn tất dự kiến trước 11:00 UTC ngày 09/09. Giờ 07:00 UTC và dung lượng 1,16 GB/3,50 GB trong nội dung cũ chưa được xác nhận từ thông báo được dẫn; chỉ tham khảo theo thời điểm đăng.",
    "refs": [
      {
        "label": "PUBG MOBILE Việt Nam — Thông báo cập nhật phiên bản 4.6",
        "url": "https://pubgm.vnggames.com/tin-tuc/thong-bao-cap-nhat/thong-bao-cap-nhat-phien-ban-4-6.html"
      },
      {
        "label": "Level Infinite — thông cáo PUBG MOBILE 4.6 Midnight Hunters",
        "url": "https://press.levelinfinite.com/en/PUBG-MOBILE-UNLEASHES-A-VAMPIRE-UPRISING-WITH-MIDNIGHT-HUNTERS-MODE-IN"
      }
    ]
  },
  "pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel-tu-ngay-20-9": {
    "status": "ĐÃ XÁC MINH — sự kiện hợp tác theo mốc thời gian đã qua",
    "note": "Website anime One-Punch Man chính thức xác nhận sự kiện 20/09–19/10/2026 (ngày giờ Nhật Bản khác một phần theo múi giờ). Đây là lịch sử sự kiện, không phải lời mời tham gia sự kiện đang diễn ra.",
    "refs": [
      {
        "label": "Website anime One-Punch Man — thông báo PUBG MOBILE collaboration",
        "url": "https://onepunchman-anime.net/news/archives/7790"
      }
    ]
  }
};
const EDITORIAL_CORRECTION_SLUG = "battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2";
const EDITORIAL_CORRECTION_TITLE = "ĐÍNH CHÍNH: Erangel Subzero của PUBG Mobile Beta 4.7 khác PUBG PC Update 39.2";
const EDITORIAL_CORRECTION_BODY = "## Đính chính ngày 29/10/2026\n\nBài đăng trước đó đã gắn nhầm nội dung của PUBG: BATTLEGROUNDS (PC/console), bản 39.2 tháng 01/2026, vào tên PUBG Mobile/BGMI Beta 4.7.2. TrainingBot xin đính chính và không sử dụng các thông số PC này như thông số của PUBG Mobile.\n\n## Phần nào thuộc PUBG PC 39.2?\n\n- Satellite Crash xuất hiện bốn lần trong một trận, cầu Blue Zone 10 sát thương/giây; Frost Zone Bomb có bán kính tối đa 20 mét và gây 14 sát thương/giây; Thermal Protection Suit và các điều chỉnh thời tiết whiteout đều được ghi trong thông báo chính thức PUBG: BATTLEGROUNDS Update 39.2 ngày 06/01/2026.\n\n- Các chi tiết này không được phép mặc nhiên áp dụng cho PUBG Mobile hoặc BGMI dù có một số tên tính năng tương tự.\n\n## PUBG Mobile Beta Test 2 công bố điều gì?\n\n- Thông báo Beta Test 2 ngày 10/10/2026 giới thiệu chế độ Erangel Subzero dưới dạng Classic Mode spin-off, bối cảnh các vệ tinh Tythonic rơi xuống Erangel làm khí hậu lạnh đi.\n\n- Các mục được nêu gồm Stalber bị đóng băng, Liquid Nitrogen Tanks, Snow Mist Ammo, snowboard, snowmobile/snowbike, G36C và lốp chống trượt. Đây là dữ liệu Beta, có thể thay đổi trước khi phát hành.\n\n## Về tên phiên bản và nguồn\n\n- Nguồn chính thức đang đối chiếu gọi đợt này là V4.7 Beta Test 2; chưa có cơ sở xác nhận mọi chi tiết trong bài cũ thuộc một bản PUBG Mobile có tên chính thức 'Beta 4.7.2'.\n\n- Xem liên kết đến thông báo PUBG PC và PUBG Mobile trong mục Nguồn đối chiếu bên dưới.\n\n## Trách nhiệm biên tập\n\nTrainingBot giữ nguyên đường dẫn để người đọc và công cụ tìm kiếm truy cập thông tin đính chính, đồng thời hiển thị bản đính chính thay cho nội dung sai. Bản gốc cần được lưu riêng để đối chiếu lịch sử và khôi phục khi có quyền quản trị.";
export const ERANGEL_D1_CORRECTION = Object.freeze({
 slug:EDITORIAL_CORRECTION_SLUG,
 title:EDITORIAL_CORRECTION_TITLE,
 summary:"Đính chính: các thông số Frost Zone Bomb, Satellite Crash và Thermal Protection Suit trong bài cũ thuộc PUBG PC Update 39.2. Xem riêng thông tin Beta PUBG Mobile 4.7.",
 content:EDITORIAL_CORRECTION_BODY,
 rich_content:"",
 cover_url:""
});
export function isStoredErangelCorrection(post){
 return !!post && String(post.slug)===ERANGEL_D1_CORRECTION.slug &&
 post.title===ERANGEL_D1_CORRECTION.title &&
 post.summary===ERANGEL_D1_CORRECTION.summary &&
 post.content===ERANGEL_D1_CORRECTION.content &&
 String(post.rich_content||"")==="" && String(post.cover_url||"")==="";
}
// LIC-04: only these five editorial articles use new, self-authored
// illustration SVGs. Originals remain untouched in D1/R2 for evidence and
// safe rollback; the public view substitutes the images at render time.
const LIC04_SAFE_ART=Object.freeze({
 "battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2": "/editorial-original-erangel.svg",
 "pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y": "/editorial-original-beta-47.svg",
 "pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin": "/editorial-original-m416-glacier.svg",
 "pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi": "/editorial-original-midnight-hunters.svg",
 "pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel-tu-ngay-20-9": "/editorial-original-one-punch-man.svg"
});
function verifiedArticleView(post){
 const view=String(post.slug)!==EDITORIAL_CORRECTION_SLUG
  ? post
  : (isStoredErangelCorrection(post)?post:{...post,...ERANGEL_D1_CORRECTION,updated_at:"2026-10-29"});
 const replacement=LIC04_SAFE_ART[String(view.slug)];
 return replacement?{...view,cover_url:replacement}:view;
}
function verifiedSourcePanel(post){
 const audit=VERIFIED_EDITORIAL_SOURCES[String(post.slug)];
 if(!audit)return "";
 const refs=audit.refs.map(ref=>'<li><a target="_blank" rel="noopener noreferrer" href="'+esc(ref.url)+'">'+esc(ref.label)+'</a></li>').join("");
 return '<section class="tb-p1-box tb-source-verification" aria-label="Nguồn đối chiếu đã kiểm tra"><h2>Nguồn đối chiếu &amp; trạng thái kiểm chứng</h2>'+
  '<p><strong>'+esc(audit.status)+'</strong></p><p>'+esc(audit.note)+'</p><ul>'+refs+'</ul></section>';
}
function articleSources(post){
 const vetted=verifiedSourcePanel(post);
 if(vetted)return vetted;
 const found=new Set(),content=String(post.content||"")+" "+String(post.rich_content||"");
 for(const raw of content.match(/https?:\/\/[^\s<>"')\]]+/g)||[]){
   try{const u=new URL(raw.replace(/[.,;]+$/,""));if((u.protocol==="https:"||u.protocol==="http:")&&!u.username&&!u.password&&u.hostname!=="trainingbot.io.vn")found.add(u.href);}catch{}
   if(found.size>=8)break;
 }
 if(!found.size)return '<section class="tb-p1-box"><h2>Nguồn tham khảo</h2><p>Chưa có liên kết nguồn trực tiếp để đối chiếu nội dung bài viết.</p></section>';
 return '<section class="tb-p1-box"><h2>Nguồn được bài viết dẫn</h2><ul>'+
 [...found].map(u=>'<li><a target="_blank" rel="noopener noreferrer nofollow" href="'+esc(u)+'">'+esc(new URL(u).hostname)+'</a></li>').join("")+
 '</ul></section>';
}
function articleRelated(rows){
 const posts=(rows||[]).filter(p=>/^[a-z0-9-]{1,110}$/.test(String(p.slug||""))).slice(0,3);
 if(!posts.length)return "";
 return '<aside class="tb-p1-box"><h2>Bài viết liên quan</h2><ul>'+
 posts.map(p=>'<li><a href="/bai-viet/'+encodeURIComponent(p.slug)+'">'+esc(String(p.slug)===EDITORIAL_CORRECTION_SLUG?EDITORIAL_CORRECTION_TITLE:(p.title||"Bài viết"))+'</a></li>').join("")+'</ul></aside>';
}
function editorialVersionLinks(post){
  // Only a verified older Beta article gets a cross-version reading trail.
  // Do not imply that an old test build is currently the live game version.
  if(post.slug!=="pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y")return "";
  return '<aside class="tb-p1-box" aria-label="Đọc tiếp theo phiên bản">'+
   '<h2>Đọc tiếp theo phiên bản</h2>'+
   '<p>Bài này ghi nhận thông tin ở giai đoạn Beta 1; nội dung thử nghiệm có thể thay đổi. Đối chiếu thêm nguồn và ngày đăng trước khi áp dụng cho phiên bản hiện tại.</p>'+
   '<ul><li><a href="/news-pubg-mobile-4-6-skins-events">Lịch trang phục và sự kiện PUBG Mobile 4.6 (tham khảo lịch cũ)</a></li>'+
   '<li><a href="/ban-cap-nhat">Xem trang Bản cập nhật TrainingBot</a></li>'+
   '<li><a href="/wiki">Tra cứu Wiki với nhãn xác minh theo nguồn</a></li></ul></aside>';
}
function editorialArchiveContext(post){
  // Editorial navigation is tied to known archived story slugs, not guessed releases.
  // Do not assert that earlier Beta notes are the live version.
  const links={
    "battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2":{
      note:"Bài cũ đã bị đính chính vì trộn thông số PUBG PC 39.2 vào PUBG Mobile Beta. Phần đính chính hiển thị ở trên cùng cùng liên kết đối chiếu nguồn gốc.",
      refs:[["/bai-viet/pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y","Đọc lại thông tin Beta 4.7 giai đoạn 1"],["/wiki","Tra cứu Wiki và tình trạng xác minh dữ liệu"]]
    },
    "pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi":{
      note:"Từ 'hôm nay' trong tiêu đề đề cập ngày đăng bài 08/09/2026, không phải thời điểm hiện tại. Bài lưu lại đợt cập nhật 4.6 để người đọc đối chiếu lịch sử.",
      refs:[["/news-pubg-mobile-4-6","Đọc hướng dẫn PUBG Mobile 4.6"],["/ban-cap-nhat","Xem trang Bản cập nhật"]]
    },
    "pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel-tu-ngay-20-9":{
      note:"Bài đề cập lịch sự kiện ngày 20/09/2026 tại thời điểm đăng. Không hiểu ngày trong tiêu đề là lịch sự kiện hiện tại; thông tin và khu vực phát hành nên đối chiếu với thông báo trong game.",
      refs:[["/news-pubg-mobile-4-6-skins-events","Xem lịch sự kiện 4.6 đã lưu"],["/ban-cap-nhat","Xem trang Bản cập nhật"]]
    },
    "pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin":{
      note:"Trạng thái 'gần hoàn thiện' phản ánh thông tin tại thời điểm bài được đăng; bài chưa có liên kết gốc trực tiếp để xác minh ngày phát hành và khu vực áp dụng. Không xem đây là xác nhận hiệu ứng đã ra mắt tại Việt Nam.",
      refs:[["/news-featured","Xem các bài viết đã xuất bản"],["/ban-cap-nhat","Theo dõi bản cập nhật"]]
    }
  };
  const item=links[String(post.slug||"")];
  if(!item)return "";
  return '<aside class="tb-p1-box" aria-label="Bối cảnh lịch sử và bài liên quan"><h2>Bối cảnh bài viết</h2><p>'+esc(item.note)+'</p><ul>'+
    item.refs.map(([url,label])=>'<li><a href="'+esc(url)+'">'+esc(label)+'</a></li>').join("")+
    '</ul></aside>';
}
function articleHasHeading(post){
 return /<h2\b/i.test(String(post.rich_content||""))||/^##\s/m.test(String(post.content||""));
}

function page(post,related=[]){
 const excerpt=articleExcerpt(post);
  const canonical=`${ORIGIN}/bai-viet/${encodeURIComponent(post.slug)}`;
  const safeCover=safeUrl(post.cover_url,"image");
  const shareImage=absoluteUrl(safeCover,`${ORIGIN}/news-pubg-mobile-4-6-cover.webp`);
  const published=isoDate(post.published_at);
  const modified=isoDate(post.updated_at)||published;
  const cover=safeCover?`<img class="tb-cover" src="${esc(safeCover)}" alt="${esc(post.title)}">`:"";
  const graph={
    "@context":"https://schema.org",
    "@graph":[
      {"@type":"Organization","@id":ORIGIN+"/#organization","name":"TrainingBot","url":ORIGIN+"/","logo":{"@type":"ImageObject","url":ORIGIN+"/favicon.svg"}},
      {"@type":"WebSite","@id":ORIGIN+"/#website","url":ORIGIN+"/","name":"TrainingBot","publisher":{"@id":ORIGIN+"/#organization"},"inLanguage":"vi-VN"},
      {"@type":"NewsArticle","@id":canonical+"#article","mainEntityOfPage":canonical,"headline":post.title,"description":excerpt,"image":[shareImage],"datePublished":published||undefined,"dateModified":modified||undefined,"author":{"@id":ORIGIN+"/#organization"},"publisher":{"@id":ORIGIN+"/#organization"},"inLanguage":"vi-VN"}
    ]
  };
  const jsonLd=JSON.stringify(graph).replace(/</g,"\\u003c");
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(excerpt)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:site_name" content="TrainingBot">
<meta property="og:locale" content="vi_VN">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(excerpt)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(shareImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(post.title)}">
<meta name="twitter:description" content="${esc(excerpt)}">
<meta name="twitter:image" content="${esc(shareImage)}">
${published?`<meta property="article:published_time" content="${esc(published)}">`:""}
${modified?`<meta property="article:modified_time" content="${esc(modified)}">`:""}
<title>${esc(post.title)} — TrainingBot</title>
<script type="application/ld+json">${jsonLd}</script>
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/mobile_polish_v62.css?v=62">
<link rel="stylesheet" href="/brand_logo_v116.css?v=116">
<link rel="stylesheet" href="/navigation_v124.css?v=124">
<link rel="stylesheet" href="/header_search_v152.css?v=152">
<style>
.tb-user-article{padding:44px 0 72px}.tb-user-wrap{max-width:900px;margin:auto}.tb-user-tag{display:inline-flex;padding:7px 12px;border:1px solid rgba(118,92,255,.28);border-radius:999px;color:#b9b2ff;font-size:.76rem;font-weight:800}.tb-user-wrap h1{max-width:850px;margin:16px 0 12px;font-size:clamp(1.8rem,3.6vw,2.8rem);line-height:1.08;letter-spacing:-.035em}.tb-user-lead{max-width:790px;color:#b9c3d5;font-size:1rem;line-height:1.7}.tb-user-meta{margin-top:12px;color:#7f8ba3;font-size:.84rem}.tb-cover{display:block;width:100%;max-height:520px;object-fit:cover;margin:28px 0;border-radius:18px;border:1px solid rgba(148,163,184,.18)}.tb-user-story{max-width:790px;display:grid;gap:15px;color:#d9e0ee;font-family:"Segoe UI",Tahoma,Arial,sans-serif;font-size:1rem;font-weight:400;line-height:1.82}.tb-user-story h2,.tb-user-story h3,.tb-user-story h4{color:#fff;font-family:"Arial Black","Segoe UI Black","Segoe UI",Arial,sans-serif;font-weight:900;line-height:1.2;letter-spacing:-.025em}.tb-user-story h2{margin:42px 0 16px;padding:13px 16px 14px 18px;border-left:4px solid #765cff;border-radius:0 12px 12px 0;background:linear-gradient(90deg,rgba(118,92,255,.16),rgba(118,92,255,.035) 72%,transparent);box-shadow:inset 0 0 0 1px rgba(118,92,255,.08);font-size:clamp(1.85rem,3.35vw,2.35rem)}.tb-user-story h3{margin:32px 0 11px;padding-left:13px;border-left:3px solid rgba(42,203,234,.72);font-size:clamp(1.46rem,2.45vw,1.82rem)}.tb-user-story h4{margin:25px 0 8px;font-size:1.23rem}.tb-user-story strong,.tb-user-story b{color:#fff;font-family:"Segoe UI Semibold","Segoe UI",Arial,sans-serif;font-weight:800}.tb-user-story p,.tb-user-story ul,.tb-user-story ol,.tb-user-story blockquote,.tb-user-story figure{margin:0}.tb-user-story ul,.tb-user-story ol{padding-left:24px}.tb-user-story blockquote{padding:12px 16px;border-left:3px solid rgba(116,92,255,.8);background:rgba(116,92,255,.08);border-radius:10px}.tb-user-story figure{display:grid;justify-items:center;gap:8px}.tb-user-story img{display:block;max-width:100%;height:auto;border-radius:14px}.tb-user-story figcaption{color:#8d9ab0;font-size:.82rem;text-align:center}.tb-back{display:inline-flex;margin-top:30px;color:#9fb0ca;font-weight:750}@media(max-width:640px){.tb-user-article{padding:30px 0 52px}.tb-cover{margin:22px 0;border-radius:14px}.tb-user-story{font-size:.96rem;line-height:1.76}.tb-user-story h2{margin-top:34px;padding:11px 12px 12px 14px;font-size:1.62rem}.tb-user-story h3{margin-top:27px;font-size:1.32rem}}
.tb-p1-box{margin:24px 0 0;padding:18px 21px;border:1px solid #32435e;background:#111b2c;border-radius:14px}.tb-p1-box h2{margin:0 0 10px;font-size:1.14rem;color:#fff}.tb-p1-box li{padding:4px 0}.tb-p1-box p{color:#acbad2}.tb-p1-box a{color:#bbcdff;text-decoration:underline;overflow-wrap:anywhere}
</style>
</head>
<body>
<header class="site-header"><div class="container header-inner"><a class="brand" href="/"><span class="brand-logo"></span><span>TRAININGBOT<small>Gaming Knowledge Hub</small></span></a><nav class="desktop-nav" aria-label="Điều hướng chính"><a class="nav-link" href="/">Trang chủ</a><a class="nav-link" href="/ban-cap-nhat">Bản cập nhật</a><a class="nav-link active" href="/news">Tin tức</a><a class="nav-link" href="/wiki">Wiki</a><a class="nav-link" href="/community">Cộng đồng</a><a class="nav-link" href="/contact">Liên hệ</a></nav><div class="header-actions"><button class="icon-button" aria-label="Tìm kiếm"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3-3"></path></svg></button><button class="menu-button" aria-label="Mở menu" aria-expanded="false"><span></span><span></span><span></span></button></div></div><nav class="mobile-nav" aria-label="Điều hướng di động"></nav></header>
<main class="tb-user-article"><article class="container tb-user-wrap"><span class="tb-user-tag">${esc(post.category)}</span><h1>${esc(post.title)}</h1><p class="tb-user-lead">${esc(excerpt)}</p><div class="tb-user-meta">${dateVi(post.published_at)} · TrainingBot</div>${cover}<div class="tb-user-story">${articleHasHeading(post)?"":"<h2>Nội dung bài viết</h2>"}${post.rich_content?sanitizeRich(post.rich_content):renderContent(post.content)}</div>${articleSources(post)}${editorialVersionLinks(post)}${editorialArchiveContext(post)}${articleRelated(related)}<a class="tb-back" href="/news">← Quay lại Tin tức</a></article></main>
<footer><div class="container footer-inner"><span>© 2026 TrainingBot.</span><div class="footer-links"><a href="/terms">Điều khoản</a><a href="/privacy">Quyền riêng tư</a></div></div></footer>
<script defer src="/navigation_v124.js?v=124"></script>
<script defer src="/header_search_v152.js?v=182"></script>
<script defer src="/visitor_tracking_v177.js?v=181"></script>
<script defer src="/footer_v135.js?v=178"></script>
</body></html>`;
}

export async function onRequestGet({env,params}){
  if(!env.DB)return new Response("Dữ liệu bài viết chưa sẵn sàng.",{status:503});
  const slug=String(params.slug||"").toLowerCase();
  if(!/^[a-z0-9-]{1,110}$/.test(slug))return new Response("Không tìm thấy bài viết.",{status:404});
  const post=await env.DB.prepare("SELECT slug,title,summary,content,rich_content,category,cover_url,published_at,updated_at FROM tb_manual_posts_v1 WHERE slug=? AND status='published' LIMIT 1").bind(slug).first();
  if(!post)return new Response("Không tìm thấy bài viết.",{status:404});
  let related=[];
  try{
    const q=await env.DB.prepare("SELECT slug,title FROM tb_manual_posts_v1 WHERE status='published' AND slug!=? AND category=? ORDER BY published_at DESC LIMIT 3").bind(slug,post.category).all();
    related=q.results||[];
  }catch(error){console.error("Related posts unavailable",error);}
  return new Response(page(verifiedArticleView(post),related),{status:200,headers:{"content-type":"text/html; charset=UTF-8","cache-control":"public, max-age=30, stale-while-revalidate=120","x-content-type-options":"nosniff"}});
}
