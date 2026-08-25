(()=>{
  const ALL_MAPS=['Erangel','Miramar','Vikendi','Sanhok','Karakin','Nusa','Livik','Rondo'];
  const NEW_ROWS=[
    {after:'VSS',row:['M1 Garand','DMR','7.62mm','Bán tự động']},
    {after:'AMR',row:['DSR','Súng bắn tỉa','7.62mm','Bắn từng viên']},
    {after:'Desert Eagle',row:['Dual MP7','Súng ngắn','9mm','Chưa xác minh']},
    {after:'Crossbow',row:['Tactical Crossbow','Đặc biệt','Bolt','Một phát']},
    {after:'M79',row:['Mortar','Đặc biệt','Đạn nổ đặc biệt','Ngắm trực tiếp/Ngắm qua bản đồ']}
  ];

  const IMAGES={
    'M1 Garand':'https://www.pubgmobile.com/images/event/PUBG-MOBILE-Version-430/s3_weapon1.png',
    'DSR':'https://www.pubgmobile.com/images/event/Official-Transformers-Collaboration/s3_weapon2.png',
    'Dual MP7':'https://liquipedia.net/commons/images/9/93/Dual_MP7_PUBG_Mobile.png',
    'Tactical Crossbow':'https://liquipedia.net/commons/images/d/da/T_crossbow_new.png',
    'Mortar':'https://www.pubgmobile.com/images/event/PUBG-MOBILE-Version-400/s3_weapon1.png'
  };

  const DAMAGE_CURRENT={
    'AKM':50,
    'M762':48,
    'ACE32':46,
    'Honey Badger':45,
    'Mk47 Mutant':50,
    'GROZA':49
  };

  const DETAIL={
    'AKM':{note:'PUBG MOBILE 4.2 tăng sát thương cơ bản AKM từ 48 lên 50.'},
    'M762':{note:'PUBG MOBILE 4.2 tăng sát thương cơ bản M762 từ 46 lên 48. M762 có các chế độ đơn, loạt 3 viên và tự động.'},
    'ACE32':{note:'PUBG MOBILE 4.2 tăng sát thương cơ bản ACE32 từ 45 lên 47; phiên bản 4.5 điều chỉnh lại từ 47 xuống 46 đồng thời cải thiện độ ổn định và khả năng bắn liên tục.'},
    'Honey Badger':{note:'PUBG MOBILE 4.2 tăng sát thương cơ bản Honey Badger từ 43 lên 45. Bản 4.3 bổ sung Miramar, Karakin, Vikendi, Nusa và Rondo vào danh sách bản đồ xuất hiện.',maps:ALL_MAPS},
    'Mk47 Mutant':{note:'PUBG MOBILE 4.2 tăng sát thương cơ bản Mk47 từ 48 lên 50. Full-Auto Mod cho phép Mk47 sử dụng chế độ tự động.'},
    'GROZA':{note:'PUBG MOBILE 4.2 tăng sát thương cơ bản Groza từ 48 lên 49.'},
    'ASM Abakan':{
      mag:'30 viên',
      note:'PUBG MOBILE xác nhận ASM Abakan dùng đạn 5.56mm với ba chế độ: tự động, loạt 2 viên và bắn đơn. Trang chính thức BATTLEGROUNDS MOBILE INDIA xác nhận 30 viên mỗi lần nạp.'
    },
    'M1 Garand':{
      ammo:'7.62mm',mode:'Bán tự động',mag:'8 viên (tham khảo)',group:'Súng trường thiện xạ',
      note:'PUBG MOBILE 4.3 giới thiệu M1 Garand là súng bán tự động có tiếng “ping” khi hết băng và lưỡi lê để cận chiến. PUBG MOBILE Nhật Bản xác nhận đây là DMR dùng đạn 7.62mm; băng 8 viên được đối chiếu từ các nguồn Wiki/cộng đồng.',
      att:['Ống ngắm / Canted Sight','Đầu nòng','Báng súng']
    },
    'DSR':{
      ammo:'7.62mm',mode:'Bắn từng viên',mag:'5 viên (tham khảo)',group:'Súng bắn tỉa',
      note:'PUBG MOBILE xác nhận DSR là SR dùng đạn 7.62mm. Bản 3.9 hạ giá xuống 35 Xu Cửa Hàng và cho phép xuất hiện trong thính hoặc hiếm hơn trên mặt đất. Dung lượng 5 viên và các điểm hiệu năng là số Wiki tham khảo.',
      maps:ALL_MAPS,att:['Đầu nòng','Băng đạn','Báng súng'],score:[82,93,null,95,null],scoreSource:'DSR: các điểm Sức mạnh 82, Tốc độ bắn 93 và Phạm vi 95 lấy từ Wiki tham khảo BitTopup.'
    },
    'Dual MP7':{
      ammo:'9mm',mode:'Chưa xác minh',mag:'40 viên (tham khảo)',group:'Súng ngắn',
      note:'PUBG MOBILE xác nhận Dual MP7 là vũ khí song súng chiếm ô súng ngắn, dùng đạn 9mm, cơ động cao, tốc độ bắn nhanh, không hỗ trợ ADS và có thể nhặt dưới đất hoặc từ thính. Băng 40 viên và điểm hiệu năng là số Wiki tham khảo.',
      score:[22,100,null,null,null],scoreSource:'Dual MP7: Sức mạnh 22 và Tốc độ bắn 100 là chỉ số Wiki tham khảo.'
    },
    'Tactical Crossbow':{
      ammo:'Bolt',mode:'Một phát',mag:'1 bolt (tham khảo)',group:'Đặc biệt',
      note:'PUBG MOBILE giới thiệu Nỏ Chiến Thuật trên Nusa: có thể bắn dây để sửa zipline hoặc dùng mũi tên lửa đốt một số công trình. Loại đạn Bolt, băng 1 và điểm hiệu năng được đối chiếu từ Wiki tham khảo.',
      maps:['Nusa'],score:[85,90,null,null,null],scoreSource:'Nỏ Chiến Thuật: Sức mạnh 85 và Tốc độ bắn 90 là chỉ số Wiki tham khảo.'
    },
    'Mortar':{
      ammo:'Đạn nổ đặc biệt',mode:'Ngắm trực tiếp/Ngắm qua bản đồ',mag:'Không áp dụng',group:'Đặc biệt',
      note:'PUBG MOBILE 4.0 giới thiệu Mortar: vũ khí nhẹ do một người mang, chiếm ô súng ngắn, dùng đạn nổ đặc biệt và có hai cách khai hỏa — ngắm trực tiếp mục tiêu trong tầm nhìn hoặc chọn khu vực trên bản đồ để bắn ngoài tầm nhìn.'
    }
  };

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function patchData(){
    if(typeof DATA==='undefined'||!Array.isArray(DATA.weapons))return false;
    const p90=DATA.weapons.find(r=>r[0]==='P90');
    if(p90){p90[2]='9mm';p90[3]='Đơn/Loạt/Tự động';}

    for(const item of NEW_ROWS){
      if(DATA.weapons.some(r=>r[0]===item.row[0]))continue;
      const at=DATA.weapons.findIndex(r=>r[0]===item.after);
      if(at>=0)DATA.weapons.splice(at+1,0,item.row);
      else DATA.weapons.push(item.row);
    }
    return true;
  }

  function syncCount(){
    if(typeof DATA==='undefined')return;
    document.querySelectorAll('#tbWikiTabs .tb-wiki-tab[data-tab="weapons"] small').forEach(el=>{
      const value=String(DATA.weapons.length);
      if(el.textContent!==value)el.textContent=value;
    });
  }

  function patchCards(){
    const grid=document.getElementById('tbWikiGrid');
    if(!grid)return;
    grid.querySelectorAll('.tb-wiki-card').forEach(card=>{
      const name=card.querySelector('h3')?.textContent.trim();
      const src=IMAGES[name];
      if(!src)return;
      const visual=card.querySelector('.tb-card-visual');
      if(!visual||visual.dataset.v147Image===src)return;
      const fallback=visual.innerHTML;
      const img=document.createElement('img');
      img.className='tb-real-item-image';
      img.alt=name;
      img.loading='lazy';
      img.decoding='async';
      img.fetchPriority='low';
      img.referrerPolicy='no-referrer';
      img.onerror=()=>{
        if(visual.dataset.v147Image!==src)return;
        delete visual.dataset.v147Image;
        visual.innerHTML=fallback;
      };
      visual.dataset.v147Image=src;
      visual.classList.add('tb-real-image');
      visual.replaceChildren(img);
      img.src=src;
    });
  }

  function setFact(root,label,value){
    if(value==null)return;
    const fact=[...root.querySelectorAll('.tb-v145-fact')].find(x=>x.querySelector('small')?.textContent.trim()===label);
    const b=fact?.querySelector('b');
    if(b&&b.textContent!==String(value))b.textContent=String(value);
  }

  function setLeftNote(root,text){
    if(!text)return;
    const left=root.querySelector('.tb-v145-left');
    if(!left)return;
    let note=left.querySelector('.tb-v145-note');
    if(!note){
      note=document.createElement('div');
      note.className='tb-v145-note';
      const facts=left.querySelector('.tb-v145-facts');
      facts?.insertAdjacentElement('afterend',note);
    }
    const html=`<b>Thông tin đã đối chiếu:</b> ${esc(text)}`;
    if(note&&note.innerHTML!==html)note.innerHTML=html;
  }

  function setOfficialDamage(root,value){
    const row=[...root.querySelectorAll('.tb-v145-stat')].find(x=>{
      const t=x.querySelector('span')?.textContent.trim();
      return t==='Sức mạnh'||t==='Sát thương cơ bản';
    });
    if(!row)return;
    const label=row.querySelector('span');
    const b=row.querySelector('b');
    const fill=row.querySelector('.tb-v145-fill');
    if(label&&label.textContent!=='Sát thương cơ bản')label.textContent='Sát thương cơ bản';
    if(b&&b.textContent!==String(value))b.textContent=String(value);
    if(fill&&fill.style.width!==`${Math.max(0,Math.min(100,value))}%`)fill.style.width=`${Math.max(0,Math.min(100,value))}%`;
    const note=root.querySelector('.tb-v145-score-note');
    if(note){
      const text='Sát thương cơ bản dùng số chính thức hiện hành; các thanh còn lại chỉ hiển thị khi có nguồn Wiki tham khảo riêng.';
      if(note.textContent!==text)note.textContent=text;
    }
  }

  function setReferenceStats(root,score,source){
    if(!Array.isArray(score))return;
    const left=root.querySelector('.tb-v145-left');
    if(!left)return;
    const title=left.querySelector('.tb-v145-score-title');
    if(!title)return;
    const names=['Sức mạnh','Tốc độ bắn','Tốc độ nạp','Phạm vi','Độ giật'];
    let stats=left.querySelector('.tb-v145-stats');
    if(!stats){
      const unknown=title.nextElementSibling;
      if(unknown?.classList.contains('tb-v145-unknown'))unknown.remove();
      const note=document.createElement('div');
      note.className='tb-v145-score-note';
      title.insertAdjacentElement('afterend',note);
      stats=document.createElement('div');
      stats.className='tb-v145-stats';
      note.insertAdjacentElement('afterend',stats);
    }
    stats.innerHTML=score.map((v,i)=>v==null?'':`<div class="tb-v145-stat"><span>${names[i]}</span><b>${v}/100</b><div class="tb-v145-track"><div class="tb-v145-fill" style="width:${Math.max(0,Math.min(100,v))}%"></div></div></div>`).join('');
    const note=left.querySelector('.tb-v145-score-note');
    if(note&&source)note.textContent=source;
  }

  function replaceRightSection(root,titleContains,html,key){
    const right=root.querySelector('.tb-v145-right');
    if(!right)return;
    const title=[...right.querySelectorAll('.tb-v145-title')].find(x=>x.textContent.includes(titleContains));
    const next=title?.nextElementSibling;
    if(!title||!next||next.dataset.v147Section===key)return;
    const wrap=document.createElement('div');
    wrap.dataset.v147Section=key;
    wrap.innerHTML=html;
    next.replaceWith(wrap);
  }

  function mapHtml(maps){
    return `<div class="tb-v145-mapgrid">${ALL_MAPS.map(m=>`<div class="tb-v145-map ${maps.includes(m)?'on':''}"><i>${maps.includes(m)?'✓':''}</i>${m}</div>`).join('')}</div>`;
  }

  function attHtml(items){
    return `<div class="tb-v145-att">${items.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`;
  }

  function patchDetail(root){
    if(!root?.classList?.contains('open'))return;
    const name=root.querySelector('h2')?.textContent.trim();
    const left=root.querySelector('.tb-v145-left');
    if(!name||!left)return;
    if(left.querySelector('[data-v147-marker]')?.dataset.v147Marker===name)return;

    const p=DETAIL[name];
    const damage=DAMAGE_CURRENT[name];
    if(!p&&damage==null)return;

    if(p){
      setFact(root,'Loại đạn',p.ammo);
      setFact(root,'Chế độ bắn',p.mode);
      setFact(root,'Băng mặc định',p.mag);
      setFact(root,'Nhóm',p.group);
      setLeftNote(root,p.note);

      if(p.score)setReferenceStats(root,p.score,p.scoreSource);
      if(p.maps)replaceRightSection(root,'Bản đồ',mapHtml(p.maps),`maps-${name}`);
      if(p.att)replaceRightSection(root,'Phụ kiện',attHtml(p.att),`att-${name}`);

      const gun=root.querySelector('.tb-v145-gun');
      if(gun&&!gun.querySelector('img')&&IMAGES[name]){
        gun.innerHTML=`<img src="${esc(IMAGES[name])}" alt="${esc(name)}" loading="eager" decoding="async" referrerpolicy="no-referrer">`;
      }
    }

    if(damage!=null)setOfficialDamage(root,damage);

    const marker=document.createElement('span');
    marker.hidden=true;
    marker.dataset.v147Marker=name;
    left.appendChild(marker);
  }

  function start(){
    if(!patchData()){setTimeout(start,60);return;}
    const tabs=document.getElementById('tbWikiTabs');
    const grid=document.getElementById('tbWikiGrid');
    if(!tabs||!grid){setTimeout(start,60);return;}

    const weaponBtn=tabs.querySelector('.tb-wiki-tab[data-tab="weapons"]');
    if(weaponBtn?.classList.contains('active')&&!document.documentElement.dataset.v147Rerendered){
      document.documentElement.dataset.v147Rerendered='1';
      weaponBtn.click();
    }

    let queued=false;
    const sync=()=>{
      syncCount();
      patchCards();
      const detail=document.querySelector('.tb-v145');
      if(detail)patchDetail(detail);
    };
    const queue=()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;sync();});
    };

    const obs=new MutationObserver(queue);
    obs.observe(tabs,{childList:true,subtree:true});
    obs.observe(grid,{childList:true,subtree:true});

    const attachDetail=root=>{
      const detailObs=new MutationObserver(queue);
      detailObs.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
      queue();
    };
    const detail=document.querySelector('.tb-v145');
    if(detail){
      attachDetail(detail);
    }else{
      const finder=new MutationObserver(()=>{
        const root=document.querySelector('.tb-v145');
        if(!root)return;
        finder.disconnect();
        attachDetail(root);
      });
      finder.observe(document.body,{childList:true,subtree:true});
    }

    sync();
  }

  start();
})();