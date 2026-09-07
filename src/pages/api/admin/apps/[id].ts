import type { APIRoute } from 'astro'; import { db, media } from '../../../../lib/cloudflare'; import { formToApp, replaceTags, saveScreenshots, setMainMedia, redirect } from '../../../../lib/admin'; import { adminApp } from '../../../../lib/db';

export const POST: APIRoute = async ({ request, params, url }) => {
  const id = Number(params.id); const existing = await adminApp(id); if (!existing) return new Response('Not found',{status:404});
  if (url.searchParams.get('_method') === 'DELETE') {
    const objects = await media().list({ prefix: `apps/${id}/` }); await Promise.all(objects.objects.map((o) => media().delete(o.key)));
    const sources = await media().list({ prefix: `private-source/${id}/` }); await Promise.all(sources.objects.map((o) => media().delete(o.key)));
    await db().prepare('DELETE FROM apps WHERE id=?').bind(id).run(); return redirect('/admin/apps');
  }
  const form = await request.formData(); const data = await formToApp(form);
  await db().prepare(`UPDATE apps SET name=?,slug=?,production_url=?,admin_url=?,github_repo=?,cloudflare_project=?,short_description=?,description=?,primary_use=?,audience=?,features=?,category_id=?,status=?,visibility=?,featured=?,pricing_type=?,platform=?,tech_stack=?,version=?,search_keywords=?,updated_at=? WHERE id=?`).bind(data.name,data.slug,data.production_url,data.admin_url,data.github_repo,data.cloudflare_project,data.short_description,data.description,data.primary_use,data.audience,data.features,data.category_id,data.status,data.visibility,data.featured,data.pricing_type,data.platform,data.tech_stack,data.version,data.search_keywords,data.updated_at,id).run();
  if (existing.status !== data.status) await db().prepare('INSERT INTO app_status_history (app_id,old_status,new_status) VALUES (?,?,?)').bind(id,existing.status,data.status).run();
  await replaceTags(id,form); await setMainMedia(id,form,existing.icon_key,existing.cover_key); await saveScreenshots(id,form.getAll('screenshots')); return redirect(`/admin/apps/${id}`);
};
