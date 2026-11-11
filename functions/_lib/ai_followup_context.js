// Context continuity for source-backed Visitor answers in Pages Preview.
//
// Staging Worker persists its *raw model response*, while the Pages BFF may
// display a corrected, source-backed reply. When visitors react to THAT reply,
// the raw model history alone is misleading. This module only processes brief
// reactions when a server-signed, conversation-bound topic is available.
// It does not read private chats, authorize users, or invent sources.
import {verified47ReleaseAnswer} from "./ai_release_facts.js";
import {publicKnowledgeIntent,getTrainingBotPublicData,composeTrainingBotPublicAnswer} from "./ai_public_knowledge.js";

const norm=value=>String(value??"").normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d")
  .toLowerCase().replace(/\s+/g," ").trim();
export const FOLLOWUP_KINDS=Object.freeze([
  "official47","latest_release","beta47","beta_latest","news","flash"
]);

export function publicAnswerTopic(question,answer){
  if(!answer||!Array.isArray(answer.sources)||!answer.sources.length)return null;
  const intent=publicKnowledgeIntent(question);
  if(!intent)return null;
  const has=kind=>answer.sources.some(s=>s?.type===kind);
  if(intent.genericSchedule&&(has("official_claim")||has("site_news")))return "latest_release";
  if(intent.officialSchedule&&has("official_claim")&&!intent.beta)return "official47";
  if(intent.beta&&has("site_release"))
    return intent.version?.major==="V4.7"?"beta47":"beta_latest";
  if(intent.flash&&has("site_news"))return "flash";
  if(has("site_news"))return "news";
  return null;
}
export function feedbackMode(message){
  if(typeof message!=="string"||message.length<1||message.length>180)return null;
  const q=norm(message);
  // The query must NOT introduce a new version/topic, so we never override a
  // legitimate new question with context from the previous turn.
  if(/\b\d{1,2}[.,]\d{1,2}\b|\b(?:flash|beta|windows|website|admin)\b/.test(q))return null;
  if(/\b(?:tra loi do|tra loi te|tra loi ngu|tra loi sai|noi do|do the|do qua|te qua|sai roi|khong dung|khong hay|lan man|vong vo|chua dung y|khong dung y|chua ro)\b/.test(q))return "feedback";
  if(/\b(?:viet nam|tai vn|o vn|cho vn|o nuoc minh)\b/.test(q)
    &&/\b(?:the|sao|khi nao|ngay nao|may gio|gio nao|con|thi)\b/.test(q))return "vietnam";
  if(/\b(?:may gio|gio nao|gio cu the|thoi gian chinh xac|gio chinh xac)\b/.test(q))return "time";
  if(/\b(?:noi ro hon|noi lai|giai thich ro|tom lai|y la sao|cu the hon|chi tiet hon|the la sao)\b/.test(q))return "clarify";
  return null;
}
const explanatoryLead=mode=>mode==="feedback"
  ?"Mình xin lỗi, câu trước chưa giải đáp đúng ý bạn. "
  :mode==="clarify"?"Nói rõ hơn: ":"";

export async function groundedFollowup(question,topic,{fetchImpl=fetch}={}){
  const mode=feedbackMode(question);
  if(!mode||!FOLLOWUP_KINDS.includes(topic))return null;
  if(topic==="official47"){
    const verified=verified47ReleaseAnswer("bao giờ có bản update 4.7");
    const sources=verified?.sources?.filter(s=>s.type==="official_claim").slice(0,1)??[];
    const detail="PUBG MOBILE 4.7 có lịch cập nhật ngày 12/11/2026 theo thông báo khu vực Nhật Bản. "+
      "Mình chưa xác minh được giờ mở cập nhật riêng tại Việt Nam nên không nên đưa ra giờ cụ thể.";
    const follow=mode==="feedback"
      ?" Bạn muốn mình làm rõ giờ ở Việt Nam hay cách tải bản cập nhật?"
      :"";
    return {reply:explanatoryLead(mode)+detail+follow,sources};
  }
  // This data is read again from public APIs, never trusted from a client's
  // claimed text or from a stale model conversation.
  const canonical=topic==="latest_release"?"khi nào có bản update mới":
    topic==="beta47"?"Beta 4.7 bản nào mới nhất?":
    topic==="beta_latest"?"Beta mới nhất là gì?":
    topic==="flash"?"PUBG MOBILE FLASH khi nào ra mắt?":"tin PUBG mới nhất";
  const data=await getTrainingBotPublicData(canonical,{fetchImpl});
  const official=verified47ReleaseAnswer("bao giờ có bản update 4.7");
  const answer=composeTrainingBotPublicAnswer(data,{official47:official});
  if(!answer)return null;
  const intro=explanatoryLead(mode);
  return {reply:(intro+answer.reply).slice(0,3000),sources:answer.sources??[]};
}
