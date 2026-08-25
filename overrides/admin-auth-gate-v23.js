(() => {
  "use strict";
  const SENTINEL = "SESSION_V23";
  const LEGACY_KEYS = ["tb-admin-center-token-v2","tb-admin-center-token-v1","tb-cloud-admin-token-v40","tb-cloud-admin-token-v39"];
  const $ = id => document.getElementById(id);
  const setSentinel = () => LEGACY_KEYS.forEach(k => sessionStorage.setItem(k,SENTINEL));
  const clearSentinel = () => LEGACY_KEYS.forEach(k => sessionStorage.removeItem(k));
  let state = {linked:false,authenticated:false,username:"admin"};

  async function api(path,payload){
    const r=await fetch(path,{method:payload===undefined?"GET":"POST",credentials:"same-origin",cache:"no-store",headers:payload===undefined?{}:{"Content-Type":"application/json"},body:payload===undefined?undefined:JSON.stringify(payload)});
    const data=await r.json().catch(()=>({}));
    if(!r.ok||data.ok===false){const e=new Error(data.message||`Xác thực thất bại (${r.status}).`);e.status=r.status;throw e}
    return data;
  }
  function notice(message,type=""){
    const n=$("loginNotice");if(!n)return;n.className=`notice ${type}`;n.textContent=message||"";
  }
  function linkedUi(linked){
    state.linked=!!linked;
    $("otpLoginGroup")?.classList.toggle("hidden",!linked);
    $("bootstrapTokenGroup")?.classList.toggle("hidden",linked);
    const btn=$("loginSubmit");if(btn)btn.innerHTML=linked?'Vào Admin Center <span>→</span>':'Liên kết thiết bị & bật 2FA <span>→</span>';
  }
  function showSetup(data){
    $("loginForm")?.classList.add("hidden");$("totpSetup")?.classList.remove("hidden");
    $("totpSecret").textContent=data.secret||"—";
    $("totpAccountHint").textContent=`${data.issuer||"TrainingBot"} · ${data.account||"admin"}`;
    notice("ADMIN_TOKEN đã được xác minh và giữ trong cookie HttpOnly của thiết bị này.","ok");
    $("totpConfirmCode")?.focus();
  }
  function toggleInput(id,button){const input=$(id);if(!input)return;const show=input.type==="password";input.type=show?"text":"password";button.textContent=show?"Ẩn":"Hiện"}
  async function init(){
    try{
      state=await api("/api/admin-auth/status");
      if(state.authenticated){
        const already=LEGACY_KEYS.some(k=>sessionStorage.getItem(k)===SENTINEL);
        setSentinel();
        if(!already){location.reload();return;}
      }else{
        clearSentinel();linkedUi(state.linked);if($("adminUsername"))$("adminUsername").value=state.username||"admin";
        notice(state.linked?"Thiết bị đã liên kết. Nhập mật khẩu Admin và mã 2FA.":"Lần đầu trên thiết bị này: nhập mật khẩu Admin và ADMIN_TOKEN để bật 2FA.");
      }
    }catch(e){clearSentinel();linkedUi(false);notice(e.message,"error")}
  }

  document.addEventListener("submit",async e=>{
    if(e.target?.id!=="loginForm")return;
    e.preventDefault();e.stopImmediatePropagation();
    const username=$("adminUsername")?.value.trim()||"admin";const password=$("adminPassword")?.value||"";
    if(!password)return notice("Nhập mật khẩu Admin.","error");
    try{
      if(state.linked){
        const otp=$("adminOtp")?.value.trim()||"";if(!/^\d{6}$/.test(otp))throw new Error("Nhập mã 2FA gồm 6 số.");
        notice("Đang xác thực tài khoản + 2FA…");await api("/api/admin-auth/login",{username,password,otp});setSentinel();notice("Đăng nhập thành công.","ok");location.reload();
      }else{
        const adminToken=$("adminBootstrapToken")?.value.trim()||"";if(!adminToken)throw new Error("Nhập ADMIN_TOKEN hiện tại để liên kết thiết bị.");
        notice("Đang kiểm tra tài khoản và ADMIN_TOKEN…");const data=await api("/api/admin-auth/bootstrap",{username,password,adminToken});showSetup(data);
      }
    }catch(err){notice(err.message,"error")}
  },true);

  document.addEventListener("click",async e=>{
    const t=e.target.closest("button,a");if(!t)return;
    if(t.id==="togglePassword"){e.preventDefault();e.stopImmediatePropagation();toggleInput("adminPassword",t);return}
    if(t.id==="toggleBootstrapToken"){e.preventDefault();e.stopImmediatePropagation();toggleInput("adminBootstrapToken",t);return}
    if(t.id==="copyTotpSecret"){e.preventDefault();e.stopImmediatePropagation();try{await navigator.clipboard.writeText($("totpSecret").textContent);notice("Đã sao chép khóa 2FA.","ok")}catch{}return}
    if(t.id==="confirmTotp"){
      e.preventDefault();e.stopImmediatePropagation();const otp=$("totpConfirmCode")?.value.trim()||"";if(!/^\d{6}$/.test(otp))return notice("Nhập mã 2FA gồm 6 số.","error");
      try{notice("Đang xác nhận mã 2FA…");await api("/api/admin-auth/confirm",{otp});setSentinel();notice("2FA đã xác nhận. Đang mở Admin…","ok");location.reload()}catch(err){notice(err.message,"error")}return;
    }
    if(t.id==="logoutBtn"){
      e.preventDefault();e.stopImmediatePropagation();try{await api("/api/admin-auth/logout",{})}catch{}clearSentinel();location.reload();return;
    }
    if(t.id==="unlinkAdminDevice"){
      e.preventDefault();e.stopImmediatePropagation();if(!confirm("Gỡ liên kết thiết bị này? Lần sau bạn sẽ cần ADMIN_TOKEN để liên kết lại."))return;
      try{await api("/api/admin-auth/unlink",{})}finally{clearSentinel();location.reload()}return;
    }
  },true);

  const observer=new MutationObserver(()=>{
    document.querySelectorAll(".summary-line").forEach(row=>{if(row.textContent.includes("Xác thực Admin")&&row.textContent.includes("ADMIN_TOKEN")){const b=row.querySelector("b");if(b)b.textContent="Tài khoản + TOTP 2FA"}});
  });
  observer.observe(document.documentElement,{subtree:true,childList:true});
  init();
})();
