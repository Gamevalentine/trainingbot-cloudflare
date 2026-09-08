import type { APIRoute } from 'astro';
import { db } from '../../../../lib/cloudflare';
import { adminError, redirect } from '../../../../lib/admin';
import { slugify } from '../../../../lib/utils';

export const POST: APIRoute = async ({request,params,url}) => {
  const id=Number(params.id); if(!Number.isInteger(id)||id<=0) return new Response('ID không hợp lệ',{status:400});
  try {
    if(url.searchParams.get('_method')==='DELETE'){await db().prepare('DELETE FROM categories WHERE id=?').bind(id).run();return redirect('/admin/categories');}
    const form=await request.formData(); const name=String(form.get('name')||'').trim(); const slug=slugify(String(form.get('slug')||name));
    if(!name||!slug) return new Response('Thiếu tên hoặc slug',{status:400});
    const order=Number(form.get('sort_order')||0); if(!Number.isFinite(order)) return new Response('Thứ tự không hợp lệ',{status:400});
    await db().prepare('UPDATE categories SET name=?,slug=?,description=?,icon=?,sort_order=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(name,slug,String(form.get('description')||'').trim(),String(form.get('icon')||'folder').trim()||'folder',order,form.get('is_active')==='1'?1:0,id).run();
    return redirect('/admin/categories');
  } catch(error){return adminError(error);}
};
