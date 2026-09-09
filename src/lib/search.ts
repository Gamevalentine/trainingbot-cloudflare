import type { AppRecord } from './types';
import { normalizeSearch, tokenizeSearch } from './utils';

const GENERIC = new Set(['cong','cu','ung','dung','web','trang','online','tim','kiem','giup','phan','mem','app','tool','tao']);
const INTENTS = [
  ['y khoa','medical','y te','bac si','lam sang','cap cuu','benh hoc','hoc y','on thi'],
  ['thiet ke','design','ui','ux','giao dien','prototype','material','canvas','figma','canva','photoshop'],
  ['mang xa hoi','social','community','cong dong','facebook'],
  ['ban hang','thuong mai','ecommerce','shop','thanh toan','don hang','template','ban website'],
  ['to tinh','thu tinh','sinh nhat','ky niem','qua tang','album','story','mini website'],
  ['quan tri','admin','dashboard','dieu phoi'],
] as const;
const INTENT_LABELS:Record<string,string>={'y khoa':'Y khoa','thiet ke':'Thiết kế','mang xa hoi':'Mạng xã hội','ban hang':'Bán hàng','to tinh':'Trải nghiệm cá nhân','quan tri':'Quản lý'};
function hasTerm(text:string,term:string){const t=normalizeSearch(term);return t.includes(' ')?text.includes(t):text.split(' ').includes(t);}

function distance(a:string,b:string){
  if(a===b)return 0; if(!a.length)return b.length; if(!b.length)return a.length;
  const row=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old;}}
  return row[b.length];
}
function tokenMatch(text:string,token:string){
  if(!token||!text)return 0;
  const words=text.split(' ');
  if(words.includes(token))return 1;
  if(token.length>=4&&text.includes(token))return .88;
  let best=0;
  for(const word of words){
    if(word.length<5||token.length<5)continue;
    if(word.startsWith(token)||token.startsWith(word))best=Math.max(best,.82);
    if(word[0]!==token[0])continue;
    const d=distance(word,token);
    if(d===1)best=Math.max(best,.72);
    else if(d===2&&Math.max(word.length,token.length)>=8)best=Math.max(best,.52);
  }
  return best;
}

function intentTerms(query:string){
  const normalized=normalizeSearch(query); const found:string[]=[];
  for(const group of INTENTS){
    if(group.some((term)=>hasTerm(normalized,term))){
      for(const term of group)found.push(...normalizeSearch(term).split(' '));
    }
  }
  return [...new Set(found.filter((x)=>x.length>1))];
}
export function rankSearch(query:string,candidates:AppRecord[]){
  const normalized=normalizeSearch(query);
  const rawTokens=tokenizeSearch(query);
  const directTokens=rawTokens.filter((x)=>!GENERIC.has(x));
  const expanded=intentTerms(query).filter((x)=>!directTokens.includes(x));
  const labels=INTENTS.filter((group)=>group.some((term)=>hasTerm(normalized,term))).map((group)=>INTENT_LABELS[group[0]]||group[0]);
  const ranked=candidates.map((app)=>{
    const fields:[string,number][]=[
      [app.name,15],[app.search_keywords,12],[app.primary_use,11],[app.tag_names||'',10],
      [app.category_name||'',9],[app.short_description,7],[app.features,6],[app.description,4],[app.audience,3],
    ];
    let score=0; let phrase=false; const matched=new Set<string>(); const coreMatched=new Set<string>(); let intentHits=0;
    for(const [value,weight] of fields){
      const text=normalizeSearch(value||''); if(!text)continue;
      if(normalized&&text===normalized){score+=weight*7;phrase=true;}
      else if(normalized.length>=3&&text.includes(normalized)){score+=weight*4;phrase=true;}
      for(const token of directTokens){const m=tokenMatch(text,token);if(m){score+=weight*m;if(m>=.7){matched.add(token);if(weight>=7)coreMatched.add(token);}}}
      for(const token of expanded){const m=tokenMatch(text,token);if(m>=.7){score+=weight*m*.34;intentHits++;}}
    }
    const coverage=directTokens.length?matched.size/directTokens.length:0; const coreCoverage=directTokens.length?coreMatched.size/directTokens.length:0;
    score+=coverage*18+Math.min(intentHits,4)*2+(app.featured?1:0);
    const minCoverage=directTokens.length>=2?.75:.5;
    const eligible=phrase||coreCoverage>=minCoverage||(directTokens.length===1&&coreMatched.size===1)||(intentHits>=2&&score>=30);
    return {app,score,coverage,coreCoverage,eligible,phrase,intentHits};
  }).filter((x)=>x.score>1);
  ranked.sort((a,b)=>b.score-a.score||b.app.featured-a.app.featured||String(b.app.updated_at).localeCompare(String(a.app.updated_at)));
  const minMain=Math.max(18,(ranked[0]?.score||0)*.28);
  const mainRows=ranked.filter((x)=>x.eligible&&x.score>=minMain); const mainIds=new Set(mainRows.map((x)=>x.app.id));
  const strong=mainRows.map((x)=>x.app);
  const suggestions=strong.length?[]:ranked.filter((x)=>!mainIds.has(x.app.id)&&x.score>=12&&(x.phrase||x.coverage>=.67||x.intentHits>=2)&&(x.coreCoverage>0||x.intentHits>=2)).slice(0,4).map((x)=>x.app);
  return {apps:strong,suggestions,intents:[...new Set(labels)]};
}
