// Dated, manually reviewed release facts for Visitor Preview only.
// No live browsing, no API keys, no Production D1 and no user-controlled source URLs.
// When a date passes, this continues to describe the ANNOUNCED schedule, not the
// current availability of an app in a particular country/store.
const OFFICIAL="https://www.pubgmobile.jp/version-4-7-0-update-notice-20261105/";
const BETA="https://trainingbot.io.vn/ban-cap-nhat";
const CHECKED="2026-11-11";

const normalize=value=>String(value??"").normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").toLowerCase()
  .replace(/\s+/g," ").trim();

// Verified specific version. Do not misinterpret PUBG MOBILE FLASH as PUBG MOBILE.
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
  const official="Theo thông báo chính thức của PUBG MOBILE (khu vực Nhật Bản), phiên bản 4.7.0 có lịch cập nhật ngày 12/11/2026. Đây là ngày theo lịch đã công bố; thời điểm bản cập nhật xuất hiện trên cửa hàng có thể khác theo khu vực và thiết bị.";
  const beta="Riêng PUBG MOBILE Beta 4.7: khi đối chiếu dữ liệu công khai của TrainingBot ngày 11/11/2026, các bản V4.7.1, V4.7.2, V4.7.3 và V4.7.4 được đánh dấu đã phát hành. Đây là bản thử nghiệm, không phải bản cập nhật chính thức.";
  return {
    reply:asksBeta
      ?beta+"\n\n"+official+"\n\nĐể kiểm tra trạng thái tải Beta mới nhất, mở https://trainingbot.io.vn/ban-cap-nhat."
      :official+"\n\n"+beta+"\n\nMình dùng thông báo đã đối chiếu ngày 11/11/2026, không phải dữ liệu cửa hàng thời gian thực.",
    sources:[
      {type:"official_claim",title:"PUBG MOBILE — Thông báo cập nhật Version 4.7.0 (Nhật Bản)",
       url:OFFICIAL,sourceStatus:"official_claim_verified",gameVersion:"4.7",checkedAt:CHECKED},
      {type:"site_release",title:"TrainingBot — Danh sách phiên bản PUBG MOBILE Beta",
       url:BETA,sourceStatus:"trainingbot_public_catalog",gameVersion:"4.7",checkedAt:CHECKED}
    ]
  };
}
