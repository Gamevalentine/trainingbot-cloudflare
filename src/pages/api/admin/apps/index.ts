import type { APIRoute } from 'astro';
import { db } from '../../../../lib/cloudflare';
import { adminError, deleteAppMedia, formToApp, redirect, replaceTags, saveScreenshots, setMainMedia, validateAdminFiles } from '../../../../lib/admin';

export const POST: APIRoute = async ({ request }) => {
  let id = 0;
  try {
    const form = await request.formData(); const data = await formToApp(form); validateAdminFiles(form);
    const result = await db().prepare(`INSERT INTO apps (name,slug,production_url,admin_url,github_repo,cloudflare_project,short_description,description,primary_use,audience,features,category_id,status,visibility,featured,pricing_type,platform,tech_stack,version,search_keywords,monitor_enabled,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(data.name,data.slug,data.production_url,data.admin_url,data.github_repo,data.cloudflare_project,data.short_description,data.description,data.primary_use,data.audience,data.features,data.category_id,data.status,data.visibility,data.featured,data.pricing_type,data.platform,data.tech_stack,data.version,data.search_keywords,data.monitor_enabled,data.updated_at).run();
    id = Number(result.meta.last_row_id);
    await db().prepare('INSERT INTO app_status_history (app_id,old_status,new_status) VALUES (?,NULL,?)').bind(id,data.status).run();
    await replaceTags(id,form); await setMainMedia(id,form); await saveScreenshots(id,form.getAll('screenshots'));
    return redirect(`/admin/apps/${id}`);
  } catch (error) {
    if (id) { await deleteAppMedia(id).catch(()=>{}); await db().prepare('DELETE FROM apps WHERE id=?').bind(id).run().catch(()=>{}); }
    return adminError(error);
  }
};
