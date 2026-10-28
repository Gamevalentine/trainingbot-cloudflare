/* A browser's Admin analytics label is attested only by authenticated Admin requests.
 * This does NOT confer, persist or replace authorization. Never trust a public role field.
 */
const HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});
const ID=/^[A-Za-z0-9_-]{8,80}$/;
function guard(request,env){
  const secret=String(env.ADMIN_TOKEN||"");
  if(!secret||request.headers.get("Authorization")!==`Bearer ${secret}`)return 401;
  const url=new URL(request.url);
  const origin=request.headers.get("Origin");
  if(origin&&origin!==url.origin)return 403;
  const site=(request.headers.get("Sec-Fetch-Site")||"").toLowerCase();
  if(site&&!["same-origin","none"].includes(site))return 403;
  return 0;
}
async function handler({request,env},remove){
  const denial=guard(request,env);
  if(denial)return respond({ok:false,message:"Không có quyền xác nhận Admin."},denial);
  if(!env.DB)return respond({ok:false,message:"D1 chưa kết nối."},503);
  if(Number(request.headers.get("content-length")||0)>1024)return respond({ok:false},413);
  if(!/application\/json/i.test(request.headers.get("content-type")||""))return respond({ok:false},415);
  const body=await request.json().catch(()=>null);
  const id=body&&typeof body.visitorId==="string"?body.visitorId:"";
  if(!ID.test(id))return respond({ok:false,message:"Mã trình duyệt không hợp lệ."},400);
  try{
    // Only Admin API may create/delete this label. Public tracking never writes it.
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS tb_admin_browsers_v1 (
      visitor_id TEXT PRIMARY KEY,
      enrolled_at TEXT NOT NULL
    )`).run();
    if(remove){
      await env.DB.prepare("DELETE FROM tb_admin_browsers_v1 WHERE visitor_id=?").bind(id).run();
      return respond({ok:true,is_admin:false});
    }
    await env.DB.prepare(`INSERT INTO tb_admin_browsers_v1(visitor_id,enrolled_at)
      VALUES(?,?) ON CONFLICT(visitor_id) DO NOTHING`).bind(id,new Date().toISOString()).run();
    return respond({ok:true,is_admin:true});
  }catch(error){
    console.error("admin browser label update",error);
    return respond({ok:false,message:"Không thể lưu nhãn trình duyệt trên D1."},500);
  }
}
export async function onRequestPost(context){return handler(context,false);}
export async function onRequestDelete(context){return handler(context,true);}
