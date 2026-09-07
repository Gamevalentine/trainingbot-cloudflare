import { db, media } from './cloudflare';
import { nowIso, slugify } from './utils';

export async function formToApp(form: FormData) {
  const name = String(form.get('name') || '').trim();
  const slug = slugify(String(form.get('slug') || name));
  const categoryRaw = String(form.get('category_id') || '');
  return {
    name, slug, production_url: String(form.get('production_url') || '').trim(),
    admin_url: String(form.get('admin_url') || '').trim(), github_repo: String(form.get('github_repo') || '').trim(), cloudflare_project: String(form.get('cloudflare_project') || '').trim(),
    short_description: String(form.get('short_description') || '').trim(), description: String(form.get('description') || '').trim(), primary_use: String(form.get('primary_use') || '').trim(), audience: String(form.get('audience') || '').trim(), features: String(form.get('features') || '').trim(),
    category_id: categoryRaw ? Number(categoryRaw) : null, status: String(form.get('status') || 'development'), visibility: String(form.get('visibility') || 'private'), featured: form.get('featured') === '1' ? 1 : 0,
    pricing_type: String(form.get('pricing_type') || 'free'), platform: String(form.get('platform') || 'web'), tech_stack: String(form.get('tech_stack') || '').trim(), version: String(form.get('version') || '').trim(), search_keywords: String(form.get('search_keywords') || '').trim(), updated_at: nowIso()
  };
}

export async function storeFile(file: FormDataEntryValue | null, prefix: string) {
  if (!(file instanceof File) || !file.size) return '';
  const ext = file.name.includes('.') ? `.${file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '';
  const key = `${prefix}/${crypto.randomUUID()}${ext}`;
  await media().put(key, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' }, customMetadata: { originalName: file.name } });
  return key;
}

export async function saveScreenshots(appId: number, files: FormDataEntryValue[]) {
  let order = Number((await db().prepare('SELECT COALESCE(MAX(sort_order), -1) max_order FROM screenshots WHERE app_id=?').bind(appId).first<{max_order:number}>())?.max_order ?? -1) + 1;
  for (const entry of files) {
    const key = await storeFile(entry, `apps/${appId}/screenshots`);
    if (!key) continue;
    await db().prepare('INSERT INTO screenshots (app_id,r2_key,alt_text,sort_order) VALUES (?,?,?,?)').bind(appId,key,(entry as File).name,order++).run();
  }
}

export async function replaceTags(appId: number, form: FormData) {
  const ids = form.getAll('tag_ids').map(Number).filter(Number.isFinite);
  const statements = [db().prepare('DELETE FROM app_tags WHERE app_id=?').bind(appId), ...ids.map((id) => db().prepare('INSERT OR IGNORE INTO app_tags (app_id,tag_id) VALUES (?,?)').bind(appId,id))];
  await db().batch(statements);
}

export async function setMainMedia(appId: number, form: FormData, currentIcon = '', currentCover = '') {
  const icon = await storeFile(form.get('icon'), `apps/${appId}/icon`);
  const cover = await storeFile(form.get('cover'), `apps/${appId}/cover`);
  const source = await storeFile(form.get('source_archive'), `private-source/${appId}`);
  await db().prepare('UPDATE apps SET icon_key=?, cover_key=? WHERE id=?').bind(icon || currentIcon, cover || currentCover, appId).run();
  if (source) await media().put(`private-source/${appId}/latest.txt`, source);
}

export function redirect(path: string, status = 303) { return new Response(null, { status, headers: { Location: path } }); }
