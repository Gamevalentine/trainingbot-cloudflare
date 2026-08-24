# TrainingBot — Cloudflare Pages

Repository triển khai TrainingBot trên Cloudflare Pages.

- Frontend build output: `public/`
- API proxy: `functions/api/[[path]].js`
- API origin: `https://trainingbot-cloud.ai-vn.workers.dev`
- Build command: `npm run build`
- Build output directory: `public`

Source tĩnh được chia trong `source_parts/` để GitHub lưu ổn định. Lệnh build ghép các phần, kiểm tra ZIP rồi tạo lại `public/` trước khi Cloudflare Pages triển khai.
