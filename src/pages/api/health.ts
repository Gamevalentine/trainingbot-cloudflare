import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ ok: false, db: false, error: 'DB binding missing' }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      });
    }

    const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all<{ name: string }>();
    const categories = await env.DB.prepare('SELECT COUNT(*) AS count FROM categories').first<{ count: number }>();

    return new Response(JSON.stringify({
      ok: true,
      db: true,
      tables: (tables.results || []).map((row) => row.name),
      categories: Number(categories?.count || 0),
    }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      db: Boolean(env.DB),
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
};
