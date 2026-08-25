(()=>{
  const TRACKED='Tracked Amphicarrier';
  const TRACKED_IMAGE='https://www.pubgmobile.com/images/event/PUBG-MOBILE-Version-430/s3_weapon2.png';
  const DUAL_MODE='Loạt 2 viên/Tự động';
  const P90_NOTE='PUBG MOBILE 3.1 làm mới P90 cho Classic: dùng đạn 5.7mm chuyên dụng, xuất hiện trong thính, tích hợp sẵn nòng giảm thanh, laser và ống ngắm riêng; không thể gắn thêm phụ kiện khác.';
  const DUAL_NOTE='Dual MP7 dùng đạn 9mm và có hai chế độ Loạt 2 viên/Tự động. Dung lượng băng 40 viên đang được ghi là số Wiki tham khảo.';
  const TRACKED_NOTE='Phương tiện thả đặc biệt thay BRDM-2 từ bản 4.3; chạy được trên bộ và mặt nước, xoay tại chỗ, và hành khách ghế trước có thể vận hành súng máy hạng nặng.';

  function normalizeData(){
    if(typeof DATA==='undefined')return false;

    const p90=DATA.weapons?.find(r=>r[0]==='P90');
    if(p90){p90[2]='5.7mm';p90[3]='Tự động';}

    const dual=DATA.weapons?.find(r=>r[0]==='Dual MP7');
    if(dual)dual[3]=DUAL_MODE;

    const vehicles=DATA.vehicles||[];
    let tracked=vehicles.find(r=>r[0]===TRACKED);
    const brdm=vehicles.find(r=>r[0]==='BRDM-2');
    if(!tracked&&brdm){
      brdm[0]=TRACKED;
      tracked=brdm;
    }
    if(tracked){
      tracked[1]='Xe bọc thép lưỡng cư';
      tracked[2]='Chưa xác minh';
      tracked[3]='Thả đặc biệt';
      tracked[4]=TRACKED_NOTE;
    }
    return true;
  }

  function syncCounts(){
    if(typeof DATA==='undefined')return;
    const tabs=document.getElementById('tbWikiTabs');
    if(!tabs)return;
    for(const key of ['weapons','attachments','vehicles','maps']){
      const value=DATA[key]?.length;
      const el=tabs.querySelector(`.tb-wiki-tab[data-tab="${key}"] small`);
      if(value!=null&&el&&el.textContent!==String(value))el.textContent=String(value);
    }
  }

  function rerenderIfStale(){
    const tabs=document.getElementById('tbWikiTabs');
    const grid=document.getElementById('tbWikiGrid');
    if(!tabs||!grid)return;

    const vehicleBtn=tabs.querySelector('.tb-wiki-tab[data-tab="vehicles"]');
    if(vehicleBtn?.classList.contains('active')&&[...grid.querySelectorAll('.tb-wiki-card h3')].some(h=>h.textContent.trim()==='BRDM-2')){
      vehicleBtn.click();
      return;
    }

    const weaponBtn=tabs.querySelector('.tb-wiki-tab[data-tab="weapons"]');
    if(!weaponBtn?.classList.contains('active'))return;
    const p90=[...grid.querySelectorAll('.tb-wiki-card')].find(c=>c.querySelector('h3')?.textContent.trim()==='P90');
    if(p90&&/\b9mm\b/i.test(p90.textContent))weaponBtn.click();
  }

  function patchTrackedCard(){
    const grid=document.getElementById('tbWikiGrid');
    if(!grid)return;
    const card=[...grid.querySelectorAll('.tb-wiki-card')].find(c=>c.querySelector('h3')?.textContent.trim()===TRACKED);
    if(!card)return;

    card.querySelector('.tb-vehicle-speed')?.remove();
    const p=card.querySelector('p');
    const summary='Thả đặc biệt · Đường bộ + mặt nước';
    if(p&&p.textContent!==summary)p.textContent=summary;

    const visual=card.querySelector('.tb-card-visual');
    if(!visual||visual.dataset.v149Image===TRACKED_IMAGE)return;
    const img=document.createElement('img');
    img.className='tb-real-item-image';
    img.alt=TRACKED;
    img.loading='lazy';
    img.decoding='async';
    img.referrerPolicy='no-referrer';
    img.onerror=()=>{
      if(visual.dataset.v149Image===TRACKED_IMAGE){
        delete visual.dataset.v149Image;
        visual.replaceChildren();
      }
    };
    visual.dataset.v149Image=TRACKED_IMAGE;
    visual.classList.add('tb-real-image');
    visual.replaceChildren(img);
    img.src=TRACKED_IMAGE;
  }

  function setFact(root,label,value){
    const fact=[...root.querySelectorAll('.tb-v145-fact')].find(x=>x.querySelector('small')?.textContent.trim()===label);
    const b=fact?.querySelector('b');
    if(b&&b.textContent!==value)b.textContent=value;
  }

  function setWeaponNote(root,text){
    const left=root.querySelector('.tb-v145-left');
    if(!left)return;
    let note=left.querySelector('.tb-v145-note');
    if(!note){
      note=document.createElement('div');
      note.className='tb-v145-note';
      left.querySelector('.tb-v145-facts')?.insertAdjacentElement('afterend',note);
    }
    const html=`<b>Thông tin đã đối chiếu:</b> ${text}`;
    if(note&&note.innerHTML!==html)note.innerHTML=html;
  }

  function patchWeaponDetail(){
    const root=document.querySelector('.tb-v145.open');
    const name=root?.querySelector('h2')?.textContent.trim();
    if(!root||!name)return;

    if(name==='P90'){
      setFact(root,'Loại đạn','5.7mm');
      setFact(root,'Chế độ bắn','Tự động');
      setFact(root,'Băng mặc định','50 viên');
      setWeaponNote(root,P90_NOTE);
    }else if(name==='Dual MP7'){
      setFact(root,'Loại đạn','9mm');
      setFact(root,'Chế độ bắn',DUAL_MODE);
      setFact(root,'Băng mặc định','40 viên (tham khảo)');
      setWeaponNote(root,DUAL_NOTE);
    }
  }

  function patchTrackedModal(){
    const title=document.getElementById('tbWikiModalTitle');
    const body=document.getElementById('tbWikiModalBody');
    if(!title||!body||title.textContent.trim()!==TRACKED)return;

    const summary=body.querySelector('.tb-v148-summary');
    const summaryHtml=`<b>Xe bọc thép lưỡng cư</b><br>${TRACKED_NOTE}`;
    if(summary&&summary.innerHTML!==summaryHtml)summary.innerHTML=summaryHtml;

    const values={
      'Số chỗ ngồi':'Chưa xác minh',
      'Tốc độ tối đa':'Chưa xác minh',
      'Môi trường di chuyển':'Đường bộ + mặt nước'
    };
    body.querySelectorAll('.tb-v148-item').forEach(item=>{
      const label=item.querySelector('small')?.textContent.trim();
      const b=item.querySelector('b');
      if(b&&values[label]&&b.textContent!==values[label])b.textContent=values[label];
    });

    const note=body.querySelector('.tb-v148-note');
    const noteText='Dữ liệu đã đối chiếu theo cập nhật PUBG MOBILE 4.3. Các thông số chưa có nguồn đủ chắc như số ghế, tốc độ tối đa và độ bền được giữ ở trạng thái “Chưa xác minh”.';
    if(note&&note.textContent!==noteText)note.textContent=noteText;
  }

  function apply(){
    if(!normalizeData())return false;
    syncCounts();
    rerenderIfStale();
    patchTrackedCard();
    patchWeaponDetail();
    patchTrackedModal();
    return true;
  }

  function boot(){
    if(!apply()){setTimeout(boot,70);return;}
    let queued=false;
    const queue=()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;apply();});
    };
    new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
    setTimeout(apply,250);
    setTimeout(apply,900);
  }

  boot();
})();
