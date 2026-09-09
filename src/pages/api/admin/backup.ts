import type { APIRoute } from 'astro';
import { db, media } from '../../../lib/cloudflare';
import { adminError, redirect } from '../../../lib/admin';

const columns: Record<string,string[]> = {
  categories:['id','name','slug','description','icon','sort_order','is_active','created_at','updated_at'],
  apps:['id','name','slug','production_url','admin_url','github_repo','cloudflare_project','icon_key','cover_key','short_description','description','primary_use','audience','features','category_id','status','visibility','featured','pricing_type','platform','tech_stack','version','search_keywords','github_repo_full_name','github_default_branch','github_last_commit_sha','github_last_commit_message','github_last_commit_at','github_last_synced_at','github_sync_error','monitor_enabled','last_checked_at','last_http_status','last_response_ms','last_error','created_at','updated_at'],
  tags:['id','name','slug','created_at'], app_tags:['app_id','tag_id'], screenshots:['id','app_id','r2_key','alt_text','sort_order','created_at'],
  analytics:['id','app_id','date','views','opens'], search_analytics:['id','query','normalized_query','date','searches','zero_results','last_result_count'], category_analytics:['category_id','date','views'], admin_activity:['id','date','event_key','count'], app_status_history:['id','app_id','old_status','new_status','changed_at'], uptime_checks:['id','app_id','checked_at','is_up','http_status','response_ms','error']
};
const tables=Object.keys(columns);

async function mediaManifest(){const result:{key:string;size:number;uploaded?:string}[]=[];let cursor:string|undefined;do{const page=await media().list({cursor});for(const item of page.objects)result.push({key:item.key,size:item.size,uploaded:item.uploaded?.toISOString()});cursor=page.truncated?page.cursor:undefined;}while(cursor);return result;}

export const GET: APIRoute = async () => {
  const data:Record<string,unknown>={version:3,exported_at:new Date().toISOString()};
  for(const table of tables)data[table]=(await db().prepare(`SELECT ${columns[table].join(',')} FROM ${table}`).all()).results;
  data.media_manifest=await mediaManifest();
  return new Response(JSON.stringify(data,null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="toolpick-backup-${new Date().toISOString().slice(0,10)}.json"`,'Cache-Control':'no-store'}});
};
export const POST: APIRoute = async ({request}) => {
  try {
    const form=await request.formData(); const file=form.get('backup');
    if(!(file instanceof File)||!file.size||file.size>10*1024*1024)return new Response('File backup không hợp lệ hoặc quá 10 MB',{status:400});
    const data=JSON.parse(await file.text()) as Record<string,unknown>;
    if(!Array.isArray(data.apps)||!Array.isArray(data.categories)||!Array.isArray(data.tags))return new Response('Backup không hợp lệ',{status:400});
    await db().batch(['app_tags','screenshots','search_analytics','category_analytics','admin_activity','analytics','uptime_checks','app_status_history','apps','tags','categories'].map((table)=>db().prepare(`DELETE FROM ${table}`)));
    for(const table of tables){
      const rows=Array.isArray(data[table])?data[table] as Record<string,unknown>[]:[]; const statements=[];
      for(const row of rows){const keys=columns[table].filter((key)=>Object.prototype.hasOwnProperty.call(row,key));if(!keys.length)continue;statements.push(db().prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).bind(...keys.map((key)=>row[key])));}
      for(let i=0;i<statements.length;i+=50)await db().batch(statements.slice(i,i+50));
    }
    return redirect('/admin/backup');
  } catch(error){return adminError(error);}
};
