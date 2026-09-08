import { db, media } from './cloudflare';
import { nowIso, slugify } from './utils';

const STATUSES = new Set(['active','development','beta','paused','archived','offline']);
const VISIBILITIES = new Set(['public','private']);
const PRICING = new Set(['free','experimental','private']);
const ARCHIVES = new Set(['zip','tar','gz','tgz']);

function httpUrl(value: FormDataEntryValue | null, required = false) {
  const text = String(value || '').trim();
  if (!text) { if (required) throw new Error('Thiếu URL bắt buộc'); return ''; }
  try { const url = new URL(text); if (!['http:','https:'].includes(url.protocol)) throw 0; return url.toString(); }
  catch { throw new Error(`URL không hợp lệ: ${text}`); }
}

export async function formToApp(form: FormData) {
  const name = String(form.get('name') || '').trim();
  const slug = slugify(String(form.get('slug') || name));
  if (!name || !slug) throw new Error('Tên và slug không được để trống');
  const categoryRaw = Number(form.get('category_id') || 0);
  const status = String(form.get('status') || 'development');
  const visibility = String(form.get('visibility') || 'private');
  const pricing = String(form.get('pricing_type') || 'free');
  if (!STATUSES.has(status) || !VISIBILITIES.has(visibility) || !PRICING.has(pricing)) throw new Error('Giá trị phân loại không hợp lệ');
  return { name, slug, production_url: httpUrl(form.get('production_url'), true), admin_url: httpUrl(form.get('admin_url')),
    github_repo: String(form.get('github_repo') || '').trim(), cloudflare_project: String(form.get('cloudflare_project') || '').trim(),
    short_description: String(form.get('short_description') || '').trim(), description: String(form.get('description') || '').trim(), primary_use: String(form.get('primary_use') || '').trim(), audience: String(form.get('audience') || '').trim(), features: String(form.get('features') || '').trim(),
    category_id: Number.isInteger(categoryRaw) && categoryRaw > 0 ? categoryRaw : null, status, visibility, featured: form.get('featured') === '1' ? 1 : 0,
    pricing_type: pricing, platform: String(form.get('platform') || 'web').trim() || 'web', tech_stack: String(form.get('tech_stack') || '').trim(), version: String(form.get('version') || '').trim(), search_keywords: String(form.get('search_keywords') || '').trim(), updated_at: nowIso() };
}
export async function storeFile(file: FormDataEntryValue | null, prefix: string) {
  if (!(file instanceof File) || !file.size) return '';
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const isImage = /\/(icon|cover|screenshots)$|\/screenshots\b/.test(prefix);
  const isArchive = prefix.startsWith('private-source/');
  if (isImage && (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024)) throw new Error('Ảnh phải đúng định dạng và không quá 10 MB');
  if (isArchive && (!ARCHIVES.has(ext) || file.size > 100 * 1024 * 1024)) throw new Error('Source archive phải là ZIP/TAR/GZ/TGZ và không quá 100 MB');
  const key = `${prefix}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;
  await media().put(key, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' }, customMetadata: { originalName: file.name } });
  return key;
}

export async function saveScreenshots(appId: number, files: FormDataEntryValue[]) {
  if (files.filter((f) => f instanceof File && f.size).length > 12) throw new Error('Tối đa 12 screenshot mỗi lần upload');
  let order = Number((await db().prepare('SELECT COALESCE(MAX(sort_order), -1) max_order FROM screenshots WHERE app_id=?').bind(appId).first<{max_order:number}>())?.max_order ?? -1) + 1;
  for (const entry of files) {
    const key = await storeFile(entry, `apps/${appId}/screenshots`);
    if (!key) continue;
    await db().prepare('INSERT INTO screenshots (app_id,r2_key,alt_text,sort_order) VALUES (?,?,?,?)').bind(appId,key,(entry as File).name,order++).run();
  }
}

export async function replaceTags(appId: number, form: FormData) {
  const ids = [...new Set(form.getAll('tag_ids').map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  const statements = [db().prepare('DELETE FROM app_tags WHERE app_id=?').bind(appId), ...ids.map((id) => db().prepare('INSERT OR IGNORE INTO app_tags (app_id,tag_id) VALUES (?,?)').bind(appId,id))];
  await db().batch(statements);
}
async function replaceSource(appId: number, form: FormData) {
  const file = form.get('source_archive');
  if (!(file instanceof File) || !file.size) return;
  const key = await storeFile(file, `private-source/${appId}`);
  const pointerKey = `private-source/${appId}/latest.json`;
  const oldPointer = await media().get(pointerKey);
  if (oldPointer) { try { const old = JSON.parse(await oldPointer.text()); if (old?.key && old.key !== key) await media().delete(old.key); } catch {} }
  await media().put(pointerKey, JSON.stringify({ key, original_name: file.name, updated_at: nowIso() }), { httpMetadata: { contentType: 'application/json' } });
}

export async function setMainMedia(appId: number, form: FormData, currentIcon = '', currentCover = '') {
  const icon = await storeFile(form.get('icon'), `apps/${appId}/icon`);
  const cover = await storeFile(form.get('cover'), `apps/${appId}/cover`);
  await db().prepare('UPDATE apps SET icon_key=?, cover_key=? WHERE id=?').bind(icon || currentIcon, cover || currentCover, appId).run();
  if (icon && currentIcon && currentIcon !== icon) await media().delete(currentIcon);
  if (cover && currentCover && currentCover !== cover) await media().delete(currentCover);
  await replaceSource(appId, form);
}

export async function sourceArchive(appId: number) {
  const pointer = await media().get(`private-source/${appId}/latest.json`);
  if (!pointer) return null;
  try { return JSON.parse(await pointer.text()) as { key:string; original_name?:string; updated_at?:string }; } catch { return null; }
}

export function redirect(path: string, status = 303) { return new Response(null, { status, headers: { Location: path } }); }
export function adminError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error || 'Lỗi không xác định');
  const duplicate = /UNIQUE constraint failed/i.test(raw);
  const message = duplicate ? 'Tên hoặc slug đã tồn tại.' : raw.replace(/^D1_ERROR:\s*/i, '');
  return new Response(message, { status: duplicate ? 409 : 400, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
export async function deletePrefix(prefix: string) {
  let cursor: string | undefined;
  do {
    const page = await media().list({ prefix, cursor });
    if (page.objects.length) await Promise.all(page.objects.map((object) => media().delete(object.key)));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}

export async function deleteAppMedia(appId: number) {
  await deletePrefix(`apps/${appId}/`);
  await deletePrefix(`private-source/${appId}/`);
}
export function validateAdminFiles(form: FormData) {
  const images = [form.get('icon'), form.get('cover'), ...form.getAll('screenshots')].filter((f): f is File => f instanceof File && f.size > 0);
  if (form.getAll('screenshots').filter((f) => f instanceof File && f.size).length > 12) throw new Error('Tối đa 12 screenshot mỗi lần upload');
  for (const file of images) if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) throw new Error('Ảnh phải đúng định dạng và không quá 10 MB');
  const source = form.get('source_archive');
  if (source instanceof File && source.size) {
    const ext = source.name.includes('.') ? source.name.split('.').pop()!.toLowerCase() : '';
    if (!ARCHIVES.has(ext) || source.size > 100 * 1024 * 1024) throw new Error('Source archive phải là ZIP/TAR/GZ/TGZ và không quá 100 MB');
  }
}
