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

      #tbWikiGrid{align-items:start}
      #tbWikiGrid .tb-wiki-card{
        display:flex;
        flex-direction:column;
        min-height:300px;
        padding-bottom:16px;
      }
      #tbWikiGrid .tb-card-visual{
        flex:0 0 158px;
        height:158px;
        padding:18px 18px 8px;
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:hidden;
      }
      #tbWikiGrid .tb-real-item-image,
      #tbWikiGrid .tb-card-visual img{
        display:block;
        width:auto!important;
        height:auto!important;
        max-width:92%!important;
        max-height:112px!important;
        object-fit:contain!important;
        object-position:center!important;
        margin:0 auto!important;
        filter:none!important;
        border:0!important;
        box-shadow:none!important;
        background:transparent!important;
      }
      #tbWikiGrid .tb-real-map-card .tb-card-visual,
      #tbWikiGrid .tb-completion-map .tb-card-visual{
        flex-basis:126px;
        height:126px;
        padding:14px 16px 4px;
      }
      #tbWikiGrid .tb-real-map-card .tb-real-item-image,
      #tbWikiGrid .tb-completion-map .tb-real-item-image{
        width:100%!important;
        height:112px!important;
        max-width:100%!important;
        max-height:112px!important;
        object-fit:cover!important;
        border-radius:8px!important;
      }
      #tbWikiGrid .tb-wiki-card h3{
        min-height:2.5em;
        margin:8px 16px 2px;
        display:flex;
        align-items:center;
        justify-content:center;
        text-align:center;
        line-height:1.25;
      }
      #tbWikiGrid .tb-wiki-card p{
        min-height:2.45em;
        margin:0 16px;
        display:flex;
        align-items:flex-start;
        justify-content:center;
        text-align:center;
      }
      #tbWikiGrid .tb-vehicle-speed{
        min-height:1.3em;
        margin:7px 16px 0;
        text-align:center;
        line-height:1.3;
      }
      #tbWikiGrid .tb-card-visual img[src*="pbs.twimg"],
      #tbWikiGrid .tb-card-visual img[src*="idn.media"],
      #tbWikiGrid .tb-card-visual img[src*="pubgmobile.com"],
      #tbWikiGrid .tb-card-visual img[src*="topuplive.com"],
      #tbWikiGrid .tb-card-visual img[src*="bluestacks.com"],
      #tbWikiGrid .tb-card-visual img[src*="liquipedia.net"],
      #tbWikiGrid .tb-card-visual img[src*="manabuy.com"],
      #tbWikiGrid .tb-card-visual img[src*="krafton.com"]{
        max-width:88%!important;
        max-height:104px!important;
        border-radius:8px!important;
      }
      @media(max-width:700px){
        #tbWikiGrid .tb-wiki-card{min-height:238px;padding-bottom:12px}
        #tbWikiGrid .tb-card-visual{flex-basis:122px;height:122px;padding:14px 10px 4px}
        #tbWikiGrid .tb-real-item-image,
        #tbWikiGrid .tb-card-visual img{max-width:94%!important;max-height:86px!important}
        #tbWikiGrid .tb-real-map-card .tb-card-visual,
        #tbWikiGrid .tb-completion-map .tb-card-visual{flex-basis:100px;height:100px;padding:10px 10px 2px}
        #tbWikiGrid .tb-real-map-card .tb-real-item-image,
        #tbWikiGrid .tb-completion-map .tb-real-item-image{height:86px!important;max-height:86px!important}
        #tbWikiGrid .tb-wiki-card h3{min-height:2.45em;margin:5px 10px 1px}
        #tbWikiGrid .tb-wiki-card p{min-height:2.35em;margin:0 10px}
        #tbWikiGrid .tb-vehicle-speed{margin:5px 10px 0;font-size:.67rem}
        #tbWikiGrid .tb-card-visual img[src*="pbs.twimg"],
        #tbWikiGrid .tb-card-visual img[src*="idn.media"],
        #tbWikiGrid .tb-card-visual img[src*="pubgmobile.com"],
        #tbWikiGrid .tb-card-visual img[src*="topuplive.com"],
        #tbWikiGrid .tb-card-visual img[src*="bluestacks.com"],
        #tbWikiGrid .tb-card-visual img[src*="liquipedia.net"],
        #tbWikiGrid .tb-card-visual img[src*="manabuy.com"],
        #tbWikiGrid .tb-card-visual img[src*="krafton.com"]{max-width:92%!important;max-height:80px!important}
      }
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
