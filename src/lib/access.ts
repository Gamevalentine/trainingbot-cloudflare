import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const COOKIE = 'toolpick_admin';
const SESSION_SECONDS = 60 * 60 * 12;

function b64url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromB64url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  const binary = atob(normalized);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sessionKey(passwordMaterial: string) {
  const secret = String(env.ADMIN_SESSION_SECRET || '');
  if (secret.length < 32) throw new Error('ADMIN_SESSION_SECRET chưa được cấu hình');
  const material = encoder.encode(`${secret}\u0000${passwordMaterial}`);
  return crypto.subtle.importKey('raw', material, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
function configuredPassword() {
  const password = String(env.ADMIN_PASSWORD || '');
  if (password.length < 16) throw new Error('ADMIN_PASSWORD chưa được cấu hình');
  return password;
}

export async function createAdminSession(passwordCandidate: string) {
  const encoded = b64url(encoder.encode(JSON.stringify({ v: 1, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })));
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await sessionKey(passwordCandidate), encoder.encode(encoded)));
  return `${encoded}.${b64url(signature)}`;
}

export function adminSessionCookie(token: string) {
  return `${COOKIE}=${token}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearAdminSessionCookie() {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

function cookieValue(context: APIContext, name: string) {
  const cookie = context.request.headers.get('Cookie') || '';
  const item = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? item.slice(name.length + 1) : '';
}
async function verifyAdminSession(token: string) {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return false;
  const valid = await crypto.subtle.verify('HMAC', await sessionKey(configuredPassword()), fromB64url(signature), encoder.encode(encoded));
  if (!valid) return false;
  try {
    const payload = JSON.parse(decoder.decode(fromB64url(encoded))) as { v?: number; exp?: number };
    return payload.v === 1 && Number(payload.exp || 0) > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

export async function requireAdmin(context: APIContext) {
  const token = cookieValue(context, COOKIE);
  if (!token || !(await verifyAdminSession(token))) throw new Error('Phiên Admin không hợp lệ');
  return { admin: true };
}
