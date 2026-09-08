import type { APIRoute } from 'astro';
import { adminSessionCookie, createAdminSession } from '../../../lib/access';

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value || '/admin');
  return next.startsWith('/admin') && !next.startsWith('//') && next !== '/admin/login' ? next : '/admin';
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const next = safeNext(form.get('next'));
  const token = await createAdminSession(String(form.get('password') || ''));
  return new Response(null, {
    status: 303,
    headers: { Location: next, 'Set-Cookie': adminSessionCookie(token), 'Cache-Control': 'no-store' },
  });
};
