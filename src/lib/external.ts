const PRIVATE_V4 = [
  /^10\./, /^127\./, /^169\.254\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /^0\./
];

function blockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (PRIVATE_V4.some((rule) => rule.test(host))) return true;
  if (host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return true;
  return false;
}

export function externalUrl(value: string) {
  const raw = String(value || '').trim();
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try { url = new URL(withProtocol); } catch { throw new Error('URL không hợp lệ.'); }
  if (!['http:','https:'].includes(url.protocol) || blockedHost(url.hostname)) throw new Error('URL không được phép.');
  url.hash = '';
  return url;
}

export function resolveExternal(base: URL, value: string) {
  let target: URL;
  try { target = new URL(value, base); } catch { throw new Error('URL chuyển hướng không hợp lệ.'); }
  return externalUrl(target.toString());
}
export async function safeFetch(input: string | URL, init: RequestInit = {}, maxRedirects = 5) {
  let url = externalUrl(String(input));
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const response = await fetch(url, {
      ...init,
      redirect: 'manual',
      signal: init.signal || AbortSignal.timeout(12000),
      headers: { 'User-Agent': 'ToolpickBot/1.0', ...(init.headers || {}) }
    });
    if (![301,302,303,307,308].includes(response.status)) return { response, url };
    const location = response.headers.get('location');
    if (!location || hop === maxRedirects) return { response, url };
    try { await response.body?.cancel(); } catch {}
    url = resolveExternal(url, location);
  }
  throw new Error('Quá nhiều chuyển hướng.');
}

export async function readLimitedText(response: Response, limit = 1024 * 1024) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = []; let total = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    total += value.byteLength; if (total > limit) { await reader.cancel(); throw new Error('Nội dung website quá lớn để import.'); }
    chunks.push(value);
  }
  const merged = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(merged);
}
