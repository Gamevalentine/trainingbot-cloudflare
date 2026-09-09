import { safeFetch, readLimitedText } from './external';

type GithubApp = { id:number; github_repo?:string };

type RepoMeta = {
  full_name?:string;
  default_branch?:string;
  archived?:boolean;
};

type CommitMeta = {
  sha?:string;
  commit?: { message?:string; committer?:{date?:string}; author?:{date?:string} };
};

export function parseGithubRepo(value: string) {
  const raw = String(value || '').trim().replace(/\.git$/i,'');
  let match = raw.match(/^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)$/i);
  if (!match) match = raw.match(/^git@github\.com:([^/]+)\/([^/?#]+)$/i);
  if (!match) match = raw.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (!match) throw new Error('GitHub repo phải có dạng owner/repo hoặc URL github.com.');
  return { owner:match[1], repo:match[2], fullName:`${match[1]}/${match[2]}` };
}
async function githubJson<T>(url: string) {
  const { response } = await safeFetch(url, { headers:{ 'Accept':'application/vnd.github+json' } });
  const text = await readLimitedText(response, 512 * 1024);
  if (!response.ok) {
    let message = `GitHub HTTP ${response.status}`;
    try { const data = JSON.parse(text); if (data?.message) message += `: ${data.message}`; } catch {}
    throw new Error(message.slice(0,300));
  }
  return JSON.parse(text) as T;
}

export async function syncAppGithub(database: any, app: GithubApp) {
  const syncedAt = new Date().toISOString();
  try {
    const parsed = parseGithubRepo(app.github_repo || '');
    const repo = await githubJson<RepoMeta>(`https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`);
    const branch = String(repo.default_branch || 'main');
    const commits = await githubJson<CommitMeta[]>(`https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/commits?sha=${encodeURIComponent(branch)}&per_page=1`);
    const commit = commits[0] || {};
    const sha = String(commit.sha || '');
    const message = String(commit.commit?.message || '').split(/\r?\n/)[0].slice(0,300);
    const committedAt = String(commit.commit?.committer?.date || commit.commit?.author?.date || '');
    await database.prepare(`UPDATE apps SET github_repo_full_name=?,github_default_branch=?,github_last_commit_sha=?,github_last_commit_message=?,github_last_commit_at=?,github_last_synced_at=?,github_sync_error='' WHERE id=?`)
      .bind(String(repo.full_name || parsed.fullName),branch,sha,message,committedAt,syncedAt,app.id).run();
    return { ok:true, full_name:String(repo.full_name || parsed.fullName), branch, sha, message, committed_at:committedAt, synced_at:syncedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0,300) : 'Không thể đồng bộ GitHub.';
    await database.prepare('UPDATE apps SET github_last_synced_at=?,github_sync_error=? WHERE id=?').bind(syncedAt,message,app.id).run();
    return { ok:false, error:message, synced_at:syncedAt };
  }
}

export async function syncAllGithub(database: any, limit = 30) {
  const apps = (await database.prepare("SELECT id,github_repo FROM apps WHERE TRIM(COALESCE(github_repo,''))<>'' ORDER BY COALESCE(NULLIF(github_last_synced_at,''),'1970-01-01') ASC LIMIT ?").bind(limit).all()).results as GithubApp[];
  const results = [];
  for (const app of apps) results.push({ app_id:app.id, ...(await syncAppGithub(database,app)) });
  return results;
}
