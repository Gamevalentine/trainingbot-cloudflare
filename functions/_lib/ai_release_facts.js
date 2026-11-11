// Reviewed public announcement for PUBG MOBILE global update 4.7.
// The direct global publisher post and TrainingBot's own article BOTH confirm
// 12 November 2026. No regional Japan-only attribution, invented update hour,
// unverified store rollout status, or inferred Vietnamese VNG release time.
// Only used in Visitor Preview; URLs are immutable and allowlisted by BFF/UI.
const GLOBAL="https://www.instagram.com/reel/DfbazBRtgl5/";
const TRAININGBOT="https://trainingbot.io.vn/bai-viet/pubg-mobile-4-7-chinh-thuc-ra-mat-ngay-12-11-2026-lich-cap-nhat-va-nhung-dieu-can-biet";
const BETA="https://trainingbot.io.vn/ban-cap-nhat";
const CHECKED="2026-11-11";

const normalize=value=>String(value??"").normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").toLowerCase()
  .replace(/\s+/g," ").trim();

function isVersion47(query){
  return /(?:^|[^a-z0-9])(?:v(?:ersion)?\s*)?4\s*[.,]\s*7(?:\s*[.,]\s*\d+)?(?=$|[^0-9])/.test(query);
}
function isReleaseQuestion(query){
  return /\b(?:bao gio|khi nao|ngay nao|luc nao|lich|phat hanh|ra mat|update|cap nhat|tai|co chua|da co|ra ban|du kien|chinh thuc)\b/.test(query);
}
export function verified47ReleaseAnswer(question){
  if(typeof question!=="string"||question.length>3000)return null;
  const q=normalize(question);
  if(!isVersion47(q)||/\bflash\b/.test(q))return null;
  const asksBeta=/\bbeta\b|\bthu nghiem\b/.test(q);
  if(!asksBeta&&!isReleaseQuestion(q))return null;

  if(asksBeta)return {
    reply:"Theo danh sách Beta TrainingBot được đối chiếu ngày 11/11/2026, các bản thử nghiệm V4.7.1, V4.7.2, V4.7.3 và V4.7.4 đều được đánh dấu đã phát hành. Đây là Beta, không phải bản cập nhật chính thức.",
    sources:[{type:"site_release",title:"TrainingBot — Các bản PUBG MOBILE Beta",
      url:BETA,sourceStatus:"trainingbot_public_catalog",gameVersion:"4.7",checkedAt:CHECKED}]
  };

  return {
    reply:"PUBG MOBILE 4.7 bản quốc tế (Global) cập nhật ngày 12/11/2026.",
    sources:[
      {type:"official_claim",title:"PUBG MOBILE quốc tế — Công bố lịch ra mắt bản 4.7",
       url:GLOBAL,sourceStatus:"official_claim_verified",gameVersion:"4.7",checkedAt:CHECKED},
      {type:"site_news",title:"TrainingBot — Lịch cập nhật PUBG MOBILE 4.7 ngày 12/11/2026",
       url:TRAININGBOT,sourceStatus:"trainingbot_published_article",gameVersion:"4.7",
       publishedAt:"2026-11-06",checkedAt:CHECKED}
    ]
  };
}
