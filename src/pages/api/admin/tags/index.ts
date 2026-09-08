import type { APIRoute } from 'astro';
import { db } from '../../../../lib/cloudflare';
import { adminError, redirect } from '../../../../lib/admin';
import { slugify } from '../../../../lib/utils';

export const POST: APIRoute = async ({request}) => {
  try {
    const form=await request.formData(); const name=String(form.get('name')||'').trim(); const slug=slugify(String(form.get('slug')||name));
    if(!name||!slug) return new Response('Thiếu tên hoặc slug',{status:400});
    await db().prepare('INSERT INTO tags (name,slug) VALUES (?,?)').bind(name,slug).run();
    return redirect('/admin/tags');
  } catch(error){return adminError(error);}
};
