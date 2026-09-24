const H={"content-type":"application/json; charset=UTF-8","cache-control":"public, max-age=0, must-revalidate"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:H});

const SEEDS=[
  ["beta-v4-6-1","V4.6.1","V4.6","x64","released","http://k.gjacky.com/1375135419/230/apkupdate/4.6.1.21395/1375135419_230_4.6.1.21395_20260801175229_459046313_apkupdate.apk","2026-08-01T10:52:29Z"],
  ["beta-v4-6-2","V4.6.2","V4.6","x64","released","http://k.gjacky.com/1375135419/230/apkupdate/4.6.2.21415/1375135419_230_4.6.2.21415_20260807154052_1447578134_apkupdate.apk","2026-08-07T08:40:52Z"],
  ["beta-v4-6-3","V4.6.3","V4.6","x64","released","http://k.gjacky.com/1375135419/230/apkupdate/4.6.3.21435/1375135419_230_4.6.3.21435_20260814163305_39475866_apkupdate.apk","2026-08-14T09:33:05Z"],
  ["beta-v4-6-4","V4.6.4","V4.6","x64","released","http://k.gjacky.com/1375135419/230/apkupdate/4.6.4.21455/1375135419_230_4.6.4.21455_20260824160548_128024679_apkupdate.apk","2026-08-24T09:05:48Z"],
  ["beta-v4-7-1","V4.7.1","V4.7","x64","released","http://k.gjacky.com/1375135419/230/apkupdate/4.7.1.21595/1375135419_230_4.7.1.21595_20260924155659_1189713074_apkupdate.apk","2026-09-24T08:56:59Z"],
  ["beta-v4-7-2","V4.7.2","V4.7","x64","coming_soon","","2026-09-24T09:00:00Z"],
  ["beta-v4-7-3","V4.7.3","V4.7","x64","coming_soon","","2026-09-24T09:00:01Z"],
  ["beta-v4-7-4","V4.7.4","V4.7","x64","coming_soon","","2026-09-24T09:00:02Z"]
];

async function setup(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS tb_beta_versions_v1 (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL UNIQUE,
    major TEXT NOT NULL,
    arch TEXT NOT NULL DEFAULT 'x64',
    status TEXT NOT NULL DEFAULT 'coming_soon',
    download_url TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`).run();
  for(const seed of SEEDS){
    await db.prepare("INSERT OR IGNORE INTO tb_beta_versions_v1(id,version,major,arch,status,download_url,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)")
      .bind(seed[0],seed[1],seed[2],seed[3],seed[4],seed[5],seed[6],seed[6]).run();
  }
}

function parts(value){
  const m=String(value||"").toUpperCase().match(/^V(\d+)\.(\d+)(?:\.(\d+))?$/);
  return m?[Number(m[1]),Number(m[2]),Number(m[3]||0)]:[0,0,0];
}
function sortRows(rows){
  return [...rows].sort((a,b)=>{
    const A=parts(a.version),B=parts(b.version);
    return B[0]-A[0]||B[1]-A[1]||B[2]-A[2];
  });
}

export async function onRequestGet({env}){
  if(!env.DB)return reply({ok:false,message:"Dữ liệu phiên bản chưa sẵn sàng."},503);
  try{
    await setup(env.DB);
    const result=await env.DB.prepare("SELECT id,version,major,arch,status,download_url,created_at,updated_at FROM tb_beta_versions_v1").all();
    return reply({ok:true,versions:sortRows(result.results||[])});
  }catch(error){
    console.error("beta versions public",error);
    return reply({ok:false,message:"Không thể tải danh sách phiên bản beta."},500);
  }
}
