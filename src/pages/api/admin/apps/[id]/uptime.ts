import type { APIRoute } from 'astro';
import { db, lumaService } from '../../../../../lib/cloudflare';
import { adminError, redirect } from '../../../../../lib/admin';
import { checkAppUptime } from '../../../../../lib/uptime';

export const POST: APIRoute = async ({params}) => {
  try {
    const id=Number(params.id); if(!Number.isInteger(id)||id<=0)return new Response('ID không hợp lệ',{status:400});
    const app=await db().prepare('SELECT id,production_url,status,monitor_enabled FROM apps WHERE id=?').bind(id).first<any>();
    if(!app)return new Response('Không tìm thấy website',{status:404});
    await checkAppUptime(db(),app,{lumaService:lumaService()});
    return redirect('/admin/uptime');
  } catch(error) { return adminError(error); }
};
