/* A verified Admin session may label ONLY this browser's persistent anonymous visitor ID.
 * The server label is analytics metadata, not Admin login access.
 */
(()=>{
  "use strict";
  const ID_KEY="tb-visitor-id-v1";
  const TOKEN_KEYS=["tb-admin-center-token-v2","tb-admin-center-token-v1","tb-cloud-admin-token-v40","tb-cloud-admin-token-v39"];
  const VALID=/^[A-Za-z0-9_-]{8,80}$/;
  const url="/api/v72/admin/browser-label";
  const el=id=>document.getElementById(id);
  let doneToken="",blockedToken="",suppressedToken="",busy=false,verified=false;
  let notice="Chỉ nhận diện sau khi đăng nhập Admin.";
  function token(){
    try{return TOKEN_KEYS.map(key=>sessionStorage.getItem(key)).find(Boolean)||"";}catch{return "";}
  }
  function ownId(){
    try{
      let id=localStorage.getItem(ID_KEY)||"";
      if(VALID.test(id))return id;
      // Match the anonymous ID that the public tracker reads on this origin.
      if(!crypto?.randomUUID)throw Error("No cryptographically secure ID generator");
      id=crypto.randomUUID().replace(/-/g,"");
      localStorage.setItem(ID_KEY,id);
      return id;
    }catch{return "";}
  }
  function panel(){
    const root=el("tbVisitorPanel");
    if(!root)return;
    let display=el("tbAdminBrowserLabel");
    if(!display){
      const head=root.querySelector(".tb-vis-head");
      if(!head)return;
      display=document.createElement("section");
      display.id="tbAdminBrowserLabel";
      display.setAttribute("aria-label","Nhãn trình duyệt quản trị");
      display.style.cssText="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:0 0 10px;padding:10px 12px;border:1px solid #29415a;border-radius:11px;background:#111e2f";
      display.innerHTML='<strong id="tbAdminBrowserState" style="color:#a5f3fc;font-size:12px">Đang kiểm tra...</strong><button id="tbAdminBrowserAction" type="button" style="background:#182b42;border:1px solid #3a526d;border-radius:9px;color:#e5f1ff;cursor:pointer;padding:7px 10px;font-size:11px">Xác nhận</button><span id="tbAdminBrowserHint" style="color:#9caabd;font-size:10px"></span>';
      head.after(display);
      el("tbAdminBrowserAction")?.addEventListener("click",async()=>{
        if(busy)return;
        if(verified)await update(true);
        else{blockedToken="";suppressedToken="";await update(false);}
      });
    }
    const state=el("tbAdminBrowserState"),action=el("tbAdminBrowserAction"),hint=el("tbAdminBrowserHint");
    if(!state||!action||!hint)return;
    state.textContent=verified?"✓ Trình duyệt này: Admin":busy?"Đang xác minh Admin…":"Trình duyệt này: chưa gắn nhãn";
    action.textContent=verified?"Bỏ nhãn Admin":"Đánh dấu Admin";
    action.disabled=busy||!token();
    hint.textContent=notice;
  }
  async function update(remove=false){
    const auth=token();
    if(!auth||busy)return;
    const id=ownId();
    if(!id){
      blockedToken=auth;
      notice="Không đọc được mã trình duyệt. Hãy bật lưu trữ của website.";
      panel();return;
    }
    busy=true;notice="Đang xác thực với máy chủ…";panel();
    try{
      const res=await fetch(url,{
        method:remove?"DELETE":"POST",
        headers:{"Content-Type":"application/json",Authorization:"Bearer "+auth},
        body:JSON.stringify({visitorId:id}),
        cache:"no-store",credentials:"same-origin"
      });
      const body=await res.json().catch(()=>({}));
      if(!res.ok||body.ok!==true)throw Error(body.message||"Yêu cầu bị từ chối ("+res.status+").");
      verified=!remove;
      if(remove){suppressedToken=auth;doneToken="";}
      else{doneToken=auth;suppressedToken="";}
      blockedToken="";
      notice=remove?"Đã bỏ nhãn; lần đăng nhập Admin này sẽ không tự gắn lại.":"Đã xác minh qua đăng nhập Admin; các trang công khai dùng chung mã khách này.";
      // Refresh reports to immediately show the Admin classification.
      el("tbVisitorRefresh")?.click();
    }catch(err){
      blockedToken=auth;
      notice=String(err.message||"Không xác minh được");
    }finally{busy=false;panel();}
  }
  function tick(){
    panel();
    const auth=token();
    if(!auth){doneToken="";blockedToken="";verified=false;notice="Đăng nhập Admin để xác nhận máy này.";return;}
    if(!busy&&auth!==doneToken&&auth!==blockedToken&&auth!==suppressedToken)void update(false);
  }
  tick();
  setInterval(tick,3500);
})();
