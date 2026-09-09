import type { APIRoute } from 'astro';
import { db } from '../../../../lib/cloudflare';
import { redirect } from '../../../../lib/admin';
import { syncAllGithub } from '../../../../lib/github-sync';

export const POST: APIRoute = async () => {
  const results = await syncAllGithub(db());
  const failed = results.filter((item:any)=>!item.ok).length;
  return redirect(`/admin/github?synced=${results.length}&failed=${failed}`);
};
