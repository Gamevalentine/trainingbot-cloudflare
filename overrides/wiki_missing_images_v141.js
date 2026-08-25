(()=>{
  if(!document.getElementById('tbWikiGrid'))return;
  const EXTRA={
    'Bộ nạp nhanh súng săn':'https://www.pubgmobile.com/images/event/PUBGMOBILE-WIKI9/attachments/Icon_Shotgun_Quick_Loader.png',
    'Khiên súng':'https://pbs.twimg.com/media/Fr3Fv8xWwAAH4SA.jpg',
    'Bộ chuyển chế độ tự động':'https://img.gurugamer.com/resize/740x-/photo_galleries/2023/11/21/remove-the-attachment-842a.jpg'
  };
  const style=document.createElement('style');
  style.textContent=`
    #tbWikiGrid .tb-card-visual.tb-glyph{display:flex!important;font-size:0!important}
    #tbWikiGrid .tb-v141-crop .tb-card-visual img{width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:cover!important;object-position:center!important}
  `;
  document.head.append(style);

  function apply(){
    document.querySelectorAll('#tbWikiGrid .tb-wiki-card').forEach(card=>{
      const name=card.querySelector('h3')?.textContent.trim()||'';
      const src=EXTRA[name];
      if(!src)return;
      const visual=card.querySelector('.tb-card-visual');
      if(!visual||visual.dataset.v141===src)return;
      const old=visual.innerHTML;
      const img=document.createElement('img');
      img.className='tb-real-item-image';
      img.alt=name;
      img.loading='lazy';
      img.decoding='async';
      img.referrerPolicy='no-referrer';
      img.onerror=()=>{delete visual.dataset.v141;visual.innerHTML=old;};
      visual.dataset.v141=src;
      visual.classList.add('tb-real-image');
      card.classList.toggle('tb-v141-crop',name!=='Bộ nạp nhanh súng săn');
      visual.replaceChildren(img);
      img.src=src;
    });
  }
  let queued=false;
  const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});});
  observer.observe(document.getElementById('tbWikiGrid'),{childList:true,subtree:true});
  apply();
})();