(()=>{
  const style=document.createElement('style');
  style.id='tb-wiki-strict-v140';
  style.textContent=`
    #tbWikiGrid{align-items:stretch!important}
    #tbWikiGrid .tb-wiki-card{height:310px!important;min-height:310px!important;max-height:310px!important;display:flex!important;flex-direction:column!important;padding:0 14px 14px!important;overflow:hidden!important}
    #tbWikiGrid .tb-card-tag{left:14px!important;top:14px!important;z-index:5!important}
    #tbWikiGrid .tb-card-visual{width:100%!important;height:154px!important;min-height:154px!important;max-height:154px!important;margin:14px 0 10px!important;padding:12px!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:14px!important;background:linear-gradient(145deg,#eeeeeb,#dadbdd)!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;box-sizing:border-box!important}
    #tbWikiGrid .tb-card-visual svg,#tbWikiGrid .tb-card-visual.tb-glyph{display:none!important}
    #tbWikiGrid .tb-card-visual img,#tbWikiGrid .tb-real-item-image{display:block!important;width:auto!important;height:auto!important;max-width:94%!important;max-height:126px!important;object-fit:contain!important;object-position:center!important;margin:auto!important;border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;filter:none!important}
    #tbWikiGrid .tb-wiki-card h3{height:52px!important;min-height:52px!important;max-height:52px!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;overflow:hidden!important;line-height:1.22!important}
    #tbWikiGrid .tb-wiki-card p{height:40px!important;min-height:40px!important;max-height:40px!important;margin:0!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;text-align:center!important;overflow:hidden!important;line-height:1.35!important}
    #tbWikiGrid .tb-vehicle-speed{height:28px!important;min-height:28px!important;max-height:28px!important;margin:0!important;padding-top:3px!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;text-align:center!important;overflow:hidden!important}
    #tbWikiGrid .tb-v140-map .tb-card-visual{padding:0!important;background:#0b0c0f!important}
    #tbWikiGrid .tb-v140-map .tb-card-visual img{width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:cover!important;border-radius:13px!important}
    #tbWikiGrid .tb-v140-mobile-only .tb-card-visual img{max-width:88%!important;max-height:118px!important}
    @media(max-width:700px){
      #tbWikiGrid .tb-wiki-card{height:244px!important;min-height:244px!important;max-height:244px!important;padding:0 8px 10px!important}
      #tbWikiGrid .tb-card-visual{height:112px!important;min-height:112px!important;max-height:112px!important;margin:8px 0 8px!important;padding:8px!important;border-radius:11px!important}
      #tbWikiGrid .tb-card-visual img,#tbWikiGrid .tb-real-item-image{max-width:94%!important;max-height:92px!important}
      #tbWikiGrid .tb-wiki-card h3{height:46px!important;min-height:46px!important;max-height:46px!important;font-size:.92rem!important}
      #tbWikiGrid .tb-wiki-card p{height:34px!important;min-height:34px!important;max-height:34px!important;font-size:.67rem!important}
      #tbWikiGrid .tb-vehicle-speed{height:24px!important;min-height:24px!important;max-height:24px!important;font-size:.63rem!important}
      #tbWikiGrid .tb-v140-mobile-only .tb-card-visual img{max-width:90%!important;max-height:86px!important}
    }
  `;
  document.head.append(style);

  const maps=new Set(['Erangel','Miramar','Sanhok','Vikendi','Livik','Karakin','Nusa','Rondo']);
  const mobileOnly=new Set(['Honey Badger','ASM Abakan','JS9','M1014','NS2000']);

  function upgradeOfficialWeapon(img){
    const src=img.currentSrc||img.src||'';
    if(!src.includes('raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Weapon/Main/'))return;
    let better=null;
    if(src.endsWith('_w.png'))better=src.slice(0,-6)+'_h.png';
    else if(/_C\.png(?:\?.*)?$/.test(src))better=src.replace(/_C\.png(?:\?.*)?$/,'_C_h.png');
    if(!better||better===src||img.dataset.v140Tried==='1')return;
    img.dataset.v140Tried='1';
    const old=src;
    const oldError=img.onerror;
    img.onerror=()=>{img.onerror=oldError||null;img.src=old;};
    img.src=better;
  }

  function normalize(grid){
    grid.querySelectorAll('.tb-wiki-card').forEach(card=>{
      const name=card.querySelector('h3')?.textContent.trim()||'';
      card.classList.toggle('tb-v140-map',maps.has(name));
      card.classList.toggle('tb-v140-mobile-only',mobileOnly.has(name));
      const img=card.querySelector('.tb-card-visual img');
      if(img)upgradeOfficialWeapon(img);
    });
  }

  function boot(){
    const grid=document.getElementById('tbWikiGrid');
    if(!grid){setTimeout(boot,60);return;}
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;normalize(grid);});
    });
    observer.observe(grid,{childList:true,subtree:true});
    normalize(grid);
  }
  boot();
})();