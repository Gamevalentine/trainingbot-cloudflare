// LIC-04 deterministic original PNG share images, no fonts, images, external
// libraries or network. The glyphs/pixels are drawn by this source code only.
// SVGs remain the crisp visual covers; PNGs make social previews compatible.
import fs from "node:fs";
import zlib from "node:zlib";
const W=1200,H=630;
const designs=[
 ["erangel","ERANGEL","SUBZERO","#061a29","#10576c","#a8ebff","ice"],
 ["beta-47","PUBG MOBILE","BETA 4.7","#0b1733","#284a88","#8befff","grid"],
 ["m416-glacier","M416","GLACIER","#091832","#3155a9","#8dbaff","crystal"],
 ["midnight-hunters","MIDNIGHT","HUNTERS","#1e0d28","#8c3555","#ffa9ae","moon"],
 ["one-punch-man","ONE-PUNCH","MAN","#2d1230","#ac5924","#ffcf7b","pulse"]
];
const glyph={
 A:["01110","10001","10001","11111","10001","10001","10001"],
 B:["11110","10001","10001","11110","10001","10001","11110"],
 C:["01111","10000","10000","10000","10000","10000","01111"],
 D:["11110","10001","10001","10001","10001","10001","11110"],
 E:["11111","10000","10000","11110","10000","10000","11111"],
 F:["11111","10000","10000","11110","10000","10000","10000"],
 G:["01111","10000","10000","10111","10001","10001","01111"],
 H:["10001","10001","10001","11111","10001","10001","10001"],
 I:["11111","00100","00100","00100","00100","00100","11111"],
 J:["00111","00010","00010","00010","10010","10010","01100"],
 K:["10001","10010","10100","11000","10100","10010","10001"],
 L:["10000","10000","10000","10000","10000","10000","11111"],
 M:["10001","11011","10101","10101","10001","10001","10001"],
 N:["10001","11001","10101","10011","10001","10001","10001"],
 O:["01110","10001","10001","10001","10001","10001","01110"],
 P:["11110","10001","10001","11110","10000","10000","10000"],
 Q:["01110","10001","10001","10001","10101","10010","01101"],
 R:["11110","10001","10001","11110","10100","10010","10001"],
 S:["01111","10000","10000","01110","00001","00001","11110"],
 T:["11111","00100","00100","00100","00100","00100","00100"],
 U:["10001","10001","10001","10001","10001","10001","01110"],
 V:["10001","10001","10001","10001","10001","01010","00100"],
 W:["10001","10001","10001","10101","10101","10101","01010"],
 X:["10001","10001","01010","00100","01010","10001","10001"],
 Y:["10001","10001","01010","00100","00100","00100","00100"],
 Z:["11111","00001","00010","00100","01000","10000","11111"],
 "0":["01110","10011","10101","10101","11001","10001","01110"],
 "1":["00100","01100","00100","00100","00100","00100","01110"],
 "2":["01110","10001","00001","00010","00100","01000","11111"],
 "3":["11110","00001","00001","01110","00001","00001","11110"],
 "4":["00010","00110","01010","10010","11111","00010","00010"],
 "5":["11111","10000","10000","11110","00001","00001","11110"],
 "6":["01110","10000","10000","11110","10001","10001","01110"],
 "7":["11111","00001","00010","00100","01000","01000","01000"],
 "8":["01110","10001","10001","01110","10001","10001","01110"],
 "9":["01110","10001","10001","01111","00001","00001","01110"],
 " ":["00000","00000","00000","00000","00000","00000","00000"],
 "-":["00000","00000","00000","11111","00000","00000","00000"],
 ".":["00000","00000","00000","00000","00000","01100","01100"],
 "/":["00001","00001","00010","00100","01000","10000","10000"],
 ":":["00000","01100","01100","00000","01100","01100","00000"]
};
const hex=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-t)+b[i]*t));
function pngBytes(id,a,b,accent,motif,title1,title2){
 const arr=Buffer.alloc(W*H*4),col1=hex(a),col2=hex(b),bright=hex(accent);
 function set(x,y,col,alpha=1){
  if(x<0||x>=W||y<0||y>=H)return;
  const p=(Math.floor(y)*W+Math.floor(x))*4;
  for(let i=0;i<3;i++)arr[p+i]=Math.max(0,Math.min(255,Math.round(arr[p+i]*(1-alpha)+col[i]*alpha)));
  arr[p+3]=255;
 }
 for(let y=0;y<H;y++){
  for(let x=0;x<W;x++){
   const t=Math.min(1,Math.max(0,x/W*.65+y/H*.35));
   let col=mix(col1,col2,t);
   const glow=Math.max(0,1-Math.hypot((x-1010)/560,(y-290)/470));
   col=mix(col,bright,glow*.10);
   if(x%80===0||y%80===0)col=mix(col,bright,.075);
   const p=(y*W+x)*4;arr[p]=col[0];arr[p+1]=col[1];arr[p+2]=col[2];arr[p+3]=255;
  }
 }
 const rect=(x,y,w,h,c,alpha=1)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)set(xx,yy,c,alpha)};
 const line=(x0,y0,x1,y1,c,alpha=1,width=2)=>{
  const dx=x1-x0,dy=y1-y0,steps=Math.ceil(Math.hypot(dx,dy));
  for(let i=0;i<=steps;i++){
   let x=Math.round(x0+dx*i/Math.max(1,steps)),y=Math.round(y0+dy*i/Math.max(1,steps));
   rect(x-Math.floor(width/2),y-Math.floor(width/2),width,width,c,alpha);
  }
 };
 const ring=(cx,cy,r,c,alpha=.6,width=3)=>{
  for(let i=0;i<Math.ceil(2*Math.PI*r*2);i++){
   const t=2*Math.PI*i/Math.ceil(2*Math.PI*r*2);
   const x=Math.round(cx+Math.cos(t)*r),y=Math.round(cy+Math.sin(t)*r);
   rect(x,y,width,width,c,alpha);
  }
 };
 if(motif==="ice"){
  line(855,565,1045,108,bright,.4,5);
  line(1045,108,1200,540,bright,.4,5);
  line(898,530,1146,205,bright,.25,5);
  line(1146,205,1225,540,bright,.25,5);
 }else if(motif==="grid"){
  for(let i=760;i<1200;i+=54)line(i,70,i,555,bright,.22,2);
  for(let i=100;i<550;i+=54)line(735,i,1200,i,bright,.22,2);
  ring(1020,290,160,bright,.6,4);ring(1020,290,88,bright,.3,3);
 }else if(motif==="crystal"){
  line(820,390,1020,85,bright,.53,5);line(1020,85,1190,390,bright,.53,5);
  line(820,390,1020,560,bright,.5,5);line(1020,560,1190,390,bright,.5,5);
  line(820,390,1190,390,bright,.35,3);line(1020,85,1020,560,bright,.35,3);
 }else if(motif==="moon"){
  ring(1010,275,173,bright,.25,7);ring(1010,275,147,bright,.50,6);
  for(let i=0;i<9;i++)rect(770+i*51,430-(i%3)*35,35,195+(i%3)*35,col1,.82);
 }else{
  ring(1030,290,165,bright,.53,6);ring(1030,290,105,bright,.27,4);
  for(let i=0;i<9;i++){const angle=(i/9)*Math.PI*2;line(
   1030+Math.cos(angle)*175,290+Math.sin(angle)*175,
   1030+Math.cos(angle)*285,290+Math.sin(angle)*285,bright,.24,5)}
 }
 rect(66,82,10,448,bright,1);
 line(112,365,725,365,bright,.8,3);
 function txt(x,y,text,scale,color){
  let cursor=x;
  for(const ch of text){
   const pattern=glyph[ch]||glyph[" "];
   for(let r=0;r<7;r++)for(let k=0;k<5;k++)
     if(pattern[r][k]==="1")rect(cursor+k*scale,y+r*scale,scale-1,scale-1,color,1);
   cursor+=scale*6;
  }
 }
 txt(114,100,"TRAININGBOT / ORIGINAL EDITORIAL ART",4,bright);
 txt(114,211,title1,12,[248,251,255]);
 txt(114,311,title2,12,bright);
 txt(114,425,"NEWS / VERIFIED SOURCES / 2026",5,[232,239,251]);
 txt(114,525,"INDEPENDENT ARTICLE ILLUSTRATION",4,[236,242,252]);
 txt(114,570,"NOT OFFICIAL GAME OR PARTNER ARTWORK",3,[205,212,227]);
 const rows=Buffer.alloc(H*(1+W*4));
 for(let y=0;y<H;y++){
  const off=y*(1+W*4);rows[off]=0;arr.copy(rows,off+1,y*W*4,(y+1)*W*4);
 }
 const crcTable=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);crcTable[n]=c>>>0}
 const crc=b=>{let c=0xFFFFFFFF;for(const v of b)c=crcTable[(c^v)&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
 const chunk=(type,data)=>{
  const t=Buffer.from(type,"ascii"),len=Buffer.alloc(4);len.writeUInt32BE(data.length);
  const c=Buffer.alloc(4);c.writeUInt32BE(crc(Buffer.concat([t,data])));
  return Buffer.concat([len,t,data,c]);
 };
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  chunk("IHDR",ihdr),chunk("IDAT",zlib.deflateSync(rows,{level:9})),chunk("IEND",Buffer.alloc(0))]);
}
fs.mkdirSync("public",{recursive:true});
for(const [id,t1,t2,bg1,bg2,accent,motif] of designs){
 const out="public/editorial-original-"+id+".png";
 const bytes=pngBytes(id,bg1,bg2,accent,motif,t1,t2);
 fs.writeFileSync(out,bytes);
 console.log("LIC04_GENERATED_PNG",JSON.stringify({id,path:out,width:W,height:H,bytes:bytes.length}));
}
