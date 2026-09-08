import type { APIRoute } from 'astro';
import { db } from '../../../lib/cloudflare';
import { adminError, redirect } from '../../../lib/admin';
import { importWebsite } from '../../../lib/importer';
import { checkAppUptime } from '../../../lib/uptime';

export const POST: APIRoute = async ({request}) => {
  try {
    const form=await request.formData(); const raw=String(form.get('url')||'').trim();
    const categoryRaw=Number(form.get('category_id')||0); let categoryId:number|null=null;
    if(Number.isInteger(categoryRaw)&&categoryRaw>0){const found=await db().prepare('SELECT id FROM categories WHERE id=?').bind(categoryRaw).first();if(found)categoryId=categoryRaw;}
    const imported=await importWebsite(raw,categoryId);
    if(!imported.existing){
      const app=await db().prepare('SELECT id,production_url,status,monitor_enabled FROM apps WHERE id=?').bind(imported.id).first<any>();
      if(app) await checkAppUptime(db(),app);
    }
    return redirect(`/admin/apps/${imported.id}?imported=1`);
  } catch(error) { return adminError(error); }
};
