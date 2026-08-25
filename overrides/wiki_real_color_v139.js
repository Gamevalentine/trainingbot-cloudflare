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

      #tbWikiGrid{align-items:stretch!important}
      #tbWikiGrid .tb-wiki-card{
        display:grid!important;
        grid-template-rows:158px 58px 42px 30px!important;
        align-content:start!important;
        height:304px!important;
        min-height:304px!important;
        max-height:304px!important;
        padding:0 0 14px!important;
        overflow:hidden!important;
        box-sizing:border-box!important;
      }
      #tbWikiGrid .tb-card-visual{
        grid-row:1!important;
        width:100%!important;
        height:158px!important;
        min-height:158px!important;
        max-height:158px!important;
        padding:18px 18px 8px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        overflow:hidden!important;
        box-sizing:border-box!important;
      }
      #tbWikiGrid .tb-real-item-image,
      #tbWikiGrid .tb-card-visual img{
        display:block!important;
        width:auto!important;
        height:auto!important;
        max-width:90%!important;
        max-height:112px!important;
        object-fit:contain!important;
        object-position:center!important;
        margin:auto!important;
        filter:none!important;
        border:0!important;
        box-shadow:none!important;
        background:transparent!important;
      }
      #tbWikiGrid .tb-wiki-card h3{
        grid-row:2!important;
        min-height:58px!important;
        max-height:58px!important;
        margin:0 14px!important;
        padding:4px 0 0!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        overflow:hidden!important;
        text-align:center!important;
        line-height:1.22!important;
      }
      #tbWikiGrid .tb-wiki-card p{
        grid-row:3!important;
        min-height:42px!important;
        max-height:42px!important;
        margin:0 14px!important;
        padding:0!important;
        display:flex!important;
        align-items:flex-start!important;
        justify-content:center!important;
        overflow:hidden!important;
        text-align:center!important;
        line-height:1.35!important;
      }
      #tbWikiGrid .tb-vehicle-speed{
        grid-row:4!important;
        min-height:30px!important;
        max-height:30px!important;
        margin:0 14px!important;
        padding:3px 0 0!important;
        display:flex!important;
        align-items:flex-start!important;
        justify-content:center!important;
        overflow:hidden!important;
        text-align:center!important;
        line-height:1.25!important;
      }
      #tbWikiGrid .tb-wiki-card:not(.tb-unified-vehicle) .tb-vehicle-speed{display:none!important}

      #tbWikiGrid .tb-unified-map .tb-card-visual{
        padding:16px 16px 8px!important;
      }
      #tbWikiGrid .tb-unified-map .tb-real-item-image,
      #tbWikiGrid .tb-unified-map .tb-card-visual img{
        width:100%!important;
        height:112px!important;
        max-width:100%!important;
        max-height:112px!important;
        object-fit:cover!important;
        border-radius:8px!important;
      }
      #tbWikiGrid .tb-unified-screenshot .tb-real-item-image,
      #tbWikiGrid .tb-unified-screenshot .tb-card-visual img{
        max-width:82%!important;
        max-height:104px!important;
        object-fit:contain!important;
        border-radius:8px!important;
      }

      @media(max-width:700px){
        #tbWikiGrid .tb-wiki-card{
          grid-template-rows:118px 50px 36px 26px!important;
          height:242px!important;
          min-height:242px!important;
          max-height:242px!important;
          padding-bottom:12px!important;
        }
        #tbWikiGrid .tb-card-visual{
          height:118px!important;
          min-height:118px!important;
          max-height:118px!important;
          padding:13px 10px 4px!important;
        }
        #tbWikiGrid .tb-real-item-image,
        #tbWikiGrid .tb-card-visual img{
          max-width:92%!important;
          max-height:84px!important;
        }
        #tbWikiGrid .tb-wiki-card h3{
          min-height:50px!important;
          max-height:50px!important;
          margin:0 8px!important;
          font-size:.92rem!important;
        }
        #tbWikiGrid .tb-wiki-card p{
          min-height:36px!important;
          max-height:36px!important;
          margin:0 8px!important;
          font-size:.67rem!important;
        }
        #tbWikiGrid .tb-vehicle-speed{
          min-height:26px!important;
          max-height:26px!important;
          margin:0 8px!important;
          padding-top:2px!important;
          font-size:.64rem!important;
        }
        #tbWikiGrid .tb-unified-map .tb-real-item-image,
        #tbWikiGrid .tb-unified-map .tb-card-visual img{
          height:84px!important;
          max-height:84px!important;
        }
        #tbWikiGrid .tb-unified-screenshot .tb-real-item-image,
        #tbWikiGrid .tb-unified-screenshot .tb-card-visual img{
          max-width:88%!important;
          max-height:78px!important;
        }
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

  function normalizeCards(){
    const grid=document.getElementById('tbWikiGrid');
    if(!grid)return;

    grid.querySelectorAll('.tb-wiki-card').forEach(card=>{
      card.classList.add('tb-unified-card');
      const visual=card.querySelector('.tb-card-visual');
      const img=visual?.querySelector('img');
      const src=(img?.currentSrc||img?.src||'').toLowerCase();

      const isMap=card.classList.contains('tb-real-map-card')||card.classList.contains('tb-completion-map');
      const isVehicle=!!card.querySelector('.tb-vehicle-speed');
      const isScreenshot=!!img && !src.includes('raw.githubusercontent.com/pubg/api-assets');

      card.classList.toggle('tb-unified-map',isMap);
      card.classList.toggle('tb-unified-vehicle',isVehicle);
      card.classList.toggle('tb-unified-screenshot',isScreenshot&&!isMap);
    });
  }

  function start(){
    const grid=document.getElementById('tbWikiGrid');
    if(!grid){setTimeout(start,80);return;}

    const apply=()=>{
      addSourceNote();
      useColoredWeaponImages();
      normalizeCards();
    };

    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;apply();});
    });
    observer.observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class']});
    apply();
  }

  start();
})();