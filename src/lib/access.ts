import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';
import { ADMIN_PASSWORD_SHA256 } from './admin-password';

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

async function sessionKey() {
  const secret = String(env.ADMIN_SESSION_SECRET || '');
  if (secret.length < 32) throw new Error('ADMIN_SESSION_SECRET chưa được cấu hình');
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function checkAdminPassword(candidate: string) {
  if (!candidate) return false;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(candidate)));
  const actual = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
  let diff = actual.length ^ ADMIN_PASSWORD_SHA256.length;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ ADMIN_PASSWORD_SHA256.charCodeAt(i);
  return diff === 0;
}

export async function createAdminSession() {
  const encoded = b64url(encoder.encode(JSON.stringify({ v: 1, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })));
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await sessionKey(), encoder.encode(encoded)));
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
  const valid = await crypto.subtle.verify('HMAC', await sessionKey(), fromB64url(signature), encoder.encode(encoded));
  if (!valid) return false;
  try {
    const payload = JSON.parse(decoder.decode(fromB64url(encoded))) as { v?: number; exp?: number };
    return payload.v === 1 && Number(payload.exp || 0) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function requireAdmin(context: APIContext) {
  const token = cookieValue(context, COOKIE);
  if (!token || !(await verifyAdminSession(token))) throw new Error('Phiên Admin không hợp lệ');
  return { admin: true };
}
