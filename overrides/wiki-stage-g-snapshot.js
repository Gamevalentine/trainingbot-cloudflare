/* Wiki G read-only catalog snapshot for authorized Admin Preview tooling.
 * DATA is already public; this never exposes Admin credentials or mutates DATA.
 * Loaded only on the Wiki G Preview branch, after historical patches.
 */
(()=>{
 "use strict";
 let tries=0;
 function expose(){
  if(typeof DATA==="undefined"||!Array.isArray(DATA.weapons)||DATA.weapons.length<61||
     !Array.isArray(DATA.attachments)||DATA.attachments.length<51){
   if(++tries<160)setTimeout(expose,100);
   return;
  }
  const kinds=["weapons","attachments","vehicles","maps"];
  const snapshot={schemaVersion:"wiki-g1",capturedFrom:"live-wiki-runtime",counts:{},catalog:{}};
  for(const kind of kinds){
   snapshot.counts[kind]=DATA[kind].length;
   snapshot.catalog[kind]=DATA[kind].map((r,index)=>({
    id:kind+":"+index+":"+String(r[0]),name:String(r[0]),category:String(r[1]??""),
    fields:r.map(x=>x==null?"":String(x))
   }));
  }
  window.__TB_WIKI_G_SNAPSHOT__=Object.freeze(snapshot);
 }
 expose();
})();
