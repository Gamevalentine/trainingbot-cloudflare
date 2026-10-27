
(()=>{"use strict";const f=document.getElementById("tbContactForm"),s=document.getElementById("tbContactStatus");if(!f||!s)return;
f.addEventListener("submit",async e=>{e.preventDefault();if(!f.reportValidity())return;
 const btn=f.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent="Đang gửi…";s.textContent="Đang đợi máy chủ xác nhận…";s.dataset.state="";
 try{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);let r;
  try{r=await fetch("/api/contact",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(f).entries())),signal:controller.signal});}finally{clearTimeout(timeout);}
  const data=await r.json().catch(()=>({}));
  if(!r.ok||!data.ok||!data.received)throw Error(data.message||"Máy chủ chưa xác nhận");
  s.dataset.state="success";s.textContent="Đã lưu yêu cầu trong hệ thống (mã "+String(data.id||"")+"). Đây không phải xác nhận đã gửi email.";f.reset();
 }catch(err){s.dataset.state="error";s.textContent="Chưa gửi được: "+String(err.message||"Lỗi kết nối")+". Có thể gửi email tới trainingbot.ai2@gmail.com.";}
 finally{btn.disabled=false;btn.textContent="Gửi yêu cầu";}
});})();
