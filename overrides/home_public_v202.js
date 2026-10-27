
(()=>{"use strict";
 const flash=document.querySelector(".tb-flash-grid"),mount=document.getElementById("tbFlashMount");
 if(flash&&mount)mount.append(flash);
 document.getElementById("tbHomeSearch")?.addEventListener("click",()=>{const b=document.querySelector('.header-actions button[aria-label="Tìm kiếm"]');if(b)b.click();else location.assign("/wiki");});
 const box=document.getElementById("tbHomeBetaState");
 const render=(h,p)=>{if(!box)return;box.replaceChildren();const b=document.createElement("b");b.textContent=h;const detail=document.createElement("p");detail.textContent=p;const a=document.createElement("a");a.href="/ban-cap-nhat";a.textContent="Xem chi tiết các bản tải →";box.append(b,detail,a);};
 const score=v=>{const n=String(v||"").match(/V?(\d+)\.(\d+)\.(\d+)/i);return n?Number(n[1])*1e6+Number(n[2])*1000+Number(n[3]):0;};
 fetch("/api/beta-versions",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
  if(!data.ok||!Array.isArray(data.versions))throw Error();
  const releases=data.versions.filter(x=>x.status==="released"&&x.download_url).sort((a,b)=>score(b.version)-score(a.version));
  if(!releases.length)return render("Chưa có bản Beta mở tải","Trạng thái lấy từ hệ thống quản lý phiên bản.");
  const v=releases[0],d=new Date(v.updated_at||v.created_at);
  render("PUBG MOBILE BETA "+v.version+" · Đã mở tải",(v.arch||"Android")+" · "+(Number.isNaN(d.getTime())?"Ngày chưa xác minh":new Intl.DateTimeFormat("vi-VN").format(d))+". Xem chi tiết trước khi tải.");
 }).catch(()=>render("Chưa thể kiểm tra bản Beta","Không hiển thị phiên bản mẫu khi dữ liệu chưa sẵn sàng."));
 const grid=document.getElementById("tbHomeArticleGrid");if(!grid)return;
 fetch("/api/posts?limit=3",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
  if(!data.ok||!Array.isArray(data.posts)||!data.posts.length)throw Error();
  const cards=data.posts.slice(0,3).map(post=>{
   const a=document.createElement("a");a.className="article-card tb-home-article-link";a.href=post.url||"/news";
   const cover=document.createElement("div");cover.className="article-cover tb-home-cover";
   if(post.cover_url){const img=document.createElement("img");img.src=post.cover_url;img.alt=post.title||"Ảnh bài viết";img.loading="lazy";cover.append(img);}
   const body=document.createElement("div");body.className="article-body";
   const meta=document.createElement("span");meta.className="article-meta";const date=new Date(post.published_at);meta.textContent=Number.isNaN(date.getTime())?"":new Intl.DateTimeFormat("vi-VN").format(date);
   const h=document.createElement("h3");h.textContent=post.title||"Bài viết mới";const p=document.createElement("p");p.textContent=post.summary||"Đọc bài viết trên TrainingBot";
   body.append(meta,h,p);a.append(cover,body);return a;
  });grid.replaceChildren(...cards);
 }).catch(()=>{const p=document.createElement("p");p.className="tb202-error";p.textContent="Chưa tải được tin mới. ";const a=document.createElement("a");a.href="/news";a.textContent="Mở trang Tin tức →";p.append(a);grid.replaceChildren(p);});
})();
