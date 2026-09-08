import type { APIRoute } from 'astro';
import { db } from '../../../../lib/cloudflare';
import { adminError, redirect } from '../../../../lib/admin';
import { slugify } from '../../../../lib/utils';

export const POST: APIRoute = async ({ request }) => {
  try {
    const form=await request.formData(); const name=String(form.get('name')||'').trim(); const slug=slugify(String(form.get('slug')||name));
    if(!name || !slug) return new Response('Thiếu tên hoặc slug',{status:400});
    const order=Number(form.get('sort_order')||0); if(!Number.isFinite(order)) return new Response('Thứ tự không hợp lệ',{status:400});
    await db().prepare('INSERT INTO categories (name,slug,description,icon,sort_order) VALUES (?,?,?,?,?)').bind(name,slug,String(form.get('description')||'').trim(),String(form.get('icon')||'folder').trim()||'folder',order).run();
    return redirect('/admin/categories');
  } catch(error) { return adminError(error); }
};
