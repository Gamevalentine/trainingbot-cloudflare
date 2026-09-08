import type { APIRoute } from 'astro';
import { clearAdminSessionCookie } from '../../../lib/access';

export const POST: APIRoute = async () => new Response(null, {
  status: 303,
  headers: {
    Location: '/admin/login',
    'Set-Cookie': clearAdminSessionCookie(),
    'Cache-Control': 'no-store',
  },
});
