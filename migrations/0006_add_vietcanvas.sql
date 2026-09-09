INSERT OR IGNORE INTO apps (
  name, slug, production_url, cloudflare_project,
  short_description, description, primary_use, audience, features,
  category_id, status, visibility, featured, pricing_type, platform,
  tech_stack, version, search_keywords, monitor_enabled, updated_at
) VALUES (
  'VietCanvas', 'vietcanvas', 'https://vietcanvas.pages.dev/', 'vietcanvas',
  'Trình thiết kế giao diện Material 3 Expressive bằng kéo thả, hỗ trợ tiếng Việt và AI.',
  'Thiết kế nhanh giao diện ứng dụng trên canvas, tạo nhiều màn hình, thiết lập hành vi chuyển trang, xem trước và sinh lời nhắc chi tiết cho AI lập trình.',
  'Thiết kế giao diện app và tạo prompt triển khai từ bản phác thảo.',
  'Nhà phát triển, nhà thiết kế UI/UX và người dùng muốn dựng giao diện ứng dụng nhanh.',
  '["Kéo thả thành phần Material 3","Thiết kế nhiều màn hình","Xem trước luồng tương tác","Tạo prompt cho AI","Giao diện tiếng Việt"]',
  (SELECT id FROM categories WHERE slug = 'thiet-ke' LIMIT 1),
  'active', 'public', 1, 'free', 'web',
  'Next.js, React, TypeScript, Material 3 Expressive', '1.0.0',
  'thiết kế giao diện, UI UX, Material 3, kéo thả, canvas, AI, tạo app, prototype, vietcanvas',
  1, CURRENT_TIMESTAMP
);
