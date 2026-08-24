# TrainingBot — Cloudflare Pages

Nguồn triển khai TrainingBot trên Cloudflare Pages.

- Frontend: Cloudflare Pages
- API proxy: `functions/api/[[path]].js`
- API origin: `https://trainingbot-cloud.ai-vn.workers.dev`
- Build command: `npm run build`
- Build output directory: `public`

Source frontend được lưu dưới dạng các phần base64 `source.part*.b64`; lệnh build sẽ ghép và giải nén thành thư mục `public/`.
