import type { APIRoute } from 'astro'; import { siteUrl } from '../lib/cloudflare';
export const GET:APIRoute=async({url})=>{const base=siteUrl()||url.origin;return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\nDisallow: /go/\nDisallow: /favorites\nSitemap: ${base}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});};
