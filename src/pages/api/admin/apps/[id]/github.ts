import type { APIRoute } from 'astro';
import { db } from '../../../../../lib/cloudflare';
import { adminApp } from '../../../../../lib/db';
import { redirect } from '../../../../../lib/admin';
import { syncAppGithub } from '../../../../../lib/github-sync';

export const POST: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  const app = await adminApp(id);
  if (!Number.isInteger(id) || id <= 0 || !app) return new Response('Không tìm thấy website',{status:404});
  if (!String(app.github_repo || '').trim()) return redirect(`/admin/apps/${id}?github=missing`);
  const result = await syncAppGithub(db(),app);
  return redirect(`/admin/apps/${id}?github=${result.ok?'ok':'error'}`);
};
