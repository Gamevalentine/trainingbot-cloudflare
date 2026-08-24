# TrainingBot — Cloudflare Pages

Nguồn triển khai TrainingBot trên Cloudflare Pages.

- Frontend: Cloudflare Pages
- API proxy: `functions/api/[[path]].js`
- API origin: `https://trainingbot-cloud.ai-vn.workers.dev`
- Build command: `npm run build`
- Build output directory: `public`

Frontend được đóng trong file `TrainingBot_Cloudflare_Pages_C1.zip`. Lệnh build sẽ giải nén thư mục `public/` từ file ZIP này; Cloudflare Pages Functions nằm trực tiếp trong `functions/` để `/api/*` tiếp tục proxy sang Worker hiện tại.
