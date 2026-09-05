/* TrainingBot public featured posts v173 */
(()=>{
  "use strict";
  const make=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
  const date=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?"":`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;};

  function addStyle(){
    if(document.getElementById("tbFeaturedPostsStyle"))return;
    const style=document.createElement("style");style.id="tbFeaturedPostsStyle";style.textContent=`
.tb-featured-fallback{display:grid;place-items:center;width:100%;height:100%;min-height:160px;background:linear-gradient(135deg,#171b35,#0e3546);color:#c8d2e8;font-size:.78rem;font-weight:900;letter-spacing:.12em}.tb-hero.tb-manual-featured>img,.tb-side-story.tb-manual-featured>img{object-fit:cover}
`;document.head.appendChild(style);
  }

  function image(post){
    if(post.cover_url){const img=document.createElement("img");img.src=post.cover_url;img.alt=post.title||"Ảnh bài viết";return img;}
    return make("div","tb-featured-fallback","TRAININGBOT");
  }

  function mainCard(post){
    const card=make("a","tb-hero tb-live-card tb-manual-featured");card.href=post.url;card.appendChild(image(post));
    const copy=make("div","tb-hero-copy");copy.append(make("span","tb-badge","Tin nổi bật hôm nay"));
    const tagWrap=make("div","");tagWrap.style.marginTop="8px";tagWrap.append(make("span","tb-badge purple",post.category||"Tin mới"));copy.appendChild(tagWrap);
    copy.append(make("h2","",post.title||"Bài viết"),make("p","",post.summary||""));
    const meta=make("div","tb-meta");meta.append(make("span","",date(post.published_at)),make("span","","• TrainingBot"),make("span","","Đọc bài →"));copy.appendChild(meta);card.appendChild(copy);return card;
  }

  function sideCard(post){
    const card=make("a","tb-side-story tb-manual-featured");card.href=post.url;card.appendChild(image(post));
    const copy=make("div","tb-side-story-copy");copy.append(make("span","tb-badge green",post.category||"Tin mới"),make("h3","",post.title||"Bài viết"));
    const meta=make("div","tb-meta");meta.append(make("span","",date(post.published_at).slice(0,5)),make("span","","Đọc bài →"));copy.appendChild(meta);card.appendChild(copy);return card;
  }

  function render(posts){
    const hero=document.querySelector(".tb-hero-grid"),main=hero?.querySelector(".tb-hero"),sideWrap=hero?.querySelector(".tb-side-stories");if(!hero||!main)return;
    const featured=posts.filter(post=>post.featured_at).sort((a,b)=>String(b.featured_at).localeCompare(String(a.featured_at))).slice(0,3);if(!featured.length)return;
    main.replaceWith(mainCard(featured[0]));
    if(sideWrap){const current=[...sideWrap.children];featured.slice(1).forEach((post,index)=>{const node=sideCard(post);if(current[index])current[index].replaceWith(node);else sideWrap.appendChild(node);});}
  }

  async function boot(){
    if(!document.querySelector(".tb-hero-grid"))return;
    try{const response=await fetch("/api/posts?limit=20",{cache:"no-store"});const data=await response.json();if(!response.ok||!data.ok||!Array.isArray(data.posts))return;addStyle();render(data.posts);}catch{}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
