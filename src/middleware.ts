import { defineMiddleware } from 'astro:middleware';
import { requireAdmin } from './lib/access';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    try { await requireAdmin(context); }
    catch { return new Response('Không có quyền truy cập.', { status: 403, headers: { 'Cache-Control': 'no-store' } }); }
  }
  const response = await next();
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) response.headers.set('Cache-Control','no-store');
  return response;
});
