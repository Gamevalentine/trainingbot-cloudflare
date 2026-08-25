(()=>{
  const VEHICLE_ALIAS={
    'Xe Buggy':'Buggy','Xe mô tô':'Motorcycle','Xe mô tô có thùng bên':'Motorcycle + Sidecar',
    'Xe bán tải':'Pickup','Xe bán tải kín':'Pickup kín','Xe tải nhỏ':'Van','Xe tay ga':'Scooter',
    'Xe trượt tuyết':'Snowmobile','Xe máy tuyết':'Snowbike','Tàu lượn có động cơ':'Motor Glider',
    'Xe tải quái vật':'Monster Truck','Xe đạp địa hình':'Mountain Bike'
  };

  const SPEED={
    'UAZ':131,'UAZ kín':131,'Dacia 1300':133,'Buggy':120,'Motorcycle':151,
    'Motorcycle + Sidecar':110,'Mirado':163,'Mirado mui trần':163,'Pickup':115,'Pickup kín':115,
    'Van':116,'Rony':106,'Scooter':90,'Tukshai':73,'Snowmobile':105,'Snowbike':134,
    'Zima UAZ':110,'Coupe RB':150,'Motor Glider':110,'BRDM-2':104,'Aquarail':84,'PG-117':95,
    'Monster Truck':104,'UTV':115,'Quad':110,'Mountain Bike':62
  };

  const MAP_INFO={
    'Erangel':{players:100,terrain:'Đồng cỏ, đồi, đô thị',duration:null,highlights:'Bản đồ lớn 8×8 km, nhịp chơi cân bằng giữa giao tranh gần, trung và xa.'},
    'Miramar':{players:100,terrain:'Sa mạc, đồi cao, vùng mở',duration:null,highlights:'Địa hình khô và tầm nhìn xa; phù hợp giao tranh tầm trung – xa và xoay bo bằng phương tiện.'},
    'Sanhok':{players:100,terrain:'Rừng nhiệt đới, khu dân cư dày',duration:null,highlights:'Bản đồ 4×4 km có mật độ giao tranh cao; QBZ, QBU và Tukshai là các đặc trưng nổi bật.'},
    'Vikendi':{players:100,terrain:'Tuyết, thị trấn, vùng mở',duration:null,highlights:'Bản đồ 6×6 km có nhịp chơi hỗn hợp, nhiều khu đô thị và địa hình tuyết.'},
    'Livik':{players:52,terrain:'Bắc Âu, đồi núi, đô thị nhỏ',duration:'Khoảng 15 phút',highlights:'Bản đồ 2×2 km thiết kế cho trận nhanh; có khu tiếp tế cao cấp, UTV và các cơ chế triệu hồi.'},
    'Karakin':{players:64,terrain:'Khô cằn, núi đá, đường hầm',duration:null,highlights:'Bản đồ 2×2 km; có Khu Vực Phá Hủy và cơ chế đạn xuyên qua một số tường mỏng.'},
    'Nusa':{players:32,terrain:'Đảo nhiệt đới, nhiều công trình',duration:'Khoảng 8 phút',highlights:'Bản đồ 1×1 km; có Triệu Hồi Đặc Biệt, zipline, thang máy, Quad và giao tranh rất nhanh.'},
    'Rondo':{players:100,terrain:'Đô thị lớn + vùng mở đa địa hình',duration:null,highlights:'Bản đồ 8×8 km; có Jadena City, EMP Zone, phá hủy địa hình, Premium Store và các phương tiện đặc trưng.'}
  };

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function addStyle(){
    if(document.getElementById('tb-v148-style'))return;
    const s=document.createElement('style');
    s.id='tb-v148-style';
    s.textContent=`
      .tb-v148-hero{display:grid;grid-template-columns:minmax(180px,.75fr) minmax(0,1.25fr);gap:18px;align-items:center;margin-bottom:18px}
      .tb-v148-image{min-height:170px;border:1px solid rgba(255,255,255,.08);border-radius:15px;background:#0b1018;display:flex;align-items:center;justify-content:center;overflow:hidden}
      .tb-v148-image img{display:block;max-width:92%;max-height:155px;object-fit:contain}
      .tb-v148-map .tb-v148-image img{width:100%;height:170px;max-width:none;max-height:none;object-fit:cover}
      .tb-v148-summary{color:#aeb9cc;line-height:1.7}.tb-v148-summary b{color:#fff}
      .tb-v148-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}
      .tb-v148-item{padding:13px 14px;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:#101622}
      .tb-v148-item small{display:block;color:#7f8ca5;font-size:.67rem;font-weight:900;text-transform:uppercase;letter-spacing:.07em}
      .tb-v148-item b{display:block;margin-top:4px;color:#f5f7ff}
      .tb-v148-note{margin-top:14px;padding:13px 14px;border-left:3px solid #4f7cff;border-radius:0 11px 11px 0;background:rgba(79,124,255,.07);color:#aeb9cc;line-height:1.6}
      @media(max-width:620px){.tb-v148-hero{grid-template-columns:1fr}.tb-v148-image{min-height:135px}.tb-v148-map .tb-v148-image img{height:145px}.tb-v148-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function findVehicle(title){
    if(typeof DATA==='undefined')return null;
    const raw=VEHICLE_ALIAS[title]||title;
    return DATA.vehicles?.find(r=>r[0]===raw)||null;
  }
  function findMap(title){
    if(typeof DATA==='undefined')return null;
    return DATA.maps?.find(r=>r[0]===title)||null;
  }
  function imageFrom(card){const img=card.querySelector('.tb-card-visual img');return img?.currentSrc||img?.src||'';}
  function surface(row){
    if(row[0]==='BRDM-2')return 'Đường bộ + mặt nước';
    if(row[1]==='Phương tiện nước')return 'Mặt nước';
    if(row[1]==='Máy bay nhẹ')return 'Trên không';
    if(row[1]==='Xe tuyết')return 'Tuyết / băng';
    return 'Đường bộ';
  }

  function openVehicle(card,row,title){
    const modal=document.getElementById('tbWikiModal'),body=document.getElementById('tbWikiModalBody'),head=document.getElementById('tbWikiModalTitle');
    if(!modal||!body||!head)return;
    addStyle();head.textContent=title;
    const img=imageFrom(card),speed=SPEED[row[0]];
    body.innerHTML=`<div class="tb-v148-hero"><div class="tb-v148-image">${img?`<img src="${esc(img)}" alt="${esc(title)}" loading="eager" decoding="async">`:''}</div><div class="tb-v148-summary"><b>${esc(row[1])}</b><br>${esc(row[4]||'Chưa có mô tả chi tiết.')}</div></div><div class="tb-v148-grid"><div class="tb-v148-item"><small>Loại xe</small><b>${esc(row[1])}</b></div><div class="tb-v148-item"><small>Số chỗ ngồi</small><b>${esc(row[2])}</b></div><div class="tb-v148-item"><small>Bản đồ xuất hiện</small><b>${esc(row[3])}</b></div><div class="tb-v148-item"><small>Tốc độ tối đa</small><b>${speed?`${speed} km/h (tham khảo)`:'Chưa xác minh'}</b></div><div class="tb-v148-item"><small>Môi trường di chuyển</small><b>${esc(surface(row))}</b></div><div class="tb-v148-item"><small>Độ bền</small><b>Chưa xác minh</b></div></div><div class="tb-v148-note">Tốc độ tối đa đang dùng bộ số Wiki tham khảo hiện có trên TrainingBot. Những thông số chưa có nguồn đủ chắc được giữ ở trạng thái “Chưa xác minh”.</div>`;
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  }

  function openMap(card,row,title){
    const modal=document.getElementById('tbWikiModal'),body=document.getElementById('tbWikiModalBody'),head=document.getElementById('tbWikiModalTitle');
    if(!modal||!body||!head)return;
    addStyle();head.textContent=title;
    const info=MAP_INFO[title]||{},img=imageFrom(card);
    body.innerHTML=`<div class="tb-v148-hero tb-v148-map"><div class="tb-v148-image">${img?`<img src="${esc(img)}" alt="Bản đồ ${esc(title)}" loading="eager" decoding="async">`:''}</div><div class="tb-v148-summary"><b>${esc(row[2])}</b><br>${esc(row[3])}</div></div><div class="tb-v148-grid"><div class="tb-v148-item"><small>Kích thước</small><b>${esc(row[1])}</b></div><div class="tb-v148-item"><small>Số người chơi tối đa</small><b>${info.players?`${info.players} người`:'Chưa xác minh'}</b></div><div class="tb-v148-item"><small>Nhịp chơi</small><b>${esc(row[2])}</b></div><div class="tb-v148-item"><small>Địa hình</small><b>${esc(info.terrain||'Chưa xác minh')}</b></div><div class="tb-v148-item"><small>Thời lượng trận</small><b>${esc(info.duration||'Chưa xác minh')}</b></div><div class="tb-v148-item"><small>Chế độ</small><b>Classic / tùy hàng chờ hiện có</b></div></div><div class="tb-v148-note"><b>Điểm nổi bật:</b> ${esc(info.highlights||row[3])}<br><br><b>Lưu ý:</b> số người chơi là mức tối đa của bản đồ trong Classic; số người thực tế có thể thay đổi theo hàng chờ, bot, chế độ hoặc bản cập nhật.</div>`;
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  }

  function boot(){
    const grid=document.getElementById('tbWikiGrid');
    if(!grid){setTimeout(boot,70);return;}
    grid.addEventListener('click',e=>{
      const card=e.target.closest('.tb-wiki-card');if(!card)return;
      const title=card.querySelector('h3')?.textContent.trim();if(!title)return;
      const vehicle=findVehicle(title),map=findMap(title);
      if(!vehicle&&!map)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      if(vehicle)openVehicle(card,vehicle,title);else openMap(card,map,title);
    },true);
  }
  boot();
})();