
const H={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
export async function onRequestGet({request,env}){
 const reply=(data,status)=>new Response(JSON.stringify(data),{status,headers:H});
 const token=String(env.ADMIN_TOKEN||"");
 if(!token||request.headers.get("Authorization")!=="Bearer "+token)return reply({ok:false,message:"Unauthorized"},401);
 if(!env.DB)return reply({ok:false,message:"D1 unavailable"},503);
 try{
  // Inbox can be opened before the first incoming request without a missing-table error.
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS tb_contact_messages_v202 (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,subject TEXT NOT NULL,message TEXT NOT NULL,source_hash TEXT NOT NULL,received_at TEXT NOT NULL)").run();
  const rows=await env.DB.prepare("SELECT id,name,email,subject,message,received_at FROM tb_contact_messages_v202 ORDER BY received_at DESC LIMIT 100").all();
  return reply({ok:true,messages:rows.results||[]},200);
 }
 catch(e){console.error("TrainingBot contact inbox",e);return reply({ok:false,message:"Inbox unavailable"},503);}
}
