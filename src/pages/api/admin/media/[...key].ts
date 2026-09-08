import type { APIRoute } from 'astro';
import { db, media } from '../../../../lib/cloudflare';
import { adminError, redirect } from '../../../../lib/admin';

export const POST: APIRoute = async ({params,url}) => {
  if(url.searchParams.get('_method')!=='DELETE') return new Response('Method not allowed',{status:405});
  const key=decodeURIComponent(params.key||''); if(!key) return new Response('Missing key',{status:400});
  const back=String(url.searchParams.get('back')||'/admin/media'); const target=back.startsWith('/admin')?back:'/admin/media';
  try {
    const screen=Number(url.searchParams.get('screen')||0); const app=Number(url.searchParams.get('app')||0); const kind=url.searchParams.get('kind');
    if(screen){const row=await db().prepare('SELECT id FROM screenshots WHERE id=? AND r2_key=?').bind(screen,key).first();if(!row)return new Response('Media không khớp',{status:404});await db().prepare('DELETE FROM screenshots WHERE id=?').bind(screen).run();}
    else if(app && (kind==='icon'||kind==='cover')){const field=kind==='icon'?'icon_key':'cover_key';const row=await db().prepare(`SELECT id FROM apps WHERE id=? AND ${field}=?`).bind(app,key).first();if(!row)return new Response('Media không khớp',{status:404});await db().prepare(`UPDATE apps SET ${field}='',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(app).run();}
    else return new Response('Thiếu thông tin media',{status:400});
    await media().delete(key); return redirect(target);
  } catch(error){return adminError(error);}
};
