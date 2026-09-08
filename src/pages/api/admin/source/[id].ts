import type { APIRoute } from 'astro';
import { media } from '../../../../lib/cloudflare';
import { sourceArchive } from '../../../../lib/admin';

export const GET: APIRoute = async ({params}) => {
  const id=Number(params.id); if(!Number.isInteger(id)||id<=0)return new Response('ID không hợp lệ',{status:400});
  const source=await sourceArchive(id); if(!source?.key)return new Response('Chưa có source archive',{status:404});
  const object=await media().get(source.key); if(!object)return new Response('Source archive không còn trên R2',{status:404});
  const name=String(source.original_name||`source-${id}.zip`).replace(/["\r\n\\/]/g,'_');
  const headers=new Headers(); object.writeHttpMetadata(headers); headers.set('Content-Disposition',`attachment; filename="${name}"`); headers.set('Cache-Control','no-store');
  return new Response(object.body,{headers});
};
