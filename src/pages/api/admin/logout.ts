import type { APIRoute } from 'astro';
import { clearAdminSessionCookie, revokeAdminSession } from '../../../lib/access';

export const POST: APIRoute = async (context) => {
  await revokeAdminSession(context);
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/admin/login',
      'Set-Cookie': clearAdminSessionCookie(),
      'Cache-Control': 'no-store',
    },
  });
};
