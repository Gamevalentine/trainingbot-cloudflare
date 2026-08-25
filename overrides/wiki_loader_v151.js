(()=>{
  'use strict';

  const SEARCH_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3-3"></path></svg>';
  const DISPLAY_TO_RAW={
    'Nỏ':'Crossbow',
    'Súng pháo sáng':'Flare Gun',
    'Súng cưa nòng':'Sawed-Off'
  };

  const json=async url=>{
    const res=await fetch(url,{cache:'no-cache'});
    if(!res.ok)throw new Error(`${url}: HTTP ${res.status}`);
    return res.json();
  };

  const loadScript=src=>new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=src;
    s.defer=true;
    s.onload=resolve;
    s.onerror=()=>reject(new Error(`Không tải được ${src}`));
    document.body.appendChild(s);
  });

  const keyFor=name=>{
    const clean=(name||'').replace(/^Bản đồ\s+/i,'').trim();
    return DISPLAY_TO_RAW[clean]||clean;
  };

  function fixSearchIcon(){
    const label=document.querySelector('.tb-wiki-search');
    if(!label)return;
    const current=label.querySelector('svg');
    if(current?.dataset.tbSearchIcon==='151')return;
    const wrap=document.createElement('span');
    wrap.innerHTML=SEARCH_ICON;
    const svg=wrap.firstElementChild;
    svg.dataset.tbSearchIcon='151';
    if(current)current.replaceWith(svg);
    else label.prepend(svg);
  }

  function patchCard(card,manifest){
    const name=card.querySelector('h3')?.textContent.trim();
    const local=manifest[keyFor(name)]||manifest[name];
    if(!local)return;
    const visual=card.querySelector('.tb-card-visual');
    if(!visual)return;
    let img=visual.querySelector('img');
    if(!img){
      img=document.createElement('img');
      img.className='tb-real-item-image';
      img.alt=name||'Wiki';
      img.loading='lazy';
      img.decoding='async';
      visual.classList.remove('tb-glyph');
      visual.replaceChildren(img);
    }
    if(img.getAttribute('src')!==local)img.src=local;
  }

  function patchImages(root,manifest){
    root.querySelectorAll?.('#tbWikiGrid .tb-wiki-card').forEach(card=>patchCard(card,manifest));
    root.querySelectorAll?.('img[alt]').forEach(img=>{
      const alt=img.getAttribute('alt')||'';
      const local=manifest[keyFor(alt)]||manifest[alt];
      if(local&&img.getAttribute('src')!==local)img.src=local;
    });
  }

  function startPatcher(manifest){
    const apply=()=>{
      fixSearchIcon();
      patchImages(document,manifest);
    };
    let queued=false;
    const queue=()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;apply();});
    };
    new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class']});
    apply();
  }

  async function boot(){
    try{
      const [data,manifest]=await Promise.all([
        json('/wiki_data_v151.json?v=151'),
        json('/wiki-assets/manifest.json?v=151')
      ]);
      window.DATA=data;
      window.TB_WIKI_LOCAL_ASSETS=manifest;
      await loadScript('/wiki_v150.js?v=150');
      startPatcher(manifest);
    }catch(error){
      console.error('[TrainingBot Wiki v151]',error);
      const grid=document.getElementById('wikiGrid');
      if(grid)grid.innerHTML='<div style="padding:40px 20px;text-align:center;color:#aab4c8">Không tải được dữ liệu Wiki. Hãy tải lại trang.</div>';
    }
  }

  boot();
})();
