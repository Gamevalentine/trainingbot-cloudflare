# TrainingBot — Cloudflare Pages

Repository triển khai TrainingBot trên Cloudflare Pages.

- Frontend build output: `public/`
- API proxy: `functions/api/[[path]].js`
- API origin: `https://trainingbot-cloud.ai-vn.workers.dev`
- Build command: `npm run build`
- Build output directory: `public`
- Source archive: `TrainingBot_SOURCE_CLEAN.zip`

Bản source đã được dọn cho Cloudflare: không phụ thuộc Vercel, giữ route chính và API cùng domain.
