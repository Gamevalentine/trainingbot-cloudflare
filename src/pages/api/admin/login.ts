import type { APIRoute } from 'astro';
import { adminSessionCookie, checkAdminPassword, createAdminSession } from '../../../lib/access';

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value || '/admin');
  return next.startsWith('/admin') && !next.startsWith('//') && next !== '/admin/login' ? next : '/admin';
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const next = safeNext(form.get('next'));
  const password = String(form.get('password') || '');
  if (!checkAdminPassword(password)) {
    const query = new URLSearchParams({ error: '1', next });
    return new Response(null, { status: 303, headers: { Location: `/admin/login?${query}`, 'Cache-Control': 'no-store' } });
  }
  const token = await createAdminSession();
  return new Response(null, {
    status: 303,
    headers: { Location: next, 'Set-Cookie': adminSessionCookie(token), 'Cache-Control': 'no-store' },
  });
};
