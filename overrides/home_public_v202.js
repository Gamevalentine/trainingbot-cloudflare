
(()=>{"use strict";
 document.getElementById("tbHomeSearch")?.addEventListener("click",()=>{const b=document.querySelector('.header-actions button[aria-label="Tìm kiếm"]');if(b)b.click();else location.assign("/wiki");});
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
