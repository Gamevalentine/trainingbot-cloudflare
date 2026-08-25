(()=>{
  const COLOR_SUFFIX='_w.png';

  if(!document.getElementById('tb-wiki-v139-style')){
    const style=document.createElement('style');
    style.id='tb-wiki-v139-style';
    style.textContent=`
      .tb-wiki-source-note{
        margin:14px 0 18px;
        padding:10px 13px;
        border:1px solid rgba(255,100,16,.26);
        border-radius:12px;
        background:rgba(255,100,16,.055);
        color:#9da6b6;
        font-size:.75rem;
        line-height:1.55;
      }
      .tb-wiki-source-note b{color:#e8ebf2}
    `;
    document.head.append(style);
  }

  function addSourceNote(){
    const shell=document.querySelector('.tb-wiki-shell');
    const head=shell?.querySelector('.tb-wiki-head');
    if(!shell||!head||shell.querySelector('.tb-wiki-source-note'))return;
    const note=document.createElement('div');
    note.className='tb-wiki-source-note';
    note.innerHTML='<b>Nguồn tham khảo:</b> cấu trúc Wiki tham khảo MadTamizha; hình minh họa sử dụng tài nguyên PUBG / PUBG Mobile và các nguồn công khai phù hợp.';
    head.insertAdjacentElement('afterend',note);
  }

  function useColoredWeaponImages(){
    document.querySelectorAll('#tbWikiGrid .tb-real-item-image').forEach(img=>{
      const src=img.currentSrc||img.src||'';
      if(!src.includes('/Assets/Item/Weapon/Main/')||!src.endsWith(COLOR_SUFFIX)||img.dataset.colorTried==='1')return;

      const original=src;
      const colored=src.slice(0,-COLOR_SUFFIX.length)+'.png';
      img.dataset.colorTried='1';

      const previousError=img.onerror;
      img.onerror=()=>{
        img.onerror=previousError||null;
        img.src=original;
      };
      img.src=colored;
    });
  }

  function start(){
    const grid=document.getElementById('tbWikiGrid');
    if(!grid){setTimeout(start,80);return;}

    const apply=()=>{
      addSourceNote();
      useColoredWeaponImages();
    };

    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;apply();});
    });
    observer.observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
    apply();
  }

  start();
})();
