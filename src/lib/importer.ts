import { db, media } from './cloudflare';
import { externalUrl, readLimitedText, resolveExternal, safeFetch } from './external';
import { slugify } from './utils';

function decodeHtml(value: string) {
  const common:Record<string,string>={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi,(_,code:string)=>{
    if(code[0]==='#'){const hex=code[1]?.toLowerCase()==='x';const n=parseInt(code.slice(hex?2:1),hex?16:10);return Number.isFinite(n)?String.fromCodePoint(n):'';}
    return common[code.toLowerCase()] ?? `&${code};`;
  }).replace(/\s+/g,' ').trim();
}

function attr(tag:string,name:string){
  const m=tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`,'i')) || tag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`,'i'));
  return m?.[1] ? decodeHtml(m[1]) : '';
}

function metadata(html:string, pageUrl:URL){
  const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map((m)=>m[0]);
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map((m)=>m[0]);
  const meta=(key:string)=>{for(const tag of metas){const k=(attr(tag,'property')||attr(tag,'name')).toLowerCase();if(k===key.toLowerCase())return attr(tag,'content');}return '';};
  const title=meta('og:title') || decodeHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const description=meta('og:description') || meta('description');
  const image=meta('og:image') || meta('twitter:image');
  let icon='';
  for(const tag of links){if(/\bicon\b/i.test(attr(tag,'rel'))){icon=attr(tag,'href');if(icon)break;}}
  const safeResolve=(value:string)=>{try{return value?resolveExternal(pageUrl,value).toString():'';}catch{return '';}};
  return { title, description, image:safeResolve(image), icon:safeResolve(icon)||new URL('/favicon.ico',pageUrl).toString() };
}
async function uniqueSlug(base:string){
  const root=slugify(base)||'website'; let candidate=root; let index=2;
  while(await db().prepare('SELECT id FROM apps WHERE slug=?').bind(candidate).first()) candidate=`${root}-${index++}`;
  return candidate;
}

async function storeRemoteImage(url:string,prefix:string){
  if(!url) return '';
  try{
    const {response}=await safeFetch(url,{headers:{Accept:'image/*'}});
    const type=String(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    if(!response.ok || !type.startsWith('image/')){try{await response.body?.cancel();}catch{} return '';}
    const max=5*1024*1024; const reader=response.body?.getReader(); if(!reader)return '';
    const chunks:Uint8Array[]=[];let total=0;
    while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>max){await reader.cancel();return '';}chunks.push(value);}
    const merged=new Uint8Array(total);let offset=0;for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.byteLength;}
    const ext=type==='image/png'?'png':type==='image/webp'?'webp':type==='image/svg+xml'?'svg':type==='image/gif'?'gif':'jpg';
    const key=`${prefix}/${crypto.randomUUID()}.${ext}`;
    await media().put(key,merged,{httpMetadata:{contentType:type}});return key;
  }catch{return '';}
}

export async function importWebsite(rawUrl:string,categoryId:number|null=null){
  const requested=externalUrl(rawUrl);
  const duplicate=await db().prepare('SELECT id FROM apps WHERE production_url=?').bind(requested.toString()).first<{id:number}>();
  if(duplicate)return {id:duplicate.id,existing:true};
  const {response,url}=await safeFetch(requested,{headers:{Accept:'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5'}});
  const finalDuplicate=await db().prepare('SELECT id FROM apps WHERE production_url=?').bind(url.toString()).first<{id:number}>();
  if(finalDuplicate){try{await response.body?.cancel();}catch{} return {id:finalDuplicate.id,existing:true};}
  const contentType=String(response.headers.get('content-type')||'').toLowerCase();
  const html=contentType.includes('text/html')?await readLimitedText(response):'';
  const meta=html?metadata(html,url):{title:'',description:'',image:'',icon:new URL('/favicon.ico',url).toString()};
  const name=(meta.title||url.hostname.replace(/^www\./,'')).slice(0,160);
  const slug=await uniqueSlug(name);
  const description=meta.description.slice(0,1000);
  const healthy=(response.status>=200&&response.status<400)||[401,403,429].includes(response.status);
  const result=await db().prepare(`INSERT INTO apps (name,slug,production_url,short_description,description,category_id,status,visibility,pricing_type,platform,search_keywords,monitor_enabled,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
    .bind(name,slug,url.toString(),description,description,categoryId,healthy?'active':'offline','private','free','web',`${name}, ${url.hostname}`,1).run();
  const id=Number(result.meta.last_row_id);
  try{
    const [iconKey,coverKey]=await Promise.all([
      storeRemoteImage(meta.icon,`apps/${id}/icon`),
      storeRemoteImage(meta.image,`apps/${id}/cover`)
    ]);
    await db().prepare('UPDATE apps SET icon_key=?,cover_key=? WHERE id=?').bind(iconKey,coverKey,id).run();
    await db().prepare('INSERT INTO app_status_history (app_id,old_status,new_status) VALUES (?,NULL,?)').bind(id,healthy?'active':'offline').run();
    return {id,existing:false,icon:!!iconKey,cover:!!coverKey};
  }catch(error){
    await db().prepare('DELETE FROM apps WHERE id=?').bind(id).run().catch(()=>{});
    throw error;
  }
}
