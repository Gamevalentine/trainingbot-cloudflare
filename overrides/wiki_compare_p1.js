(()=>{
"use strict";
const root=document.getElementById("tbP1Compare"),first=document.getElementById("tbP1First"),second=document.getElementById("tbP1Second"),output=document.getElementById("tbP1Result");
if(!root||!first||!second||!output)return;
const create=(tag,label,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(label!==undefined)n.textContent=String(label);return n;};
function records(){return typeof DATA!=="undefined"&&Array.isArray(DATA.weapons)?DATA.weapons.filter(x=>Array.isArray(x)&&x.length>3):[];}
const fields=[["Nhóm súng",1],["Loại đạn",2],["Chế độ bắn",3]];
function refresh(){
 const all=records(),left=all.find(x=>x[0]===first.value),right=all.find(x=>x[0]===second.value);
 if(!left||!right){output.textContent="Chưa có dữ liệu phù hợp để so sánh.";return;}
 const build=weapon=>{
  const article=create("article",undefined,"tb-p1-weapon");article.append(create("h3",weapon[0]));
  for(const [label,pos] of fields){const line=create("div",undefined,"tb-p1-fact");line.append(create("span",label),create("b",weapon[pos]||"Chưa xác minh"));article.append(line);}
  article.append(create("p","Nguồn riêng: chưa ghi nhận · Phiên bản áp dụng: chưa xác minh · Ngày kiểm chứng: chưa có","tb-p1-status"));
  return article;
 };
 output.replaceChildren(build(left),build(right));
}
function init(){
 const all=records();if(!all.length)return;
 const a=all.find(x=>x[0]==="M416")?.[0]||all[0][0],b=all.find(x=>x[0]==="AKM")?.[0]||all[1]?.[0]||a;
 const list=()=>all.map(x=>{const op=create("option",x[0]);op.value=x[0];return op;});
 first.replaceChildren(...list());second.replaceChildren(...list());first.value=a;second.value=b;refresh();
}
first.addEventListener("change",refresh);second.addEventListener("change",refresh);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();