import { defineMiddleware } from 'astro:middleware';
import { requireAdmin } from './lib/access';

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.hostname.toLowerCase() === 'toolpick.ai-vn.workers.dev') {
    const target = new URL(`${context.url.pathname}${context.url.search}`, 'https://toolpick.id.vn');
    return new Response(null, { status: 301, headers: { Location: target.toString(), 'Cache-Control': 'public, max-age=3600' } });
  }

  const path = context.url.pathname;
  const isAdmin = path.startsWith('/admin') || path.startsWith('/api/admin');
  const isAuthRoute = path === '/admin/login' || path === '/api/admin/login' || path === '/api/admin/logout';

  if (isAdmin && !['GET','HEAD','OPTIONS'].includes(context.request.method)) {
    const origin = context.request.headers.get('Origin');
    let sameOrigin = !origin;
    if (origin) { try { sameOrigin = new URL(origin).origin === context.url.origin; } catch { sameOrigin = false; } }
    if (!sameOrigin) {
      try { await context.request.arrayBuffer(); } catch {}
      return new Response('Yêu cầu không hợp lệ.', { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }
  }

  if (isAdmin && !isAuthRoute) {
    try { await requireAdmin(context); }
    catch {
      if (path.startsWith('/admin')) {
        const target = encodeURIComponent(`${path}${context.url.search}`);
        const hasSession = (context.request.headers.get('Cookie') || '').includes('toolpick_admin=');
        const error = hasSession ? '&error=1' : '';
        return new Response(null, { status: 303, headers: { Location: `/admin/login?next=${target}${error}`, 'Cache-Control': 'no-store' } });
      }
      return new Response('Chưa đăng nhập.', { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }
  }
  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
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
