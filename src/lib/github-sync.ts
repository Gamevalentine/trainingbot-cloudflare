import { safeFetch, readLimitedText } from './external';

type GithubApp = { id:number; github_repo?:string; github_default_branch?:string };

export function parseGithubRepo(value: string) {
  const raw = String(value || '').trim().replace(/\.git$/i,'');
  let match = raw.match(/^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)$/i);
  if (!match) match = raw.match(/^git@github\.com:([^/]+)\/([^/?#]+)$/i);
  if (!match) match = raw.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (!match) throw new Error('GitHub repo phải có dạng owner/repo hoặc URL github.com.');
  return { owner:match[1], repo:match[2], fullName:`${match[1]}/${match[2]}` };
}

function xmlText(value = '') {
  return value.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g,' ').trim();
}
async function atomFor(owner:string,repo:string,branch:string) {
  const url=`https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(branch)}.atom`;
  const {response}=await safeFetch(url,{headers:{Accept:'application/atom+xml,text/xml;q=0.9,*/*;q=0.5'}});
  const text=await readLimitedText(response,1024*1024);
  if(!response.ok) throw new Error(`GitHub Atom HTTP ${response.status}`);
  const entry=text.match(/<entry>([\s\S]*?)<\/entry>/i)?.[1]||'';
  const sha=entry.match(/Grit::Commit\/([0-9a-f]{40})/i)?.[1]||'';
  const title=xmlText(entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');
  const updated=xmlText(entry.match(/<updated>([\s\S]*?)<\/updated>/i)?.[1]||'');
  if(!sha) throw new Error(`Không đọc được commit từ branch ${branch}.`);
  return {branch,sha,message:title.slice(0,300),committed_at:updated};
}

async function latestCommit(owner:string,repo:string,preferred='') {
  const branches=[preferred,'main','master'].map(x=>String(x||'').trim()).filter((x,i,a)=>x&&a.indexOf(x)===i);
  let last='Không tìm thấy branch GitHub.';
  for(const branch of branches){try{return await atomFor(owner,repo,branch)}catch(error){last=error instanceof Error?error.message:last}}
  throw new Error(last);
}
export async function syncAppGithub(database:any,app:GithubApp){
  const syncedAt=new Date().toISOString();
  try{
    const parsed=parseGithubRepo(app.github_repo||'');
    const commit=await latestCommit(parsed.owner,parsed.repo,app.github_default_branch||'');
    await database.prepare(`UPDATE apps SET github_repo_full_name=?,github_default_branch=?,github_last_commit_sha=?,github_last_commit_message=?,github_last_commit_at=?,github_last_synced_at=?,github_sync_error='' WHERE id=?`)
      .bind(parsed.fullName,commit.branch,commit.sha,commit.message,commit.committed_at,syncedAt,app.id).run();
    return {ok:true,full_name:parsed.fullName,...commit,synced_at:syncedAt};
  }catch(error){
    const message=error instanceof Error?error.message.slice(0,300):'Không thể đồng bộ GitHub.';
    await database.prepare('UPDATE apps SET github_last_synced_at=?,github_sync_error=? WHERE id=?').bind(syncedAt,message,app.id).run();
    return {ok:false,error:message,synced_at:syncedAt};
  }
}

export async function syncAllGithub(database:any,limit=30){
  const apps=(await database.prepare("SELECT id,github_repo,github_default_branch FROM apps WHERE TRIM(COALESCE(github_repo,''))<>'' ORDER BY COALESCE(NULLIF(github_last_synced_at,''),'1970-01-01') ASC LIMIT ?").bind(limit).all()).results as GithubApp[];
  const results=[];for(const app of apps)results.push({app_id:app.id,...(await syncAppGithub(database,app))});
  return results;
}
