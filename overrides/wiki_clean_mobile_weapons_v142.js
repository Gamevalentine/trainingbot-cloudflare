(()=>{
  const CLEAN={
    'Honey Badger':'https://liquipedia.net/commons/images/d/d9/Honey_badger_new.png',
    'ASM Abakan':'https://staticg.sportskeeda.com/editor/2025/07/7876a-17519700737225-1920.jpg',
    'JS9':'https://pic.bittopup.com/bitnews/1758866392502.jpg',
    'M1014':'https://liquipedia.net/commons/images/e/e3/M1014_new.png',
    'NS2000':'https://liquipedia.net/commons/images/c/cc/Ns2000_new.png'
  };

  function apply(grid){
    grid.querySelectorAll('.tb-wiki-card').forEach(card=>{
      const name=card.querySelector('h3')?.textContent.trim()||'';
      const src=CLEAN[name];
      if(!src)return;
      const visual=card.querySelector('.tb-card-visual');
      if(!visual||visual.dataset.v142===src)return;
      const old=visual.innerHTML;
      const img=document.createElement('img');
      img.className='tb-real-item-image';
      img.alt=name;
      img.loading='lazy';
      img.decoding='async';
      img.referrerPolicy='no-referrer';
      img.onerror=()=>{delete visual.dataset.v142;visual.innerHTML=old;};
      visual.dataset.v142=src;
      visual.classList.add('tb-real-image');
      visual.replaceChildren(img);
      img.src=src;
    });
  }

  function boot(){
    const grid=document.getElementById('tbWikiGrid');
    if(!grid){setTimeout(boot,60);return;}
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;apply(grid);});
    });
    observer.observe(grid,{childList:true,subtree:true});
    apply(grid);
  }
  boot();
})();