import { db } from './cloudflare';
import type { AppRecord, Category, Tag } from './types';
import { normalizeSearch, tokenizeSearch } from './utils';

const PUBLIC_COLUMNS = `SELECT a.id,a.name,a.slug,a.production_url,a.icon_key,a.cover_key,a.short_description,a.description,a.primary_use,a.audience,a.features,a.category_id,a.status,a.visibility,a.featured,a.pricing_type,a.platform,a.tech_stack,a.version,a.search_keywords,a.created_at,a.updated_at,c.name category_name,c.slug category_slug`;
const PUBLIC_FROM = `FROM apps a LEFT JOIN categories c ON c.id=a.category_id`;

export async function listCategories(activeOnly = true) {
  const sql = `SELECT c.*, COUNT(CASE WHEN a.visibility='public' THEN 1 END) app_count FROM categories c LEFT JOIN apps a ON a.category_id=c.id ${activeOnly ? 'WHERE c.is_active=1' : ''} GROUP BY c.id ORDER BY c.sort_order,c.name`;
  return (await db().prepare(sql).all<Category>()).results;
}

export async function getCategory(slug: string) { return db().prepare('SELECT * FROM categories WHERE slug=? AND is_active=1').bind(slug).first<Category>(); }
export async function listTags() { return (await db().prepare('SELECT * FROM tags ORDER BY name').all<Tag>()).results; }

export async function listPublicApps(options: { category?: string; status?: string; platform?: string; pricing?: string; featured?: boolean; sort?: string; limit?: number } = {}) {
  const conditions = ["a.visibility='public'"]; const binds: unknown[] = [];
  if (options.category) { conditions.push('c.slug=?'); binds.push(options.category); }
  if (options.status) { conditions.push('a.status=?'); binds.push(options.status); }
  if (options.platform) { conditions.push('a.platform=?'); binds.push(options.platform); }
  if (options.pricing) { conditions.push('a.pricing_type=?'); binds.push(options.pricing); }
  if (options.featured) conditions.push('a.featured=1');
  const sortMap: Record<string,string> = { updated:'a.updated_at DESC', new:'a.created_at DESC', popular:'total_opens DESC,a.updated_at DESC', name:'a.name COLLATE NOCASE' };
  const order = sortMap[options.sort || ''] || 'a.featured DESC,a.updated_at DESC';
  const limit = Math.min(Math.max(options.limit || 100,1),200);
  const query = `${PUBLIC_COLUMNS},COALESCE(SUM(an.opens),0) total_opens,COALESCE(SUM(an.views),0) total_views ${PUBLIC_FROM} LEFT JOIN analytics an ON an.app_id=a.id WHERE ${conditions.join(' AND ')} GROUP BY a.id ORDER BY ${order} LIMIT ${limit}`;
  return (await db().prepare(query).bind(...binds).all<AppRecord>()).results;
}

export async function getPublicApp(slug: string) {
  const app = await db().prepare(`${PUBLIC_COLUMNS} ${PUBLIC_FROM} WHERE a.slug=? AND a.visibility='public'`).bind(slug).first<AppRecord>();
  if (!app) return null;
  const tags = (await db().prepare('SELECT t.* FROM tags t JOIN app_tags x ON x.tag_id=t.id WHERE x.app_id=? ORDER BY t.name').bind(app.id).all<Tag>()).results;
  const screenshots = (await db().prepare('SELECT id,app_id,r2_key,alt_text,sort_order,created_at FROM screenshots WHERE app_id=? ORDER BY sort_order,id').bind(app.id).all()).results;
  return { ...app, tags, screenshots };
}

export async function relatedApps(app: AppRecord, limit = 4) {
  const result = await db().prepare(`${PUBLIC_COLUMNS},COUNT(DISTINCT shared.tag_id) shared_tags ${PUBLIC_FROM} LEFT JOIN app_tags mine ON mine.app_id=? LEFT JOIN app_tags shared ON shared.app_id=a.id AND shared.tag_id=mine.tag_id WHERE a.visibility='public' AND a.id<>? AND (a.category_id=? OR shared.tag_id IS NOT NULL) GROUP BY a.id ORDER BY shared_tags DESC,(a.category_id=? ) DESC,a.featured DESC,a.updated_at DESC LIMIT ?`).bind(app.id,app.id,app.category_id,app.category_id,limit).all<AppRecord>();
  return result.results;
}

export async function searchApps(query: string, filters: { category?: string; status?: string; platform?: string; pricing?: string; featured?: boolean; sort?: string } = {}) {
  const normalized = normalizeSearch(query); const tokens = tokenizeSearch(query);
  if (!normalized && !Object.values(filters).some(Boolean)) return listPublicApps(filters);
  const candidates = await listPublicApps({ ...filters, limit: 200 });
  if (!normalized) return candidates;
  const scored = candidates.map((app) => {
    const fields: [string,number][] = [[app.name,12],[app.search_keywords,10],[app.primary_use,9],[app.short_description,6],[app.category_name || '',7],[app.description,3],[app.audience,3],[app.features,4]];
    let score = 0;
    for (const [value,weight] of fields) {
      const text = normalizeSearch(value || '');
      if (!text) continue;
      if (text === normalized) score += weight * 5;
      if (text.includes(normalized)) score += weight * 3;
      for (const token of tokens) if (text.includes(token)) score += weight;
    }
    return { app, score };
  }).filter((item) => item.score > 0);
  scored.sort((a,b) => b.score-a.score || b.app.featured-a.app.featured || String(b.app.updated_at).localeCompare(String(a.app.updated_at)));
  return scored.map(({app}) => app);
}

export async function incrementMetric(appId: number, type: 'views'|'opens') {
  const date = new Date().toISOString().slice(0,10); const field = type === 'views' ? 'views' : 'opens';
  await db().prepare(`INSERT INTO analytics (app_id,date,${field}) VALUES (?,?,1) ON CONFLICT(app_id,date) DO UPDATE SET ${field}=${field}+1`).bind(appId,date).run();
}

export async function dashboardStats() {
  const counts = await db().prepare(`SELECT COUNT(*) total, SUM(visibility='public') public_count, SUM(visibility='private') private_count, SUM(status='active') active_count, SUM(status='offline') offline_count, SUM(status='development') development_count, SUM(TRIM(COALESCE(github_repo,''))<>'') github_count FROM apps`).first<Record<string,number>>();
  const traffic = await db().prepare('SELECT COALESCE(SUM(views),0) views,COALESCE(SUM(opens),0) opens FROM analytics').first<Record<string,number>>();
  const popular = await db().prepare(`SELECT a.id,a.name,a.slug,COALESCE(SUM(an.opens),0) opens FROM apps a LEFT JOIN analytics an ON an.app_id=a.id GROUP BY a.id ORDER BY opens DESC LIMIT 5`).all();
  const recent = await db().prepare('SELECT id,name,slug,status,visibility,updated_at FROM apps ORDER BY updated_at DESC LIMIT 6').all();
  const appRows = (await db().prepare(`SELECT id,name,status,github_repo,github_last_commit_at,github_last_synced_at,github_sync_error,icon_key,cover_key,short_description,primary_use FROM apps ORDER BY name`).all()).results as any[];
  const alerts:any[]=[]; const staleBefore=Date.now()-90*86400000;
  for(const app of appRows){ if(app.status==='offline') alerts.push({severity:'danger',app_id:app.id,title:app.name,text:'Website đang Offline'}); if(!String(app.github_repo||'').trim()) alerts.push({severity:'info',app_id:app.id,title:app.name,text:'Chưa gắn GitHub repo'}); else if(app.github_sync_error) alerts.push({severity:'danger',app_id:app.id,title:app.name,text:`GitHub: ${app.github_sync_error}`}); else if(!app.github_last_synced_at) alerts.push({severity:'warning',app_id:app.id,title:app.name,text:'GitHub chưa từng đồng bộ'}); else if(app.github_last_commit_at && new Date(app.github_last_commit_at).getTime()<staleBefore) alerts.push({severity:'warning',app_id:app.id,title:app.name,text:'Repo hơn 90 ngày chưa có commit'}); if(!app.icon_key||!app.cover_key) alerts.push({severity:'warning',app_id:app.id,title:app.name,text:'Thiếu icon hoặc cover'}); if(!app.short_description||!app.primary_use) alerts.push({severity:'warning',app_id:app.id,title:app.name,text:'Metadata chưa hoàn chỉnh'}); }
  return { counts, traffic, popular: popular.results, recent: recent.results, alerts:alerts.slice(0,12) };
}

export async function adminApps() { return (await db().prepare(`SELECT a.*,c.name category_name FROM apps a LEFT JOIN categories c ON c.id=a.category_id ORDER BY a.updated_at DESC`).all<AppRecord>()).results; }
export async function adminApp(id: number) { return db().prepare('SELECT * FROM apps WHERE id=?').bind(id).first<AppRecord>(); }
