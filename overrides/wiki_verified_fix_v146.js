(()=>{
  const ALIAS={'Nỏ':'Crossbow','Súng pháo sáng':'Flare Gun','Súng cưa nòng':'Sawed-Off'};

  function fixAliasClicks(){
    document.addEventListener('click',e=>{
      const card=e.target.closest?.('#tbWikiGrid .tb-wiki-card');
      if(!card)return;
      const h=card.querySelector('h3');
      const raw=ALIAS[h?.textContent.trim()];
      if(!raw)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      const shown=h.textContent;
      h.textContent=raw;
      card.click();
      h.textContent=shown;
    },true);
  }

  function patchOpenDetail(root){
    if(!root?.classList?.contains('open'))return;
    const name=root.querySelector('h2')?.textContent.trim();
    if(!name)return;
    const facts=[...root.querySelectorAll('.tb-v145-fact')];
    const fact=(label,value)=>{
      const el=facts.find(x=>x.querySelector('small')?.textContent.trim()===label);
      const target=el?.querySelector('b');
      if(target&&value!=null&&target.textContent!==value)target.textContent=value;
    };
    const setNote=html=>{
      const note=root.querySelector('.tb-v145-left .tb-v145-note');
      if(note&&note.innerHTML!==html)note.innerHTML=html;
    };
    const statRows=[...root.querySelectorAll('.tb-v145-stat')];
    const setPower=v=>{
      const r=statRows.find(x=>x.querySelector('span')?.textContent.trim()==='Sức mạnh');
      if(!r)return;
      const value=`${v}/100`;
      const b=r.querySelector('b');
      if(b&&b.textContent!==value)b.textContent=value;
      const fill=r.querySelector('.tb-v145-fill');
      if(fill&&fill.style.width!==`${v}%`)fill.style.width=`${v}%`;
    };

    if(name==='P90'){
      fact('Loại đạn','9mm');
      fact('Chế độ bắn','Đơn/Loạt/Tự động');
      fact('Băng mặc định','50 viên');
      setNote('<b>Thông tin đã đối chiếu:</b> Trang Livik chính thức của PUBG MOBILE xác nhận P90 dùng đạn 9mm, băng 50 viên và có ba chế độ bắn: đơn, loạt và tự động.');
    }
    if(name==='M249'){
      setPower(42);
      setNote('<b>Thông tin đã đối chiếu:</b> PUBG MOBILE 2.5 tăng sát thương cơ bản lên 41; phiên bản 3.1 tiếp tục tăng thêm 1. M249 có thể gắn Gun Shield.');
    }
    if(name==='DP-28'){
      setPower(52);
      setNote('<b>Thông tin đã đối chiếu:</b> PUBG MOBILE xác nhận băng mặc định 47 viên, tăng độ chính xác hip-fire và sát thương tay/chân; phiên bản 3.1 tiếp tục tăng sát thương cơ bản thêm 1. Có thể gắn Gun Shield.');
    }
    if(name==='MG3')setPower(41);
  }

  function watch(){
    const attach=root=>{
      let queued=false;
      const apply=()=>patchOpenDetail(root);
      const obs=new MutationObserver(()=>{
        if(queued)return;
        queued=true;
        requestAnimationFrame(()=>{queued=false;apply();});
      });
      obs.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
      apply();
    };

    const existing=document.querySelector('.tb-v145');
    if(existing){attach(existing);return;}

    const finder=new MutationObserver(()=>{
      const root=document.querySelector('.tb-v145');
      if(!root)return;
      finder.disconnect();
      attach(root);
    });
    finder.observe(document.body,{childList:true,subtree:true});
  }

  function loadScript(src,key){
    if(document.querySelector(`script[data-${key}]`))return;
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.setAttribute(`data-${key}`,'1');
    document.head.appendChild(s);
  }

  fixAliasClicks();
  watch();
  loadScript('/wiki_catalog_verified_v147.js?v=147','tb-wiki-v147');
  loadScript('/wiki_vehicle_map_detail_v148.js?v=148','tb-wiki-v148');
  loadScript('/wiki_red_mythic_skins_v149.js?v=149','tb-wiki-v149');
})();