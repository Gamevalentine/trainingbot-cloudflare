import { defineMiddleware } from 'astro:middleware';
import { requireAdmin } from './lib/access';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const isAdmin = path.startsWith('/admin') || path.startsWith('/api/admin');

  if (isAdmin && !['GET','HEAD','OPTIONS'].includes(context.request.method)) {
    const origin = context.request.headers.get('Origin');
    if (origin && new URL(origin).origin !== context.url.origin) {
      return new Response('Yêu cầu không hợp lệ.', { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }
  }

  if (isAdmin) {
    try {
      await requireAdmin(context);
    } catch {
      return new Response('Không có quyền truy cập.', {
        status: 403,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
  }

  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isAdmin) {
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Frame-Options', 'DENY');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
