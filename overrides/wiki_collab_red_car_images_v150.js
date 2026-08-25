(()=>{
  const IMAGES={
    'McLaren|570S|Zenith Black':'https://news.codashop.com/ph/wp-content/uploads/sites/5/2021/06/McLaren-570S-Zenith-Black-1024x461.jpg',
    'McLaren|570S|Lunar White':'https://news.codashop.com/ph/wp-content/uploads/sites/5/2021/06/McLaren-570S-Lunar-White-1024x461.jpg',
    'Tesla|Roadster|Diamond':'https://media.karousell.com/media/photos/products/2022/2/3/acc_pubg_mobile__conqueror__1643901241_0fcf421f_progressive.jpg',
    'Tesla|Cybertruck|Splendid-Silver':'https://images.cybersport.ru/images/og-jpg/plain/a7/a7f5c00a7c39e3399c742b487af02482.jpeg',
    'Koenigsegg|Gemera|Silver Grey':'https://playersurf.com/wp-content/uploads/elementor/thumbs/Koenigsegg-Gemera-_-Silver-Gray-r8kzf6nbvzsu2ptjnguan5hs93a7q6qgnhea2j8jju.jpg',
    'Koenigsegg|Gemera|Dawn':'https://playersurf.com/wp-content/uploads/elementor/thumbs/Koenigsegg-Gemera-_-Dawn-r8p928afcbdvivo28ajcpeumkhgpcglp3m7vy2atx6.jpg',
    'Koenigsegg|Jesko|Silver Grey':'https://playersurf.com/wp-content/uploads/elementor/thumbs/Koenigsegg-Jesko-_-Silver-Gray-r8p926eqynbavnqsj9q3kfbpdppyx2e8fcwwzidm9m.jpg',
    'Koenigsegg|Jesko|Dawn':'https://playersurf.com/wp-content/uploads/elementor/thumbs/Koenigsegg-Jesko-_-Dawn-r8p925gwrta0k1s5orbgzxk8sbulpdai389fi8f0fu.jpg',
    'Koenigsegg|One:1|Jade':'https://playersurf.com/wp-content/uploads/elementor/thumbs/Koenigsegg-One_1-_-Jade-r8kzf8j09nvepxqtchnjs50pfv0y5kxxbqp9135r7e.jpg',
    'Koenigsegg|One:1|Phoenix':'https://playersurf.com/wp-content/uploads/elementor/thumbs/Koenigsegg-One_1-Phoenix-r8kzf7l62tu4ebs6hz8x7n98uh5kxvu6zm1rjt75dm.jpg'
  };

  function addStyle(){
    if(document.getElementById('tb-v150-car-images-style'))return;
    const s=document.createElement('style');
    s.id='tb-v150-car-images-style';
    s.textContent=`
      .tb-v149-car-visual.tb-v150-real{padding:0!important;overflow:hidden!important;background:#0b0d12!important;min-height:112px!important}
      .tb-v149-car-visual.tb-v150-real img{display:block!important;width:100%!important;height:112px!important;max-width:none!important;max-height:none!important;object-fit:cover!important;filter:none!important}
      .tb-v150-detail-image{margin:0 0 14px;border:1px solid rgba(255,72,92,.2);border-radius:14px;overflow:hidden;background:#0b0d12}
      .tb-v150-detail-image img{display:block;width:100%;height:min(320px,42vw);min-height:180px;object-fit:cover}
      @media(max-width:620px){.tb-v149-car-visual.tb-v150-real,.tb-v149-car-visual.tb-v150-real img{min-height:94px!important;height:94px!important}.tb-v150-detail-image img{height:190px;min-height:0}}
    `;
    document.head.appendChild(s);
  }

  function cardKey(card){
    const brand=card.querySelector('.tb-v149-brand')?.textContent.trim()||card.dataset.v150Brand||'';
    const model=card.querySelector('h3')?.textContent.trim()||'';
    const variant=card.querySelector('.tb-v149-variant')?.textContent.trim()||'';
    return `${brand}|${model}|${variant}`;
  }

  function patchCards(){
    const cards=[...document.querySelectorAll('#tbWikiGrid .tb-v149-car-card')];
    cards.forEach((card,index)=>{
      if(card.dataset.v150Image==='1')return;
      const brand=card.querySelector('.tb-v149-brand')?.textContent.trim()||'';
      const key=cardKey(card),src=IMAGES[key];
      if(!src)return;
      const visual=card.querySelector('.tb-v149-car-visual');
      if(!visual)return;
      const fallback=visual.innerHTML;
      card.dataset.v150Brand=brand;
      card.dataset.v150Key=key;
      card.dataset.v150Image='1';
      visual.classList.add('tb-v150-real');
      const img=document.createElement('img');
      img.src=src;
      img.alt=`${key.replaceAll('|',' ')}`;
      img.decoding='async';
      if(index<5){img.loading='eager';img.fetchPriority='high';}
      else{img.loading='lazy';img.fetchPriority='low';}
      img.referrerPolicy='no-referrer';
      img.onerror=()=>{
        card.dataset.v150Image='failed';
        visual.classList.remove('tb-v150-real');
        visual.innerHTML=fallback;
      };
      visual.replaceChildren(img);
    });
  }

  function detailKey(title){
    for(const key of Object.keys(IMAGES)){
      const [brand,model,variant]=key.split('|');
      if(title===`${brand} ${model} (${variant})`)return key;
    }
    return '';
  }

  function patchDetail(){
    const modal=document.getElementById('tbWikiModal');
    if(!modal?.classList.contains('open'))return;
    const title=document.getElementById('tbWikiModalTitle')?.textContent.trim()||'';
    const key=detailKey(title),src=IMAGES[key];
    const body=document.getElementById('tbWikiModalBody');
    if(!body||!src||body.dataset.v150Detail===key)return;
    body.dataset.v150Detail=key;
    body.querySelector('.tb-v150-detail-image')?.remove();
    const wrap=document.createElement('div');
    wrap.className='tb-v150-detail-image';
    const img=document.createElement('img');
    img.src=src;
    img.alt=title;
    img.loading='eager';
    img.decoding='async';
    img.referrerPolicy='no-referrer';
    img.onerror=()=>wrap.remove();
    wrap.appendChild(img);
    body.prepend(wrap);
  }

  function boot(){
    addStyle();
    const grid=document.getElementById('tbWikiGrid');
    const modal=document.getElementById('tbWikiModal');
    if(!grid||!modal){setTimeout(boot,70);return;}
    let queued=false;
    const sync=()=>{queued=false;patchCards();patchDetail();};
    const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(sync);};
    const obs=new MutationObserver(queue);
    obs.observe(grid,{childList:true,subtree:true});
    obs.observe(modal,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    sync();
  }

  boot();
})();