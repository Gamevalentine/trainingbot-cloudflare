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
    const fact=(label,value)=>{const el=facts.find(x=>x.querySelector('small')?.textContent.trim()===label);if(el&&value!=null)el.querySelector('b').textContent=value;};
    const note=root.querySelector('.tb-v145-note');
    const statRows=[...root.querySelectorAll('.tb-v145-stat')];
    const setPower=v=>{const r=statRows.find(x=>x.querySelector('span')?.textContent.trim()==='Sức mạnh');if(!r)return;r.querySelector('b').textContent=`${v}/100`;const fill=r.querySelector('.tb-v145-fill');if(fill)fill.style.width=`${v}%`;};

    if(name==='P90'){
      fact('Loại đạn','5.7mm');fact('Chế độ bắn','Tự động');fact('Băng mặc định','50 viên');
      if(note)note.innerHTML='<b>Thông tin đã đối chiếu:</b> Từ phiên bản 3.1, P90 trở thành SMG thả dù, dùng đạn 5.7mm riêng, tích hợp sẵn giảm thanh, laser và ống ngắm chuyên dụng; không thể gắn thêm phụ kiện khác.';
      const attTitle=[...root.querySelectorAll('.tb-v145-title')].find(x=>x.textContent.includes('Phụ kiện'));
      if(attTitle){const next=attTitle.nextElementSibling;if(next)next.outerHTML='<div class="tb-v145-unknown">P90 phiên bản hiện tại không có khe phụ kiện rời: giảm thanh, laser và ống ngắm đã tích hợp sẵn.</div>';}
    }
    if(name==='M249'){
      setPower(42);
      if(note)note.innerHTML='<b>Thông tin đã đối chiếu:</b> PUBG MOBILE 2.5 tăng sát thương cơ bản lên 41; phiên bản 3.1 tiếp tục tăng thêm 1. M249 có thể gắn Gun Shield.';
    }
    if(name==='DP-28'){
      setPower(52);
      if(note)note.innerHTML='<b>Thông tin đã đối chiếu:</b> PUBG MOBILE xác nhận băng mặc định 47 viên, tăng độ chính xác hip-fire và sát thương tay/chân; phiên bản 3.1 tiếp tục tăng sát thương cơ bản thêm 1. Có thể gắn Gun Shield.';
    }
    if(name==='MG3')setPower(41);
  }

  function watch(){
    const obs=new MutationObserver(()=>{const root=document.querySelector('.tb-v145');if(root)patchOpenDetail(root);});
    obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    const root=document.querySelector('.tb-v145');if(root)patchOpenDetail(root);
  }
  fixAliasClicks();watch();
})();