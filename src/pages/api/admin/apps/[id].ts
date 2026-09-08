import type { APIRoute } from 'astro';
import { db, media } from '../../../../lib/cloudflare';
import { adminApp } from '../../../../lib/db';
import { adminError, deleteAppMedia, deletePrefix, formToApp, redirect, replaceTags, saveScreenshots, setMainMedia, validateAdminFiles } from '../../../../lib/admin';

export const POST: APIRoute = async ({ request, params, url }) => {
  const id = Number(params.id); const existing = await adminApp(id);
  if (!Number.isInteger(id) || id <= 0 || !existing) return new Response('Không tìm thấy website',{status:404});
  try {
    const method = url.searchParams.get('_method');
    if (method === 'DELETE') { await deleteAppMedia(id); await db().prepare('DELETE FROM apps WHERE id=?').bind(id).run(); return redirect('/admin/apps'); }
    if (method === 'REMOVE_MEDIA') {
      const kind = url.searchParams.get('kind');
      if (kind === 'icon' && existing.icon_key) { await media().delete(existing.icon_key); await db().prepare("UPDATE apps SET icon_key='',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run(); }
      else if (kind === 'cover' && existing.cover_key) { await media().delete(existing.cover_key); await db().prepare("UPDATE apps SET cover_key='',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run(); }
      else if (kind === 'source') await deletePrefix(`private-source/${id}/`);
      else if (!['icon','cover','source'].includes(String(kind))) return new Response('Loại media không hợp lệ',{status:400});
      return redirect(`/admin/apps/${id}`);
    }
    const form = await request.formData(); const data = await formToApp(form); validateAdminFiles(form);
    const duplicate = await db().prepare('SELECT id FROM apps WHERE slug=? AND id<>?').bind(data.slug,id).first();
    if (duplicate) return new Response('Slug đã được sử dụng.',{status:409});
    await db().prepare(`UPDATE apps SET name=?,slug=?,production_url=?,admin_url=?,github_repo=?,cloudflare_project=?,short_description=?,description=?,primary_use=?,audience=?,features=?,category_id=?,status=?,visibility=?,featured=?,pricing_type=?,platform=?,tech_stack=?,version=?,search_keywords=?,updated_at=? WHERE id=?`).bind(data.name,data.slug,data.production_url,data.admin_url,data.github_repo,data.cloudflare_project,data.short_description,data.description,data.primary_use,data.audience,data.features,data.category_id,data.status,data.visibility,data.featured,data.pricing_type,data.platform,data.tech_stack,data.version,data.search_keywords,data.updated_at,id).run();
    if (existing.status !== data.status) await db().prepare('INSERT INTO app_status_history (app_id,old_status,new_status) VALUES (?,?,?)').bind(id,existing.status,data.status).run();
    await replaceTags(id,form); await setMainMedia(id,form,existing.icon_key,existing.cover_key); await saveScreenshots(id,form.getAll('screenshots'));
    return redirect(`/admin/apps/${id}`);
  } catch (error) { return adminError(error); }
};
