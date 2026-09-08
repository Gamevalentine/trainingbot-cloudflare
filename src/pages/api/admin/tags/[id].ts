import type { APIRoute } from 'astro';
import { db } from '../../../../lib/cloudflare';
import { adminError, redirect } from '../../../../lib/admin';
import { slugify } from '../../../../lib/utils';

export const POST: APIRoute = async ({request,params,url}) => {
  const id=Number(params.id); if(!Number.isInteger(id)||id<=0) return new Response('ID không hợp lệ',{status:400});
  try {
    if(url.searchParams.get('_method')==='DELETE'){await db().prepare('DELETE FROM tags WHERE id=?').bind(id).run();return redirect('/admin/tags');}
    const form=await request.formData(); const name=String(form.get('name')||'').trim(); const slug=slugify(String(form.get('slug')||name));
    if(!name||!slug) return new Response('Thiếu tên hoặc slug',{status:400});
    await db().prepare('UPDATE tags SET name=?,slug=? WHERE id=?').bind(name,slug,id).run();
    return redirect('/admin/tags');
  } catch(error){return adminError(error);}
};
