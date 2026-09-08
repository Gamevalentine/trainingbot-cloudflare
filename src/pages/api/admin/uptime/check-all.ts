import type { APIRoute } from 'astro';
import { db } from '../../../../lib/cloudflare';
import { adminError, redirect } from '../../../../lib/admin';
import { checkAllUptime } from '../../../../lib/uptime';

export const POST: APIRoute = async () => {
  try { await checkAllUptime(db(),50); return redirect('/admin/uptime'); }
  catch(error) { return adminError(error); }
};
