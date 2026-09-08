import type { APIContext } from 'astro';
import { db } from './cloudflare';
import { ADMIN_PASSWORD_SHA256 } from './admin-password';

const encoder = new TextEncoder();
const COOKIE = 'toolpick_admin';
const SESSION_SECONDS = 60 * 60 * 12;

function b64url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256Hex(value: string) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function equalHex(left: string, right: string) {
  let diff = left.length ^ right.length;
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i++) diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  return diff === 0;
}
export async function checkAdminPassword(candidate: string) {
  if (!candidate) return false;
  return equalHex(await sha256Hex(candidate), ADMIN_PASSWORD_SHA256);
}

export async function createAdminSession() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = b64url(bytes);
  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_SECONDS;
  await db().batch([
    db().prepare('DELETE FROM admin_sessions WHERE expires_at<=?').bind(now),
    db().prepare('INSERT INTO admin_sessions (token_hash,expires_at) VALUES (?,?)').bind(tokenHash, expiresAt),
  ]);
  return token;
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
  if (!token || token.length < 32) return false;
  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);
  const row = await db().prepare('SELECT token_hash FROM admin_sessions WHERE token_hash=? AND expires_at>?').bind(tokenHash, now).first();
  return Boolean(row);
}

export async function revokeAdminSession(context: APIContext) {
  const token = cookieValue(context, COOKIE);
  if (!token) return;
  await db().prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await sha256Hex(token)).run();
}

export async function requireAdmin(context: APIContext) {
  const token = cookieValue(context, COOKIE);
  if (!token || !(await verifyAdminSession(token))) throw new Error('Phiên Admin không hợp lệ');
  return { admin: true };
}
