import { env } from 'cloudflare:workers';

export function db() { return env.DB; }
export function media() { return env.MEDIA; }
export function siteUrl() { return String(env.SITE_URL || ''); }
export function lumaService() { return (env as any).LUMA_SERVICE; }
