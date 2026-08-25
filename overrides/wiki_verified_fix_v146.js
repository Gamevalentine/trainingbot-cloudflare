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

  function fixCurrentData(){
    if(typeof DATA==='undefined')return;
    const p90=DATA.weapons?.find(r=>r[0]==='P90');
    if(p90){
      p90[2]='5.7mm';
      p90[3]='Tự động';
    }
  }

  function syncWikiCounts(){
    if(typeof DATA==='undefined')return;
    const counts={weapons:DATA.weapons?.length,attachments:DATA.attachments?.length,vehicles:DATA.vehicles?.length,maps:DATA.maps?.length};
    const tabs=document.getElementById('tbWikiTabs');
    if(!tabs)return;
    Object.entries(counts).forEach(([key,value])=>{
      if(value==null)return;
      const small=tabs.querySelector(`.tb-wiki-tab[data-tab="${key}"] small`);
      if(small&&small.textContent!==String(value))small.textContent=String(value);
    });
  }

  function watchWikiCounts(){
    const start=()=>{
      const tabs=document.getElementById('tbWikiTabs');
      if(!tabs){setTimeout(start,80);return;}
      let queued=false;
      const apply=()=>{queued=false;fixCurrentData();syncWikiCounts();};
      const obs=new MutationObserver(()=>{
        if(queued)return;
        queued=true;
        requestAnimationFrame(apply);
      });
      obs.observe(tabs,{childList:true,subtree:true});
      apply();
    };
    start();
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
      fact('Loại đạn','5.7mm');
      fact('Chế độ bắn','Tự động');
      fact('Băng mặc định','50 viên');
      setNote('<b>Thông tin đã đối chiếu:</b> PUBG MOBILE 3.1 làm mới P90 cho Classic: dùng đạn 5.7mm chuyên dụng, xuất hiện trong thính, tích hợp sẵn nòng giảm thanh, laser và ống ngắm riêng; không thể gắn thêm phụ kiện khác.');
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

  function loadScript(src,key,onload){
    const selector=`script[data-${key}]`;
    const existing=document.querySelector(selector);
    if(existing){
      if(onload){
        if(existing.dataset.tbLoaded==='1')onload();
        else existing.addEventListener('load',onload,{once:true});
      }
      return existing;
    }
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.setAttribute(`data-${key}`,'1');
    s.addEventListener('load',()=>{
      s.dataset.tbLoaded='1';
      if(onload)onload();
    },{once:true});
    document.head.appendChild(s);
    return s;
  }

  fixAliasClicks();
  fixCurrentData();
  watchWikiCounts();
  watch();
  loadScript('/wiki_catalog_verified_v147.js?v=147','tb-wiki-v147',()=>{
    fixCurrentData();
    syncWikiCounts();
  });
  loadScript('/wiki_vehicle_map_detail_v148.js?v=148','tb-wiki-v148');
})();