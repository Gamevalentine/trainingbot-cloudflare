const VIETNAMESE_MAP: Record<string,string> = {
  à:'a',á:'a',ạ:'a',ả:'a',ã:'a',â:'a',ầ:'a',ấ:'a',ậ:'a',ẩ:'a',ẫ:'a',ă:'a',ằ:'a',ắ:'a',ặ:'a',ẳ:'a',ẵ:'a',
  è:'e',é:'e',ẹ:'e',ẻ:'e',ẽ:'e',ê:'e',ề:'e',ế:'e',ệ:'e',ể:'e',ễ:'e', ì:'i',í:'i',ị:'i',ỉ:'i',ĩ:'i',
  ò:'o',ó:'o',ọ:'o',ỏ:'o',õ:'o',ô:'o',ồ:'o',ố:'o',ộ:'o',ổ:'o',ỗ:'o',ơ:'o',ờ:'o',ớ:'o',ợ:'o',ở:'o',ỡ:'o',
  ù:'u',ú:'u',ụ:'u',ủ:'u',ũ:'u',ư:'u',ừ:'u',ứ:'u',ự:'u',ử:'u',ữ:'u', ỳ:'y',ý:'y',ỵ:'y',ỷ:'y',ỹ:'y', đ:'d'
};

export function stripVietnamese(value: string) { return value.toLowerCase().split('').map((c) => VIETNAMESE_MAP[c] ?? c).join(''); }
export function normalizeSearch(value = '') { return stripVietnamese(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' '); }
const STOP = new Set(['toi','muon','can','mot','cai','cho','giup','giup toi','lam','de','co','the','hay','va','voi','cua','la']);
export function tokenizeSearch(value: string) { return normalizeSearch(value).split(' ').filter((t) => t.length > 1 && !STOP.has(t)); }
export function slugify(value: string) { return normalizeSearch(value).replace(/\s+/g,'-').replace(/^-|-$/g,''); }
export function mediaUrl(key?: string | null) { return key ? `/media/${key.split('/').map(encodeURIComponent).join('/')}` : ''; }
export function statusLabel(status: string) { return ({active:'Đang hoạt động',development:'Đang phát triển',beta:'Beta',paused:'Tạm dừng',archived:'Đã lưu trữ',offline:'Không còn hoạt động'} as Record<string,string>)[status] ?? status; }
export function dateLabel(value?: string | null) { if (!value) return '—'; return new Intl.DateTimeFormat('vi-VN',{dateStyle:'medium'}).format(new Date(value)); }
export function featureList(value?: string | null) { return (value || '').split(/\r?\n/).map((x) => x.replace(/^[-•]\s*/,'').trim()).filter(Boolean); }
export function nowIso() { return new Date().toISOString(); }
