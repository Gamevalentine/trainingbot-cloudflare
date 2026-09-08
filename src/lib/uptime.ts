import { safeFetch } from './external';

type AppProbe = { id:number; production_url:string; status:string; monitor_enabled?:number };
export type UptimeResult = { app_id:number; is_up:boolean; http_status:number|null; response_ms:number; error:string; checked_at:string };

function isHealthyStatus(status: number) {
  return (status >= 200 && status < 400) || status === 401 || status === 403 || status === 429;
}

export async function probeUrl(url: string) {
  const started = Date.now();
  try {
    const { response } = await safeFetch(url, { method:'GET', headers:{ 'Accept':'text/html,*/*;q=0.8', 'Range':'bytes=0-0' } });
    const result = { is_up:isHealthyStatus(response.status), http_status:response.status, response_ms:Date.now()-started, error:'' };
    try { await response.body?.cancel(); } catch {}
    return result;
  } catch (error) {
    return { is_up:false, http_status:null, response_ms:Date.now()-started, error:error instanceof Error ? error.message.slice(0,300) : 'Không thể kết nối.' };
  }
}

export async function checkAppUptime(database: any, app: AppProbe): Promise<UptimeResult> {
  const checked_at = new Date().toISOString();
  const probe = await probeUrl(app.production_url);
  await database.prepare('INSERT INTO uptime_checks (app_id,checked_at,is_up,http_status,response_ms,error) VALUES (?,?,?,?,?,?)')
    .bind(app.id,checked_at,probe.is_up?1:0,probe.http_status,probe.response_ms,probe.error).run();
  const nextStatus = probe.is_up ? 'active' : 'offline';
  const canAutoChange = app.status === 'active' || app.status === 'offline';
  if (canAutoChange && app.status !== nextStatus) {
    await database.batch([
      database.prepare('UPDATE apps SET status=?,last_checked_at=?,last_http_status=?,last_response_ms=?,last_error=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
        .bind(nextStatus,checked_at,probe.http_status,probe.response_ms,probe.error,app.id),
      database.prepare('INSERT INTO app_status_history (app_id,old_status,new_status) VALUES (?,?,?)').bind(app.id,app.status,nextStatus)
    ]);
  } else {
    await database.prepare('UPDATE apps SET last_checked_at=?,last_http_status=?,last_response_ms=?,last_error=? WHERE id=?')
      .bind(checked_at,probe.http_status,probe.response_ms,probe.error,app.id).run();
  }
  await database.prepare('DELETE FROM uptime_checks WHERE app_id=? AND id NOT IN (SELECT id FROM uptime_checks WHERE app_id=? ORDER BY checked_at DESC,id DESC LIMIT 100)')
    .bind(app.id,app.id).run();
  return { app_id:app.id, ...probe, checked_at };
}

export async function checkAllUptime(database: any, limit = 50) {
  const apps = (await database.prepare("SELECT id,production_url,status,monitor_enabled FROM apps WHERE monitor_enabled=1 AND status<>'archived' ORDER BY COALESCE(NULLIF(last_checked_at,''),'1970-01-01') ASC LIMIT ?")
    .bind(limit).all()).results as AppProbe[];
  const results: UptimeResult[] = [];
  for (let i=0;i<apps.length;i+=4) {
    const batch = await Promise.all(apps.slice(i,i+4).map((app)=>checkAppUptime(database,app)));
    results.push(...batch);
  }
  return results;
}
