import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';

const encoder = new TextEncoder();

function b64urlToBytes(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  const binary = atob(normalized);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJsonPart<T>(part: string): T {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(part)));
}

async function verifyAccessJwt(token: string) {
  const [headerPart, payloadPart, signaturePart] = token.split('.');
  if (!headerPart || !payloadPart || !signaturePart) throw new Error('JWT không hợp lệ');
  const header = decodeJsonPart<{ alg?: string; kid?: string }>(headerPart);
  const payload = decodeJsonPart<Record<string, unknown>>(payloadPart);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('JWT algorithm không hợp lệ');
  const team = String(env.ACCESS_TEAM_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const audience = String(env.ACCESS_AUD || '');
  if (!team || !audience) throw new Error('Cloudflare Access chưa được cấu hình');
  const certsUrl = `https://${team}/cdn-cgi/access/certs`;
  const response = await fetch(certsUrl, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!response.ok) throw new Error('Không tải được Access certs');
  const certs = await response.json() as { keys?: JsonWebKey[] };
  const jwk = certs.keys?.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error('Không tìm thấy Access key');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(signaturePart), encoder.encode(`${headerPart}.${payloadPart}`));
  if (!valid) throw new Error('Chữ ký Access JWT không hợp lệ');
  const now = Math.floor(Date.now() / 1000);
  const exp = Number(payload.exp || 0); const nbf = Number(payload.nbf || 0);
  if (!exp || exp <= now || (nbf && nbf > now + 30)) throw new Error('Access JWT hết hạn/chưa hiệu lực');
  const iss = String(payload.iss || '').replace(/\/$/, '');
  if (iss !== `https://${team}`) throw new Error('JWT issuer không hợp lệ');
  const aud = Array.isArray(payload.aud) ? payload.aud.map(String) : [String(payload.aud || '')];
  if (!aud.includes(audience)) throw new Error('JWT audience không hợp lệ');
  const owner = String(env.OWNER_EMAIL || '').trim().toLowerCase();
  if (!owner) throw new Error('OWNER_EMAIL chưa được cấu hình');
  const email = String(payload.email || '').trim().toLowerCase();
  if (!email || email !== owner) throw new Error('Tài khoản không phải chủ sở hữu');
  return payload;
}

export async function requireAdmin(context: APIContext) {
  if (String(env.REQUIRE_ACCESS || 'true') === 'false') return { local: true };
  const token = context.request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new Error('Thiếu Cloudflare Access token');
  return verifyAccessJwt(token);
}
