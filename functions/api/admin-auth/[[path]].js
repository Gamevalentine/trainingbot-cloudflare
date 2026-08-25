import {
  ADMIN_USERNAME,
  verifyAccount,
  validateUpstreamToken,
  totpSetup,
  linkCookie,
  linkedToken,
  verifyTotp,
  makeSession,
  sessionCookie,
  readSession,
  clearCookie,
  json,
} from "../../_lib/admin_auth.js";

async function body(request){return request.json().catch(()=>({}))}

export async function onRequest({request}){
  const url=new URL(request.url);
  const action=url.pathname.split("/").filter(Boolean).pop()||"status";
  if(request.method!=="GET"){
    const origin=request.headers.get("Origin");
    if(origin && origin!==url.origin)return json({ok:false,message:"Yêu cầu xác thực không hợp lệ."},403);
  }

  if(request.method==="GET" && action==="status"){
    const s=await readSession(request);
    return json({ok:true,account:true,two_factor:true,username:ADMIN_USERNAME,linked:s.linked,authenticated:s.authenticated,session_hours:8});
  }
  if(request.method==="GET" && action==="session"){
    const s=await readSession(request);
    return json({ok:true,authenticated:s.authenticated,linked:s.linked});
  }
  if(request.method!=="POST")return json({ok:false,message:"Method not allowed."},405,{"Allow":"GET, POST"});

  if(action==="bootstrap"){
    const data=await body(request);
    if(!await verifyAccount(data.username,data.password))return json({ok:false,message:"Sai tài khoản hoặc mật khẩu Admin."},401);
    const token=String(data.adminToken||"").trim();
    if(!await validateUpstreamToken(token))return json({ok:false,message:"ADMIN_TOKEN không đúng hoặc Worker không phản hồi."},401);
    const setup=await totpSetup(token);
    return json({ok:true,...setup},200,{"Set-Cookie":linkCookie(token)});
  }
  if(action==="confirm"){
    const token=linkedToken(request);
    if(!token)return json({ok:false,message:"Thiết bị chưa được liên kết."},401);
    const data=await body(request);
    if(!await verifyTotp(token,data.otp))return json({ok:false,message:"Mã 2FA không đúng. Hãy thử mã hiện tại trong ứng dụng Authenticator."},401);
    const session=await makeSession(token);
    return json({ok:true,authenticated:true},200,{"Set-Cookie":sessionCookie(session)});
  }
  if(action==="login"){
    const data=await body(request);
    if(!await verifyAccount(data.username,data.password))return json({ok:false,message:"Sai tài khoản hoặc mật khẩu Admin."},401);
    const token=linkedToken(request);
    if(!token)return json({ok:false,message:"Thiết bị chưa liên kết. Hãy dùng ADMIN_TOKEN để liên kết lại."},428);
    if(!await validateUpstreamToken(token))return json({ok:false,message:"ADMIN_TOKEN đã thay đổi hoặc hết hiệu lực. Hãy gỡ liên kết và liên kết lại thiết bị."},401);
    if(!await verifyTotp(token,data.otp))return json({ok:false,message:"Mã 2FA không đúng."},401);
    const session=await makeSession(token);
    return json({ok:true,authenticated:true},200,{"Set-Cookie":sessionCookie(session)});
  }
  if(action==="logout"){
    return json({ok:true},200,{"Set-Cookie":clearCookie("tb_admin_session_v23")});
  }
  if(action==="unlink"){
    const headers=new Headers({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});
    headers.append("Set-Cookie",clearCookie("tb_admin_session_v23"));
    headers.append("Set-Cookie",clearCookie("tb_admin_upstream_v23"));
    return new Response(JSON.stringify({ok:true}),{status:200,headers});
  }
  return json({ok:false,message:"Không tìm thấy endpoint xác thực."},404);
}
