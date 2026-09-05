/* TrainingBot Admin - feature posts in News v173 */
(()=>{
  "use strict";
  const TOKEN_KEYS=["tb-admin-center-token-v2","tb-admin-center-token-v1","tb-cloud-admin-token-v40","tb-cloud-admin-token-v39"];
  const token=()=>TOKEN_KEYS.map(key=>sessionStorage.getItem(key)).find(Boolean)||"";
  let posts=new Map();

  function style(){
    if(document.getElementById("tbPostFeatureStyle"))return;
    const node=document.createElement("style");node.id="tbPostFeatureStyle";node.textContent=`
.tb-post-feature{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 11px;border:1px solid rgba(59,130,246,.32);border-radius:9px;background:rgba(59,130,246,.09);color:#bfdbfe;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap}.tb-post-feature.active{border-color:rgba(34,197,94,.34);background:rgba(34,197,94,.1);color:#bbf7d0}.tb-post-feature:disabled{opacity:.55;cursor:wait}@media(max-width:720px){.tb-post-row-actions{grid-template-columns:1fr 1fr 1fr!important}.tb-post-feature{width:100%;box-sizing:border-box}}
`;document.head.appendChild(node);
  }

  async function api(options={}){
    const headers=new Headers(options.headers||{});headers.set("Authorization",`Bearer ${token()}`);if(options.body)headers.set("Content-Type","application/json");
    const response=await fetch("/api/v71/admin/posts",{...options,headers,cache:"no-store"});
    const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.message||"Không cập nhật được bài viết.");return data;
  }

  function decorate(){
    document.querySelectorAll("button[data-delete-post]").forEach(del=>{
      const id=del.dataset.deletePost;if(!id)return;const actions=del.closest(".tb-post-row-actions");if(!actions)return;
      let button=actions.querySelector(`[data-feature-post="${CSS.escape(id)}"]`);
      const post=posts.get(id);const active=!!post?.featured_at;
      if(!button){button=document.createElement("button");button.type="button";button.className="tb-post-feature";button.dataset.featurePost=id;actions.insertBefore(button,del);}
      button.classList.toggle("active",active);button.textContent=active?"Gỡ khỏi Tin tức":"Đẩy lên Tin tức";button.dataset.featured=active?"1":"0";
    });
  }

  async function load(){
    try{const data=await api();posts=new Map((data.posts||[]).map(post=>[post.id,post]));decorate();}catch{}
  }

  async function toggle(button){
    const id=button.dataset.featurePost,active=button.dataset.featured==="1";if(!id)return;
    button.disabled=true;button.textContent=active?"Đang gỡ…":"Đang đẩy…";
    try{await api({method:"PATCH",body:JSON.stringify({id,featured:!active})});await load();}
    catch(error){alert(error.message||"Không cập nhật được bài viết.");button.disabled=false;decorate();}
  }

  document.addEventListener("click",event=>{const button=event.target.closest("button[data-feature-post]");if(button)toggle(button);});
  style();
  const observer=new MutationObserver(()=>decorate());observer.observe(document.documentElement,{childList:true,subtree:true});
  let tries=0;const boot=()=>{load();if(++tries<20)setTimeout(boot,500);};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
