import type { APIRoute } from 'astro';
import { db } from '../../../../lib/cloudflare';
import { adminError, redirect } from '../../../../lib/admin';
import { trackAdminActivity } from '../../../../lib/db';

const VISIBILITIES = new Set(['public','private']);

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const action = String(form.get('action') || '');
    const visibility = action === 'publish' ? 'public' : action === 'private' ? 'private' : '';
    if (!VISIBILITIES.has(visibility)) throw new Error('Thao tác không hợp lệ');
    const ids = [...new Set(form.getAll('ids').map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    if (!ids.length) throw new Error('Chưa chọn website nào');
    if (ids.length > 100) throw new Error('Chỉ có thể xử lý tối đa 100 website mỗi lần');
    await db().batch(ids.map((id) => db().prepare('UPDATE apps SET visibility=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(visibility,id)));
    await trackAdminActivity(`bulk_visibility:${visibility}:${ids.length}`);
    return redirect(`/admin/apps?bulk=${visibility}&count=${ids.length}`);
  } catch (error) { return adminError(error); }
};
