const H={"content-type":"text/plain; charset=UTF-8","cache-control":"no-store","x-content-type-options":"nosniff"};

function reply(message,status=400){
  return new Response(message,{status,headers:H});
}
function safeName(version,arch){
  const v=String(version||"PUBG_BETA").replace(/[^A-Za-z0-9._-]+/g,"_");
  const a=String(arch||"x64").replace(/[^A-Za-z0-9._-]+/g,"_");
  return `PUBG_MOBILE_BETA_${v}_${a}.apk`;
}

export async function onRequest({request,env,params}){
  if(request.method!=="GET"&&request.method!=="HEAD"){
    return new Response("Method Not Allowed",{status:405,headers:{Allow:"GET, HEAD"}});
  }
  if(!env.DB)return reply("Dữ liệu phiên bản chưa sẵn sàng.",503);

  const raw=decodeURIComponent(String(params?.version||"")).trim().toUpperCase();
  const version=raw.startsWith("V")?raw:`V${raw}`;
  if(!/^V\d+\.\d+\.\d+$/.test(version))return reply("Phiên bản không hợp lệ.",400);

  let row;
  try{
    row=await env.DB.prepare("SELECT version,arch,status,download_url FROM tb_beta_versions_v1 WHERE UPPER(version)=? LIMIT 1").bind(version).first();
  }catch(error){
    console.error("beta download lookup",error);
    return reply("Danh sách phiên bản chưa được khởi tạo. Hãy mở trang Bản cập nhật rồi thử lại.",503);
  }
  if(!row)return reply("Không tìm thấy phiên bản này.",404);
  if(row.status!=="released"||!row.download_url)return reply("Phiên bản này chưa phát hành.",404);

  let upstreamUrl;
  try{
    upstreamUrl=new URL(row.download_url);
    if(!/^https?:$/.test(upstreamUrl.protocol))throw new Error("protocol");
  }catch{
    return reply("Link tải của phiên bản không hợp lệ.",502);
  }

  const headers=new Headers();
  const range=request.headers.get("Range");
  const ifRange=request.headers.get("If-Range");
  if(range)headers.set("Range",range);
  if(ifRange)headers.set("If-Range",ifRange);
  headers.set("Accept","*/*");
  headers.set("User-Agent",request.headers.get("User-Agent")||"Mozilla/5.0");

  let upstream;
  try{
    upstream=await fetch(upstreamUrl.toString(),{method:request.method,headers,redirect:"follow"});
  }catch(error){
    console.error("beta download upstream",error);
    return reply("Không thể kết nối tới máy chủ tải PUBG.",502);
  }
  if(!upstream.ok&&upstream.status!==206){
    return reply("Máy chủ nguồn không trả về tệp tải.",upstream.status||502);
  }

  const out=new Headers();
  for(const name of ["Content-Length","Content-Range","Accept-Ranges","ETag","Last-Modified"]){
    const value=upstream.headers.get(name);
    if(value)out.set(name,value);
  }
  out.set("Content-Type",upstream.headers.get("Content-Type")||"application/vnd.android.package-archive");
  out.set("Content-Disposition",`attachment; filename="${safeName(row.version,row.arch)}"`);
  out.set("Cache-Control","no-store");
  out.set("X-Content-Type-Options","nosniff");

  return new Response(request.method==="HEAD"?null:upstream.body,{
    status:upstream.status,
    statusText:upstream.statusText,
    headers:out
  });
}
