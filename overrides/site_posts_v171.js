/* TrainingBot public manual posts v171 */
(()=>{
  "use strict";
  const make=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
  const date=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?"":`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;};

  function addStyle(){
    if(document.getElementById("tbSitePostsStyle"))return;
    const style=document.createElement("style");
    style.id="tbSitePostsStyle";
    style.textContent=".tb-post-cover-fallback{display:grid;place-items:center;width:100%;height:100%;min-height:150px;background:linear-gradient(135deg,#171b35,#0e3546);color:#aeb9d4;font-size:.78rem;font-weight:900;letter-spacing:.12em}.tb-manual-post-card img{object-fit:cover}";
    document.head.appendChild(style);
  }

  function media(post,className){
    const box=make("div",className);
    if(post.cover_url){const image=document.createElement("img");image.src=post.cover_url;image.alt=post.title||"Ảnh bài viết";box.appendChild(image);}
    else box.appendChild(make("span","tb-post-cover-fallback","TRAININGBOT"));
    return box;
  }

  function homeCard(post){
    const card=make("a","article-card tb-home-article-link tb-manual-post-card");card.href=post.url;
    const cover=media(post,"article-cover tb-home-cover");cover.appendChild(make("span","article-tag",post.category||"TIN MỚI"));
    const body=make("div","article-body");body.append(make("span","article-meta",date(post.published_at).slice(0,5)),make("h3","",post.title),make("p","",post.summary||""));
    card.append(cover,body);return card;
  }

  function newsCard(post){
    const card=make("a","tb-latest-card tb-manual-post-card");card.href=post.url;
    const cover=media(post,"tb-latest-media");cover.appendChild(make("span","tb-badge green",post.category||"Tin mới"));
    const body=make("div","tb-latest-body");body.append(make("h3","",post.title),make("p","",post.summary||""));
    const meta=make("div","tb-meta");meta.append(make("span","",date(post.published_at)),make("span","","Đọc bài →"));body.appendChild(meta);card.append(cover,body);return card;
  }

  function render(posts){
    const home=document.querySelector(".article-grid");
    if(home){posts.slice(0,3).reverse().forEach(post=>home.prepend(homeCard(post)));while(home.children.length>3)home.lastElementChild.remove();}
    const news=document.querySelector(".tb-latest-grid-v157");
    if(news)posts.slice().reverse().forEach(post=>news.prepend(newsCard(post)));
  }

  async function boot(){
    try{
      const response=await fetch("/api/posts?limit=8",{cache:"no-store"});
      const data=await response.json();
      if(!response.ok||!data.ok||!Array.isArray(data.posts)||!data.posts.length)return;
      addStyle();render(data.posts);
    }catch{}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
