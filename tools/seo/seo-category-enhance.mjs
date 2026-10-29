// SEO-08 — enrich three existing placeholder categories without rewriting the site shell.
// Source pages are retained and edited only inside main; do not invent interviews.
import fs from "node:fs";
const items=[
 {file:"news-analysis.html",title:"Đọc bản cập nhật theo góc nhìn chiến thuật",
  intro:"Để đánh giá một bản cập nhật, hãy phân biệt cơ chế đã phát hành với nội dung đang được thử nghiệm. Vật phẩm, phương tiện hoặc lối chơi trong bản Beta có thể thay đổi trước ngày phát hành. Dưới đây là các bài có thật để bạn đối chiếu nội dung, thời điểm và nguồn.",
  note:"Bài viết về phiên bản cũ có thể không còn đúng với phiên bản đang hoạt động. Các chỉ số Wiki thiếu nguồn sẽ được đánh dấu tham khảo.",
  links:[
   ["PUBG Mobile 4.6: Bloodline Awakening","Đọc bài hướng dẫn và cơ chế được tổng hợp cho bản 4.6.","/news-pubg-mobile-4-6"],
   ["PUBG Mobile 4.7 Beta 1","Xem các thay đổi được đề cập trong bài Beta 1 và đối chiếu mốc thời gian.","/bai-viet/pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y"],
   ["Wiki vũ khí và bản đồ","Tra cứu theo nhóm và kiểm tra trạng thái xác minh của thông số.","/wiki"]]},
 {file:"news-featured.html",title:"Những bài viết nổi bật đã xuất bản",
  intro:"Đây là tuyển chọn bài đang có trên TrainingBot, không phải danh sách tin được làm mới tự động theo thời gian thực. Mở bài gốc để xem nội dung đầy đủ, ngày công bố và các nguồn tác giả dẫn.",
  note:"Bài được chọn không có nghĩa thông tin Beta hoặc tin đồn đã được xác nhận cho phiên bản hiện tại.",
  links:[
   ["PUBG Mobile 4.7 Beta 1","Bài tổng hợp những điều chỉnh gameplay trong giai đoạn Beta 1.","/bai-viet/pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y"],
   ["Đính chính Erangel Subzero: PUBG Mobile và PC","Đọc bản đính chính: bài cũ đã nhầm thông số PUBG PC 39.2 thành PUBG Mobile Beta.","/bai-viet/battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2"],
   ["M416 Glacier Switch Effect","Bài về hiệu ứng M416 Glacier và thông tin dành cho Việt Nam.","/bai-viet/pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin"]]},
 {file:"news-update.html",title:"Đóng góp câu chuyện cộng đồng",
  intro:"Chuyên mục dành cho chia sẻ trải nghiệm và phỏng vấn người chơi. Hiện TrainingBot chưa có bài phỏng vấn đã kiểm chứng được công bố tại đây; chúng mình không gán phát biểu cho bất kỳ người chơi hay đội tuyển nào khi chưa có nguồn xác nhận.",
  note:"Khi đề xuất phỏng vấn hoặc gửi hình ảnh, cần có sự đồng ý công bố và tránh chia sẻ thông tin riêng tư của người khác.",
  links:[
   ["Cộng đồng TrainingBot","Đến các kênh cộng đồng đã được công bố của TrainingBot.","/community"],
   ["Gửi đề xuất bài viết","Liên hệ để gửi chủ đề hoặc đính chính thông tin.","/contact"],
   ["Góc nhìn người chơi","Xem chuyên mục liên quan và những nội dung đã đăng tải.","/news-community"]]}
];
const css='<style id="tb-seo-topic-v1">'+
'.tb-seo-topic{max-width:1050px;margin:20px auto 54px;padding:0 20px;color:#dce8fa}'+
'.tb-seo-topic h2{color:#f7fbff;font-size:clamp(20px,3vw,27px);margin:16px 0}'+
'.tb-seo-topic p{max-width:850px;line-height:1.75;color:#c4d3e7}'+
'.tb-seo-topic__links{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,255px),1fr));gap:14px;margin:18px 0}'+
'.tb-seo-topic__card{display:block;padding:17px;border-radius:14px;background:#122339;border:1px solid #334a65;color:#a8e6f7;text-decoration:none}'+
'.tb-seo-topic__card strong{display:block;margin-bottom:8px;line-height:1.45}'+
'.tb-seo-topic__card span{display:block;color:#bdd0e5;font-size:13px;line-height:1.6}'+
'.tb-seo-topic__card:focus-visible{outline:3px solid #65dce8;outline-offset:3px}'+
'.tb-seo-topic p.tb-seo-topic__note{padding:12px;border-left:3px solid #5daac2;background:#0f1d30;font-size:13px}'+
'@media(max-width:500px){.tb-seo-topic{padding:0 14px}.tb-seo-topic__card{padding:14px}}'+
'</style>';
const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
for(const item of items){
 const file="public/"+item.file;
 if(!fs.existsSync(file))throw Error("Missing original category "+file);
 let h=fs.readFileSync(file,"utf8");
 if(!/<\/main>/i.test(h)||!/<\/head>/i.test(h)||h.includes('id="tb-seo-topic-v1"'))throw Error("Unexpected category markup "+file);
 const cards=item.links.map(x=>'<a class="tb-seo-topic__card" href="'+x[2]+'"><strong>'+esc(x[0])+'</strong><span>'+esc(x[1])+'</span></a>').join("\n");
 const section='<section class="tb-seo-topic" id="tb-seo-topic-section" aria-labelledby="tb-seo-topic-title">'+
 '<h2 id="tb-seo-topic-title">'+esc(item.title)+'</h2><p>'+esc(item.intro)+'</p>'+
 '<div class="tb-seo-topic__links">'+cards+'</div><p class="tb-seo-topic__note">'+esc(item.note)+'</p></section>';
 if((section.match(/href="/g)||[]).length!==3)throw Error("Expected three internal links "+file);
 const placeholder="Nội dung của chuyên mục này đang được gom lại từ các bài đã xuất bản. Trang này được phục hồi để liên kết không còn lỗi trong khi không tự thêm thông tin chưa kiểm chứng.";
 if(!h.includes(placeholder))throw Error("Expected original placeholder before enhancement: "+file);
 h=h.replace(placeholder,"Khám phá các bài và kênh liên quan được TrainingBot giới thiệu bên dưới.");
 h=h.replace(/<\/head>/i,css+"\n</head>").replace(/<\/main>/i,section+"\n</main>");
 fs.writeFileSync(file,h);
 console.log("SEO-08 improved "+item.file+" with 3 verified internal routes");
}
