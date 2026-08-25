(()=>{
  const CATEGORY={
    'Súng trường tấn công':{role:'Đa dụng',pros:'Cân bằng giữa sát thương, tốc độ bắn và khả năng kiểm soát; phù hợp nhiều cự ly.',cons:'Hiệu quả phụ thuộc khá nhiều vào kiểm soát giật và bộ phụ kiện.',stats:[58,82,68,58,64],att:['Ống ngắm chấm đỏ','Nòng bù giật (Súng trường)','Tay cầm dọc','Băng đạn mở rộng thay nhanh (Súng trường)','Báng súng chiến thuật (Súng trường, Tiểu liên)']},
    'DMR':{role:'Trung – xa',pros:'Sát thương từng phát tốt, phù hợp bắn nhịp ở trung và xa.',cons:'Đòi hỏi kiểm soát độ giật và nhịp bắn chính xác.',stats:[64,70,62,78,70],att:['Ống ngắm 4x','Ống ngắm 6x','Nòng bù giật (Súng bắn tỉa)','Băng đạn mở rộng thay nhanh (Súng bắn tỉa)','Đệm má (Súng bắn tỉa)']},
    'Súng bắn tỉa':{role:'Tầm xa',pros:'Sát thương lớn và khả năng kết liễu mục tiêu ở cự ly xa.',cons:'Tốc độ bắn chậm; cần vị trí và độ chính xác cao.',stats:[88,28,58,92,54],att:['Ống ngắm 8x','Nòng giảm thanh (Súng bắn tỉa)','Băng đạn mở rộng (Súng bắn tỉa)','Đệm má (Súng bắn tỉa)']},
    'SMG':{role:'Cận chiến',pros:'Tốc độ bắn cao, cơ động tốt và dễ kiểm soát ở cự ly gần.',cons:'Sát thương và hiệu quả giảm rõ khi giao tranh tầm xa.',stats:[43,91,72,38,45],att:['Ống ngắm chấm đỏ','Nòng giảm thanh (Súng tiểu liên, Súng ngắn)','Laser ngắm','Băng đạn mở rộng thay nhanh (Súng tiểu liên, Súng ngắn)']},
    'Shotgun':{role:'Cận chiến',pros:'Sát thương bùng nổ rất mạnh trong phạm vi gần.',cons:'Tầm hiệu quả ngắn và độ ổn định thấp khi mục tiêu ở xa.',stats:[91,48,72,14,58],att:['Mỏ vịt (Súng săn)','Bộ nạp nhanh súng săn','Dây đạn (Súng săn, Bắn tỉa)']},
    'LMG':{role:'Hỏa lực duy trì',pros:'Băng đạn lớn, hỏa lực liên tục mạnh và thích hợp áp chế.',cons:'Thay đạn lâu và kém cơ động hơn các nhóm súng khác.',stats:[55,86,40,58,72],att:['Ống ngắm chấm đỏ','Ống ngắm 3x','Nòng bù giật (Súng trường)']},
    'Súng ngắn':{role:'Vũ khí phụ',pros:'Gọn nhẹ, rút súng nhanh và hữu dụng đầu trận.',cons:'Sức mạnh và tầm hiệu quả hạn chế so với vũ khí chính.',stats:[36,58,76,24,38],att:['Ống ngắm chấm đỏ','Nòng giảm thanh (Súng tiểu liên, Súng ngắn)','Laser ngắm','Băng đạn mở rộng thay nhanh (Súng tiểu liên, Súng ngắn)']},
    'Đặc biệt':{role:'Chiến thuật',pros:'Có cơ chế riêng và tạo lợi thế trong tình huống phù hợp.',cons:'Khả năng sử dụng bị giới hạn bởi loại vũ khí và hoàn cảnh.',stats:[70,28,62,48,35],att:[]}
  };

  const SPECIAL={
    'M416':{mag:30,stats:[41,85,71,50,76],pros:'Tương thích với nhiều phụ kiện. Khi được trang bị đầy đủ, súng có độ ổn định cao.',cons:'Phụ thuộc khá nhiều vào phụ kiện để đạt độ ổn định tối đa.',att:['Ống ngắm chấm đỏ','Ống ngắm 3x','Ống ngắm 4x','Ống ngắm 6x','Nòng bù giật (Súng trường)','Tay cầm dọc','Băng đạn mở rộng thay nhanh (Súng trường)','Báng súng chiến thuật (Súng trường, Tiểu liên)']},
    'UMP45':{mag:25,stats:[42,88,65,44,50]},
    'Mk47 Mutant':{mag:20,stats:[48,92,66,52,76],att:['Ống ngắm chấm đỏ','Nòng bù giật (Súng trường)','Tay cầm góc','Băng đạn mở rộng thay nhanh (Súng trường)','Báng súng chiến thuật (Súng trường, Tiểu liên)','Bộ chuyển chế độ tự động']},
    'S1897':{mag:5,stats:[95,84,83,13,44],att:['Mỏ vịt (Súng săn)','Dây đạn (Súng săn, Bắn tỉa)']},
    'Mk12':{mag:20,stats:[48,84,63,72,50]},
    'AKM':{mag:30},'M16A4':{mag:30},'SCAR-L':{mag:30},'GROZA':{mag:30},'AUG':{mag:30},'QBZ':{mag:30},'M762':{mag:30},'G36C':{mag:30},'ACE32':{mag:30},
    'Mini14':{mag:20},'SKS':{mag:10},'SLR':{mag:10},'Mk14':{mag:10},'QBU':{mag:10},'VSS':{mag:10},
    'Kar98k':{mag:5},'M24':{mag:5},'AWM':{mag:5},'Win94':{mag:8},'Mosin Nagant':{mag:5},'AMR':{mag:5},
    'UZI':{mag:25},'Vector':{mag:19},'Thompson SMG':{mag:50},'PP-19 Bizon':{mag:53},'MP5K':{mag:30},'P90':{mag:50},
    'S686':{mag:2},'S12K':{mag:5},'DBS':{mag:14},'M1014':{mag:7},
    'M249':{mag:75},'DP-28':{mag:47},'MG3':{mag:75},
    'P92':{mag:15},'P1911':{mag:7},'R1895':{mag:7},'P18C':{mag:17},'R45':{mag:6},'Sawed-Off':{mag:2},'Skorpion':{mag:20},'Desert Eagle':{mag:7}
  };

  const MAPS={
    'QBZ':['Sanhok'],'QBU':['Sanhok'],'G36C':['Vikendi'],'MP5K':['Vikendi'],'Win94':['Miramar'],'Monster':[],
    'Groza':[],'JS9':['Rondo'],'M1014':['Livik'],'NS2000':['Livik'],'Honey Badger':['Livik'],'FAMAS':['Livik']
  };
  const AIRDROP=new Set(['GROZA','AWM','Mk14','AMR','P90']);
  const ALL_MAPS=['Erangel','Miramar','Vikendi','Sanhok','Karakin','Nusa','Livik','Rondo'];

  const ATT_IMG={
    'Ống ngắm chấm đỏ':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Upper_DotSight_01_C.png',
    'Ống ngắm 3x':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Upper_Scope3x_C.png',
    'Ống ngắm 4x':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Upper_ACOG_01_C.png',
    'Ống ngắm 6x':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Upper_Scope6x_C.png',
    'Ống ngắm 8x':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Upper_PM2_01_C.png',
    'Nòng bù giật (Súng trường)':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_Compensator_Large_C.png',
    'Nòng bù giật (Súng bắn tỉa)':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_Compensator_SniperRifle_C.png',
    'Nòng giảm thanh (Súng bắn tỉa)':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_Suppressor_SniperRifle_C.png',
    'Nòng giảm thanh (Súng tiểu liên, Súng ngắn)':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_Suppressor_Small_C.png',
    'Tay cầm góc':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Lower_AngledForeGrip_C.png',
    'Tay cầm dọc':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Lower_Foregrip_C.png',
    'Laser ngắm':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Lower_LaserPointer_C.png',
    'Băng đạn mở rộng thay nhanh (Súng trường)':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Magazine_ExtendedQuickDraw_Large_C.png',
    'Băng đạn mở rộng thay nhanh (Súng bắn tỉa)':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Magazine_ExtendedQuickDraw_SniperRifle_C.png',
    'Băng đạn mở rộng (Súng bắn tỉa)':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Magazine_Extended_SniperRifle_C.png',
    'Băng đạn mở rộng thay nhanh (Súng tiểu liên, Súng ngắn)':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Magazine_ExtendedQuickDraw_Small_C.png',
    'Báng súng chiến thuật (Súng trường, Tiểu liên)':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Stock_AR_Composite_C.png',
    'Đệm má (Súng bắn tỉa)':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Stock_SniperRifle_CheekPad_C.png',
    'Dây đạn (Súng săn, Bắn tỉa)':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Stock_Shotgun_BulletLoops_C.png',
    'Mỏ vịt (Súng săn)':'https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_Duckbill_C.png'
  };

  const viName={'Nỏ':'Crossbow','Súng pháo sáng':'Flare Gun','Súng cưa nòng':'Sawed-Off'};
  const displayType=t=>({'DMR':'Súng trường thiện xạ','SMG':'Súng tiểu liên','LMG':'Súng máy hạng nhẹ','Shotgun':'Súng săn'})[t]||t;
  const fireVi=s=>(s||'').replaceAll('Burst','Loạt').replaceAll('Bolt-action','Lên đạn từng viên').replaceAll('Lever-action','Đòn bẩy').replaceAll('Pump-action','Bơm đạn').replaceAll('Revolver','Ổ xoay');

  function style(){
    if(document.getElementById('tb-weapon-detail-v144-style'))return;
    const s=document.createElement('style');s.id='tb-weapon-detail-v144-style';s.textContent=`
      .tb-wd{position:fixed;inset:0;z-index:260;background:#07090f;display:none;overflow:auto;color:#f7f8fc}.tb-wd.open{display:block}
      .tb-wd-bg{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(79,124,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.025) 1px,transparent 1px);background-size:64px 64px}
      .tb-wd-wrap{position:relative;min-height:100vh;padding:52px 5vw 44px;display:grid;grid-template-columns:minmax(0,.95fr) minmax(460px,1.1fr);gap:54px}
      .tb-wd-close{position:fixed;right:28px;top:28px;z-index:3;width:58px;height:58px;border:1px solid #343a49;border-radius:50%;background:#0c0f16;color:#fff;font-size:34px;line-height:1;cursor:pointer}
      .tb-wd-left{display:flex;flex-direction:column;min-width:0}.tb-wd-crumb{color:#8d96aa;font-size:.82rem;margin-bottom:26px}.tb-wd-crumb b{color:#cbd5e1}.tb-wd-type{color:#7da2ff;font-size:.75rem;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.tb-wd h2{margin:10px 0 8px;font:900 clamp(3rem,5vw,4.7rem)/.95 "Space Grotesk",Inter,sans-serif;letter-spacing:-.05em;background:linear-gradient(135deg,#8b78ff,#4f7cff,#22d3ee);-webkit-background-clip:text;color:transparent}.tb-wd-meta{display:flex;flex-wrap:wrap;gap:10px;color:#c0c7d6;font-weight:800;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase}.tb-wd-meta span+span:before{content:'|';margin-right:10px;color:#475067}.tb-wd-notes{margin-top:18px;max-width:720px}.tb-wd-notes p{margin:8px 0;font-size:1rem;line-height:1.55}.tb-wd-pro{color:#54e29a;font-weight:900}.tb-wd-con{color:#ff707b;font-weight:900}
      .tb-wd-gun{height:250px;margin:24px 0 22px;display:flex;align-items:center;justify-content:center}.tb-wd-gun img{max-width:78%;max-height:220px;object-fit:contain;filter:drop-shadow(0 18px 28px rgba(0,0,0,.45))}.tb-wd-stats{margin-top:auto;display:grid;grid-template-columns:1fr 1fr;gap:18px 34px}.tb-stat-row{display:grid;grid-template-columns:1fr auto;gap:8px}.tb-stat-label{font-size:.9rem;color:#d9deea}.tb-stat-value{color:#78a3ff;font-weight:900}.tb-stat-track{grid-column:1/-1;height:8px;border-radius:99px;background:#252b37;overflow:hidden}.tb-stat-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,#7357ff,#4f7cff 55%,#22d3ee)}
      .tb-wd-right{padding-top:10px;min-width:0}.tb-wd-maps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px 20px;margin:0 0 24px}.tb-map-chip{display:flex;align-items:center;gap:8px;color:#d8ddea;font-weight:800;font-size:.85rem}.tb-map-chip i{width:16px;height:16px;border:1px solid #45516a;border-radius:3px;display:grid;place-items:center;font-style:normal;color:#63dff3;font-size:.8rem}.tb-map-chip.on i{border-color:#4f7cff;background:rgba(79,124,255,.13)}.tb-map-chip.off{color:#4b5365}.tb-map-chip.air i{border-color:#22d3ee}.tb-wd-section-title{margin:18px 0 12px;font-size:1rem;font-weight:1000;letter-spacing:.07em;text-transform:uppercase}.tb-wd-att-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.tb-wd-att{min-height:142px;border:1px solid #2d3442;border-radius:13px;background:#0d1118;padding:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.tb-wd-att img{width:88%;height:82px;object-fit:contain}.tb-wd-att span{margin-top:7px;color:#c8cedb;font-size:.72rem;line-height:1.25}.tb-wd-empty{color:#6f788c;font-size:.85rem}
      .tb-wd-nav{position:fixed;top:50%;transform:translateY(-50%);z-index:4;width:52px;height:78px;border:1px solid #38445a;border-radius:16px;background:#0b1018;color:#6ea7ff;font-size:34px;cursor:pointer}.tb-wd-prev{left:18px}.tb-wd-next{right:18px}
      @media(max-width:980px){.tb-wd-wrap{grid-template-columns:1fr;padding:76px 22px 110px;gap:18px}.tb-wd-right{padding-top:0}.tb-wd-gun{height:190px}.tb-wd-gun img{max-width:90%;max-height:165px}.tb-wd-stats{margin-top:10px}.tb-wd-att-grid{grid-template-columns:repeat(3,1fr)}.tb-wd-nav{display:none}}
      @media(max-width:620px){.tb-wd-wrap{padding-left:16px;padding-right:16px}.tb-wd-close{right:14px;top:14px;width:46px;height:46px;font-size:27px}.tb-wd h2{font-size:3rem}.tb-wd-meta{font-size:.68rem}.tb-wd-notes p{font-size:.9rem}.tb-wd-stats{grid-template-columns:1fr}.tb-wd-maps{grid-template-columns:repeat(2,1fr)}.tb-wd-att-grid{grid-template-columns:repeat(2,1fr)}.tb-wd-att{min-height:124px}.tb-wd-att img{height:66px}}
    `;document.head.appendChild(s);
  }

  let overlay=null,currentIndex=0;
  function ensureOverlay(){
    if(overlay)return overlay;style();overlay=document.createElement('div');overlay.className='tb-wd';overlay.innerHTML='<div class="tb-wd-bg"></div><button class="tb-wd-close" aria-label="Đóng">×</button><button class="tb-wd-nav tb-wd-prev" aria-label="Súng trước">‹</button><button class="tb-wd-nav tb-wd-next" aria-label="Súng sau">›</button><div class="tb-wd-wrap"><section class="tb-wd-left"></section><section class="tb-wd-right"></section></div>';document.body.appendChild(overlay);overlay.querySelector('.tb-wd-close').onclick=close;overlay.querySelector('.tb-wd-prev').onclick=()=>move(-1);overlay.querySelector('.tb-wd-next').onclick=()=>move(1);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});return overlay;
  }
  function rowForName(name){const raw=viName[name]||name;return typeof DATA!=='undefined'?DATA.weapons.find(r=>r[0]===raw):null;}
  function imageFor(name,card){const img=card?.querySelector('.tb-card-visual img');return img?.currentSrc||img?.src||'';}
  function profile(row){const base=CATEGORY[row[1]]||CATEGORY['Đặc biệt'],sp=SPECIAL[row[0]]||{};return {...base,...sp,stats:sp.stats||base.stats,att:sp.att||base.att};}
  function render(row,card){
    const o=ensureOverlay(),p=profile(row),name=row[0],img=imageFor(name,card),maps=MAPS[name]||ALL_MAPS,air=AIRDROP.has(name),statNames=['Quyền lực','Tốc độ bắn','Tốc độ nạp đạn','Phạm vi','Phản lực'];
    o.querySelector('.tb-wd-left').innerHTML=`<div class="tb-wd-crumb">Wiki &nbsp;›&nbsp; Vũ khí &nbsp;›&nbsp; <b>${name}</b></div><div class="tb-wd-type">${displayType(row[1])}</div><h2>${name}</h2><div class="tb-wd-meta"><span>${row[2]}</span><span>Chế độ bắn: ${fireVi(row[3])}</span><span>Hộp đạn: ${p.mag||'—'} viên</span></div><div class="tb-wd-notes"><p><span class="tb-wd-pro">Ưu điểm:</span> ${p.pros}</p><p><span class="tb-wd-con">Nhược điểm:</span> ${p.cons}</p></div><div class="tb-wd-gun">${img?`<img src="${img}" alt="${name}">`:''}</div><div class="tb-wd-stats">${p.stats.map((v,i)=>`<div class="tb-stat-row"><span class="tb-stat-label">${statNames[i]}</span><span class="tb-stat-value">${v} <small>/ 100</small></span><div class="tb-stat-track"><div class="tb-stat-fill" style="width:${Math.max(0,Math.min(100,v))}%"></div></div></div>`).join('')}</div>`;
    const mapHtml=ALL_MAPS.map(m=>`<div class="tb-map-chip ${maps.includes(m)?'on':'off'}"><i>${maps.includes(m)?'✓':''}</i><span>${m.toUpperCase()}</span></div>`).join('')+`<div class="tb-map-chip ${air?'on air':'off'}"><i>${air?'✓':''}</i><span>VŨ KHÍ THẢ DÙ</span></div>`;
    const att=(p.att||[]).map(a=>`<div class="tb-wd-att">${ATT_IMG[a]?`<img src="${ATT_IMG[a]}" alt="${a}" loading="lazy">`:''}<span>${a}</span></div>`).join('');
    o.querySelector('.tb-wd-right').innerHTML=`<div class="tb-wd-maps">${mapHtml}</div><div class="tb-wd-section-title">Phụ kiện được đề xuất</div>${att?`<div class="tb-wd-att-grid">${att}</div>`:'<div class="tb-wd-empty">Vũ khí này không cần phụ kiện đề xuất.</div>'}`;
    o.classList.add('open');document.documentElement.style.overflow='hidden';
  }
  function close(){if(!overlay)return;overlay.classList.remove('open');document.documentElement.style.overflow='';}
  function move(dir){if(typeof DATA==='undefined')return;currentIndex=(currentIndex+dir+DATA.weapons.length)%DATA.weapons.length;const row=DATA.weapons[currentIndex];render(row,null);}

  function boot(){
    const grid=document.getElementById('tbWikiGrid');if(!grid){setTimeout(boot,70);return;}
    grid.addEventListener('click',e=>{
      const card=e.target.closest('.tb-wiki-card');if(!card)return;
      const name=card.querySelector('h3')?.textContent.trim();const row=rowForName(name);if(!row)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      currentIndex=DATA.weapons.findIndex(r=>r===row);render(row,card);
    },true);
    document.addEventListener('keydown',e=>{if(!overlay?.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);});
  }
  boot();
})();