(()=>{
  const W={
    'AKM':{mag:30,mode:'Đơn/Tự động',score:[48,84,null,52,null],note:'AR 7.62mm thiên về sát thương từng viên; độ giật cao hơn nhóm 5.56mm.'},
    'M16A4':{mag:30,mode:'Đơn/Loạt 3 viên',score:[41,90,null,53,null],note:'Có 3 chế độ khi gắn Full-Auto Mod: đơn, loạt 3 viên và tự động.',att:['Bộ chuyển chế độ tự động']},
    'SCAR-L':{mag:30,mode:'Đơn/Tự động',score:[41,85,null,53,null]},
    'M416':{mag:30,mode:'Đơn/Tự động',score:[41,85,71,50,76],pros:'Tương thích nhiều phụ kiện; khi lắp đủ có độ ổn định cao.',cons:'Cần nhiều phụ kiện để đạt độ ổn định tối đa.'},
    'GROZA':{mag:30,mode:'Đơn/Tự động',score:[45,89,null,52,null],air:true},
    'AUG':{mag:30,mode:'Đơn/Tự động',score:[41,88,null,49,null]},
    'QBZ':{mag:30,mode:'Đơn/Tự động',score:[42,85,null,49,null],maps:['Livik','Sanhok'],official:'PUBG MOBILE 2.4 tăng sát thương cơ bản 41 → 42; nạp rỗng 3,66s → 3,1s và nạp chiến thuật 3,0s → 2,5s.'},
    'M762':{mag:30,mode:'Đơn/Loạt 3 viên/Tự động',score:[46,88,null,52,null],official:'PUBG MOBILE xác nhận M762 có 3 chế độ: đơn, loạt 3 viên và tự động.'},
    'Mk47 Mutant':{mag:20,mode:'Đơn/Loạt 2 viên',score:[48,92,66,52,76],att:['Ống ngắm chấm đỏ','Nòng bù giật (Súng trường)','Tay cầm góc','Băng đạn mở rộng thay nhanh (Súng trường)','Báng súng chiến thuật (Súng trường, Tiểu liên)','Bộ chuyển chế độ tự động'],official:'Full-Auto Mod cho phép Mk47 dùng chế độ tự động.'},
    'G36C':{mag:30,mode:'Đơn/Tự động',score:[41,85,null,49,null],maps:['Vikendi']},
    'FAMAS':{mag:30,mode:'Đơn/Loạt 3 viên/Tự động',score:[39,96,null,50,null],maps:['Livik','Erangel'],official:'PUBG MOBILE 2.4 giảm tản đạn khi di chuyển 20%, giảm nhẹ giật ngang tối đa và tăng tốc nạp.'},
    'ACE32':{mag:30,mode:'Đơn/Tự động',score:[45,85,null,53,null]},
    'Honey Badger':{mag:30,mode:'Đơn/Tự động',score:[43,87,null,44,null],maps:['Erangel','Sanhok','Livik'],official:'PUBG MOBILE xác nhận dùng 7.62mm, tốc độ bắn tương đối cao và thiên về cận chiến.'},
    'ASM Abakan':{mag:null,mode:'Đơn/Loạt 2 viên/Tự động',score:null,official:'PUBG MOBILE 3.9: dùng 5.56mm; có tự động, loạt 2 viên và bắn đơn. Hai viên đầu có độ chính xác cao.'},
    'Mini14':{mag:20,mode:'Bán tự động',score:[46,84,null,72,null]},
    'SKS':{mag:10,mode:'Bán tự động',score:[53,86,null,72,null]},
    'SLR':{mag:10,mode:'Bán tự động',score:[58,84,null,77,null]},
    'Mk14':{mag:10,mode:'Đơn/Tự động',score:[61,84,62,77,null],air:true},
    'QBU':{mag:10,mode:'Bán tự động',score:[55,84,null,72,null],maps:['Sanhok']},
    'Mk12':{mag:20,mode:'Bán tự động',score:[48,84,63,72,null],official:'PUBG MOBILE xác nhận Mk12 dùng 5.56mm, băng 20 viên và có các khe đầu nòng, tay cầm, băng đạn.'},
    'VSS':{mag:10,mode:'Đơn/Tự động',score:[41,87,null,57,null]},
    'Kar98k':{mag:5,mode:'Lên đạn từng viên',score:[82,25,null,84,null],official:'PUBG MOBILE tăng sát thương cơ bản 79 → 82, tốc độ đạn 760 → 850 m/s và giảm khoảng nghỉ giữa hai phát 30%.'},
    'M24':{mag:5,mode:'Lên đạn từng viên',score:[79,25,59,91,null],official:'PUBG MOBILE tăng tốc độ đạn 760 → 850 m/s và giảm khoảng nghỉ giữa hai phát 30%.'},
    'AWM':{mag:5,mode:'Lên đạn từng viên',score:[88,16,null,93,null],air:true,official:'PUBG MOBILE tăng hệ số sát thương tay/chân và giảm khoảng nghỉ giữa hai phát 20%.'},
    'Win94':{mag:8,mode:'Đòn bẩy',score:[66,45,null,84,null],maps:['Miramar']},
    'Mosin Nagant':{mag:5,mode:'Lên đạn từng viên',score:[73,26,null,88,null]},
    'AMR':{mag:10,mode:'Bán tự động',score:[90,25,null,96,null],air:true,official:'PUBG MOBILE 4.4 tăng băng đạn AMR từ 5 lên 10 viên; tổng lượng đạn mang theo được điều chỉnh lên 15.'},
    'UZI':{mag:25,mode:'Đơn/Tự động',score:[25,100,null,30,null],official:'PUBG MOBILE 2.4 tăng tốc chuyển súng 35% và giảm tản đạn khi di chuyển 30%.'},
    'UMP45':{mag:25,mode:'Đơn/Loạt 2 viên/Tự động',score:[42,88,65,44,50],pros:'Sát thương cận chiến tốt, độ giật và tản đạn khi di chuyển thấp.',cons:'Tốc độ đạn chậm hơn; hiệu quả suy giảm ở trung và xa.',att:['Ống ngắm chấm đỏ','Nòng giảm thanh (Súng tiểu liên, Súng ngắn)','Laser ngắm','Băng đạn mở rộng thay nhanh (Súng tiểu liên, Súng ngắn)'],official:'PUBG MOBILE 2.4 tăng tốc chuyển súng 35%, giảm tản đạn khi di chuyển 20% và giảm suy hao sát thương theo khoảng cách.'},
    'Vector':{mag:19,mode:'Đơn/Loạt 2 viên/Tự động',score:[31,98,null,30,null]},
    'Thompson SMG':{mag:30,mode:'Đơn/Tự động',score:[40,86,null,38,null]},
    'PP-19 Bizon':{mag:53,mode:'Đơn/Tự động',score:[37,89,null,30,null],official:'PUBG MOBILE 2.4 tăng sát thương cơ bản 35 → 37.'},
    'MP5K':{mag:30,mode:'Đơn/Loạt 3 viên/Tự động',score:[33,96,58,30,null]},
    'P90':{mag:50,mode:'Đơn/Loạt/Tự động',score:[34,95,null,null,null],air:true,official:'PUBG MOBILE xác nhận P90 dùng 9mm, băng 50 viên và có chế độ đơn, loạt, tự động.'},
    'JS9':{mag:null,mode:'Đơn/Tự động',score:[32,null,null,null,null],maps:['Tất cả bản đồ Classic'],official:'Thông số chính thức: 9mm; sát thương 32; tầm hiệu quả 200 m; tốc độ đạn 400 m/s; 900 phát/phút; không gắn tay cầm hoặc báng; hỗ trợ ống ngắm tới 6x.',att:['Nòng SMG tương thích','Băng đạn SMG tương thích','Ống ngắm tối đa 6x']},
    'S686':{mag:2,mode:'Hai nòng',score:[95,69,null,22,null]},
    'S1897':{mag:5,mode:'Bơm đạn',score:[95,84,83,13,44],pros:'Sát thương cận chiến rất cao và nhịp bắn liên tục ổn với shotgun bơm.',cons:'Thao tác bơm và nạp chậm; độ tản lớn hơn S686.',att:['Mỏ vịt (Súng săn)','Dây đạn (Súng săn, Bắn tỉa)','Bộ nạp nhanh súng săn']},
    'S12K':{mag:5,mode:'Bán tự động',score:[90,64,null,15,null]},
    'DBS':{mag:14,mode:'Bơm đôi',score:[95,75,null,13,null],att:['Bộ nạp nhanh súng săn']},
    'M1014':{mag:7,mode:'Bán tự động',score:[93,68,83,13,null],maps:['Livik'],att:['Bộ nạp nhanh súng săn']},
    'NS2000':{mag:12,mode:'Bơm đạn',score:[98,84,null,26,null],maps:['Livik'],official:'PUBG MOBILE đã bổ sung NS2000 vào Livik và sau đó cải thiện hiệu năng khi ADS cùng hoạt ảnh nạp đạn.'},
    'M249':{mag:75,mode:'Tự động',score:[41,87,null,57,76],att:['Khiên súng'],official:'PUBG MOBILE tăng sát thương cơ bản M249 lên 41, giảm giật và chuyển động đầu nòng; có thể gắn Gun Shield.'},
    'DP-28':{mag:47,mode:'Tự động',score:[51,42,null,35,null],att:['Khiên súng'],official:'PUBG MOBILE xác nhận DP-28 nhặt lên có sẵn băng đầy 47 viên; tăng độ chính xác hip-fire và sát thương tay/chân; có thể gắn Gun Shield.'},
    'MG3':{mag:75,mode:'Tự động',score:[40,86,null,57,null]},
    'P92':{mag:15,mode:'Bán tự động',score:[34,84,null,22,null]},
    'P1911':{mag:7,mode:'Bán tự động',score:[38,82,null,22,null]},
    'R1895':{mag:7,mode:'Ổ xoay',score:[64,69,null,46,null]},
    'P18C':{mag:17,mode:'Đơn/Tự động',score:[22,95,null,13,null]},
    'R45':{mag:6,mode:'Ổ xoay',score:[65,64,null,46,null]},
    'Sawed-Off':{mag:2,mode:'Hai nòng',score:[80,69,null,22,null]},
    'Skorpion':{mag:20,mode:'Đơn/Tự động',score:[22,92,65,36,62]},
    'Desert Eagle':{mag:7,mode:'Bán tự động',score:[62,69,null,46,null]},
    'Crossbow':{mag:1,mode:'Một phát',score:[85,90,null,30,null],att:['Bao tên (Nỏ)']},
    'Panzerfaust':{mag:1,mode:'Một phát',score:null,maps:['Erangel','Miramar','Rondo','Vikendi'],official:'PUBG MOBILE 4.4 tăng bán kính nổ từ 6 m lên 9 m, giảm vùng chí mạng/backblast và tăng sát thương lên phương tiện (tối đa gần 1.000).'},
    'Flare Gun':{mag:1,mode:'Một phát',score:null,official:'Vật phẩm chiến thuật để gọi tiếp tế/phương tiện; không nên dùng điểm sát thương như vũ khí chiến đấu.'},
    'M79':{mag:1,mode:'Một phát',score:null,official:'M79 trong Payload là súng phóng lựu một phát dùng đạn 40mm.'}
  };

  const ATT={
    'Choke (SG)':'Thu hẹp độ tản đạn của shotgun.',
    'Compensator (SMG)':'Giảm giật ngang/dọc; các bản cập nhật mới cũng tăng độ ổn định khi bắn.',
    'Compensator (Snipers)':'Giảm giật; PUBG MOBILE còn tăng 10% tầm hiệu quả và giảm 10% độ tản cơ bản.',
    'Flash Hider (SMG)':'Ẩn lóe đầu nòng và hỗ trợ kiểm soát giật.',
    'Flash Hider (Snipers)':'Ẩn lóe đầu nòng; PUBG MOBILE giảm thêm 5% độ tản cơ bản.',
    'Suppressor (SMG, Pistols)':'Giảm âm thanh và lóe đầu nòng; bản 3.9 bổ sung giảm nhẹ độ tản đạn.',
    'Suppressor (Snipers)':'Giảm âm thanh và lóe đầu nòng; bản 3.9 bổ sung giảm nhẹ độ tản đạn.',
    'Compensator (AR)':'Giảm giật ngang/dọc; bản 3.9 tăng thêm độ ổn định khi bắn.',
    'Flash Hider (AR)':'Ẩn lóe đầu nòng và hỗ trợ kiểm soát giật.',
    'Suppressor (AR)':'Giảm âm thanh và lóe đầu nòng; bản 3.9 bổ sung giảm nhẹ độ tản đạn.',
    'Duckbill (Shotguns)':'Giảm đáng kể độ tản ngang của shotgun nhưng tăng nhẹ độ tản dọc.',
    'Barrel Extender (SMG)':'Bản 3.9: tăng nhẹ sát thương đạn cho SMG.',
    'Nòng kéo dài (Súng trường)':'Bản 3.9: tăng nhẹ sát thương đạn cho súng trường tấn công.',
    'Nòng kéo dài (Súng bắn tỉa)':'Bản 3.9: tăng đáng kể sát thương đạn nhưng tăng nhẹ độ rung khi bắn.',
    'Muzzle Brake (Snipers)':'Bản 3.9: giảm kiểm soát giật so với trước nhưng tăng ổn định góc nhìn và giảm rung khi bắn.',
    'Muzzle Brake (AR)':'Bản 3.9: giảm kiểm soát giật so với trước nhưng tăng ổn định góc nhìn và giảm rung khi bắn.',
    'Muzzle Brake (SMG)':'Bản 3.9: giảm kiểm soát giật so với trước nhưng tăng ổn định góc nhìn và giảm rung khi bắn.',
    'Angled Foregrip':'Giảm giật ngang và hỗ trợ ADS; bản 4.0 tăng nhẹ khả năng kiểm soát giật ngang.',
    'Vertical Foregrip':'Giảm giật dọc.',
    'Light Grip':'Bản 4.0 chuyển trọng tâm sang tăng ổn định góc nhìn và độ ổn định khi bắn.',
    'Half Grip':'Giảm giật và hỗ trợ hồi tâm; bản 4.0 tăng nhẹ ổn định góc nhìn khi bắn.',
    'Thumb Grip':'Giảm thời gian ADS, hỗ trợ giật dọc và độ ổn định.',
    'Laser Sight':'Giảm độ tản khi hip-fire; bản 4.0 tăng nhẹ hiệu quả giảm tản.',
    'Ergonomic Grip':'Bản 4.0 giảm nhẹ khả năng kiểm soát giật nhưng tăng ổn định khi bắn và giảm độ rung.',
    'Quiver (Crossbow)':'Tăng tốc độ nạp của nỏ.',
    'Red Dot Sight':'Ống ngắm chấm đỏ 1x.',
    'Holographic Sight':'Ống ngắm holographic 1x.',
    '2x Scope':'Ống ngắm phóng đại 2x.',
    '4x Scope':'Ống ngắm phóng đại 4x.',
    '8x Scope':'Ống ngắm phóng đại 8x.',
    '3x Scope':'Ống ngắm phóng đại 3x.',
    '6x Scope':'Ống ngắm phóng đại 6x.',
    'Canted Sight':'Ống ngắm phụ lệch bên, dùng song song với ống ngắm chính trên vũ khí tương thích.',
    'Extended Mag (SMG, Pistols)':'Tăng sức chứa băng đạn.',
    'Quickdraw Mag (SMG, Pistols)':'Tăng tốc độ thay đạn; bản 3.9 tiếp tục tăng tốc độ nạp.',
    'Extended Quickdraw Mag (SMG, Pistols)':'Tăng sức chứa và tốc độ thay đạn.',
    'Extended Mag (Snipers)':'Tăng sức chứa băng đạn.',
    'Quickdraw Mag (Snipers)':'Tăng tốc độ thay đạn; bản 3.9 tiếp tục tăng tốc độ nạp.',
    'Extended Quickdraw Mag (Snipers)':'Tăng sức chứa và tốc độ thay đạn.',
    'Extended Mag (AR)':'Tăng sức chứa băng đạn.',
    'Quickdraw Mag (AR)':'Tăng tốc độ thay đạn; bản 3.9 tiếp tục tăng tốc độ nạp.',
    'Extended Quickdraw Mag (AR)':'Tăng sức chứa và tốc độ thay đạn.',
    'Shotgun Quick Loader':'Tăng tốc độ nạp; tương thích S1897, DBS và M1014.',
    'Mini Drum Mag (AR)':'Tăng mạnh sức chứa băng đạn nhưng tăng nhẹ thời gian nạp.',
    'Stock (Micro UZI)':'Tăng hồi phục giật và giảm rung; tương thích UZI và Skorpion.',
    'Tactical Stock (Rifles, SMG)':'Bản 4.0 giảm nhẹ kiểm soát giật nhưng giảm độ rung khi bắn.',
    'Cheek Pad (Snipers)':'Tăng ổn định khi ngắm/bắn; PUBG MOBILE từng giảm 10% độ tản cơ bản và khi ADS, sau đó cân bằng lại ở bản 4.0.',
    'Bullet Loop (Shotguns, Snipers)':'Tăng tốc độ nạp đạn cho vũ khí tương thích.',
    'Gun Shield':'Tương thích DP-28 và M249; tự mở khi nằm sấp để chắn hỏa lực phía trước.',
    'Full-Auto Mod':'Tương thích M16A4 và Mk47; bổ sung chế độ bắn tự động.',
    'Báng súng nặng':'Giảm đáng kể giật ngang/dọc nhưng làm chậm tốc độ ngắm; có cùng nhóm tương thích với Tactical Stock.'
  };

  const TYPE_VI={'DMR':'Súng trường thiện xạ','SMG':'Súng tiểu liên','LMG':'Súng máy hạng nhẹ','Shotgun':'Súng săn'};
  const ALLMAPS=['Erangel','Miramar','Vikendi','Sanhok','Karakin','Nusa','Livik','Rondo'];
  let overlay=null,currentName='';
  const esc=s=>(s??'').toString().replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function patchData(){
    if(typeof DATA==='undefined')return false;
    DATA.attachments.forEach(r=>{
      if(r[0]==='Barrel Extender (AR, Snipers)')r[0]='Nòng kéo dài (Súng trường)';
      const txt=ATT[r[0]]; if(txt)r[2]=txt;
    });
    if(!DATA.attachments.some(r=>r[0]==='Nòng kéo dài (Súng bắn tỉa)'))DATA.attachments.push(['Nòng kéo dài (Súng bắn tỉa)','Đầu nòng',ATT['Nòng kéo dài (Súng bắn tỉa)']]);
    if(!DATA.attachments.some(r=>r[0]==='Báng súng nặng'))DATA.attachments.push(['Báng súng nặng','Báng súng',ATT['Báng súng nặng']]);
    DATA.attachments.forEach(r=>{if(ATT[r[0]])r[2]=ATT[r[0]];});
    return true;
  }

  function style(){if(document.getElementById('tb-v145-style'))return;const s=document.createElement('style');s.id='tb-v145-style';s.textContent=`
    .tb-v145{position:fixed;inset:0;z-index:400;display:none;overflow:auto;background:#07090f;color:#f5f7ff}.tb-v145.open{display:block}.tb-v145:before{content:'';position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(79,124,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.025) 1px,transparent 1px);background-size:64px 64px}.tb-v145-wrap{position:relative;min-height:100vh;padding:50px 5vw 55px;display:grid;grid-template-columns:minmax(0,.95fr) minmax(440px,1.05fr);gap:48px}.tb-v145-close{position:fixed;right:26px;top:26px;z-index:5;width:56px;height:56px;border:1px solid #354056;border-radius:50%;background:#0c1019;color:#fff;font-size:31px;cursor:pointer}.tb-v145-crumb{color:#818da6;font-size:.8rem;margin-bottom:24px}.tb-v145-type{color:#7da2ff;font-weight:900;font-size:.75rem;letter-spacing:.16em;text-transform:uppercase}.tb-v145 h2{margin:9px 0 10px;font:900 clamp(3rem,5vw,4.7rem)/.95 'Space Grotesk',Inter,sans-serif;letter-spacing:-.05em;background:linear-gradient(135deg,#8b78ff,#4f7cff,#22d3ee);-webkit-background-clip:text;color:transparent}.tb-v145-meta{display:flex;flex-wrap:wrap;gap:9px 18px;color:#d3d9e6;font-size:.82rem;font-weight:800}.tb-v145-facts{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:20px}.tb-v145-fact{padding:12px 13px;border:1px solid #2d3545;border-radius:12px;background:#0d121c}.tb-v145-fact small{display:block;color:#78849b;font-size:.66rem;font-weight:800;text-transform:uppercase}.tb-v145-fact b{display:block;margin-top:3px;color:#f4f7ff}.tb-v145-note{margin-top:15px;padding:13px 14px;border-left:3px solid #4f7cff;background:rgba(79,124,255,.07);border-radius:0 11px 11px 0;color:#b8c2d6;line-height:1.55}.tb-v145-pros{margin:15px 0 0}.tb-v145-pros p{margin:7px 0;line-height:1.5}.tb-v145-pro{color:#54e29a;font-weight:900}.tb-v145-con{color:#ff707b;font-weight:900}.tb-v145-gun{height:230px;display:flex;align-items:center;justify-content:center;margin:18px 0}.tb-v145-gun img{max-width:78%;max-height:205px;object-fit:contain;filter:drop-shadow(0 18px 28px rgba(0,0,0,.45))}.tb-v145-score-title,.tb-v145-title{margin:18px 0 10px;font-weight:1000;letter-spacing:.06em;text-transform:uppercase}.tb-v145-score-note{color:#758199;font-size:.72rem;margin:-4px 0 12px}.tb-v145-stats{display:grid;grid-template-columns:1fr 1fr;gap:16px 28px}.tb-v145-stat{display:grid;grid-template-columns:1fr auto;gap:6px}.tb-v145-stat span{color:#d7deeb}.tb-v145-stat b{color:#78a3ff}.tb-v145-track{grid-column:1/-1;height:7px;border-radius:99px;background:#252c39;overflow:hidden}.tb-v145-fill{height:100%;background:linear-gradient(90deg,#7357ff,#4f7cff,#22d3ee)}.tb-v145-mapgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.tb-v145-map{display:flex;align-items:center;gap:8px;color:#59637a;font-weight:800}.tb-v145-map.on{color:#e9edf8}.tb-v145-map i{width:16px;height:16px;border:1px solid #45516a;border-radius:3px;display:grid;place-items:center;font-style:normal;color:#63dff3;font-size:.75rem}.tb-v145-source{margin-top:18px;padding:12px;border:1px solid rgba(91,120,255,.22);border-radius:11px;background:rgba(79,124,255,.055);color:#8e99ae;font-size:.72rem;line-height:1.5}.tb-v145-unknown{color:#788399;font-size:.85rem}.tb-v145-att{display:flex;flex-wrap:wrap;gap:8px}.tb-v145-att span{padding:8px 10px;border:1px solid #30394a;border-radius:10px;background:#0d121b;color:#cbd3e3;font-size:.78rem}.tb-v145-nav{position:fixed;top:50%;z-index:5;transform:translateY(-50%);width:50px;height:76px;border:1px solid #38445a;border-radius:15px;background:#0b1018;color:#6ea7ff;font-size:32px;cursor:pointer}.tb-v145-prev{left:16px}.tb-v145-next{right:16px}@media(max-width:980px){.tb-v145-wrap{grid-template-columns:1fr;padding:76px 22px 105px}.tb-v145-nav{display:none}.tb-v145-gun{height:180px}.tb-v145-stats{margin-bottom:10px}}@media(max-width:620px){.tb-v145-wrap{padding-left:14px;padding-right:14px}.tb-v145-close{right:13px;top:13px;width:45px;height:45px}.tb-v145-facts,.tb-v145-stats{grid-template-columns:1fr}.tb-v145-mapgrid{grid-template-columns:repeat(2,1fr)}.tb-v145 h2{font-size:3rem}}
  `;document.head.appendChild(s)}

  function ensure(){if(overlay)return overlay;style();overlay=document.createElement('div');overlay.className='tb-v145';overlay.innerHTML=`<button class="tb-v145-close">×</button><button class="tb-v145-nav tb-v145-prev">‹</button><button class="tb-v145-nav tb-v145-next">›</button><div class="tb-v145-wrap"><section class="tb-v145-left"></section><section class="tb-v145-right"></section></div>`;document.body.appendChild(overlay);overlay.querySelector('.tb-v145-close').onclick=close;overlay.querySelector('.tb-v145-prev').onclick=()=>move(-1);overlay.querySelector('.tb-v145-next').onclick=()=>move(1);return overlay}
  function close(){if(!overlay)return;overlay.classList.remove('open');document.documentElement.style.overflow=''}
  function rows(){return typeof DATA!=='undefined'?DATA.weapons:[]}
  function rowByName(name){return rows().find(r=>r[0]===name)||null}
  function imageFromCard(card){const im=card?.querySelector('.tb-card-visual img');return im?.currentSrc||im?.src||''}
  function move(d){const rs=rows();let i=rs.findIndex(r=>r[0]===currentName);if(i<0)return;i=(i+d+rs.length)%rs.length;render(rs[i],null)}
  function render(row,card){const p=W[row[0]]||{},o=ensure(),img=imageFromCard(card),sc=p.score,stats=['Sức mạnh','Tốc độ bắn','Tốc độ nạp','Phạm vi','Độ giật'];currentName=row[0];
    const facts=[['Loại đạn',row[2]],['Chế độ bắn',p.mode||row[3]],['Băng mặc định',p.mag==null?'Chưa xác minh':`${p.mag} viên`],['Nhóm',TYPE_VI[row[1]]||row[1]]];
    o.querySelector('.tb-v145-left').innerHTML=`<div class="tb-v145-crumb">Wiki › Vũ khí › <b>${esc(row[0])}</b></div><div class="tb-v145-type">${esc(TYPE_VI[row[1]]||row[1])}</div><h2>${esc(row[0])}</h2><div class="tb-v145-facts">${facts.map(x=>`<div class="tb-v145-fact"><small>${x[0]}</small><b>${esc(x[1])}</b></div>`).join('')}</div>${p.official?`<div class="tb-v145-note"><b>Thông tin đã đối chiếu:</b> ${esc(p.official)}</div>`:''}${p.pros||p.cons?`<div class="tb-v145-pros">${p.pros?`<p><span class="tb-v145-pro">Ưu điểm:</span> ${esc(p.pros)}</p>`:''}${p.cons?`<p><span class="tb-v145-con">Nhược điểm:</span> ${esc(p.cons)}</p>`:''}</div>`:''}<div class="tb-v145-gun">${img?`<img src="${esc(img)}" alt="${esc(row[0])}">`:''}</div>${sc?`<div class="tb-v145-score-title">Chỉ số Wiki tham khảo</div><div class="tb-v145-score-note">Chỉ hiện số đã có nguồn riêng; không dùng số mặc định theo nhóm súng.</div><div class="tb-v145-stats">${sc.map((v,i)=>v==null?'':`<div class="tb-v145-stat"><span>${stats[i]}</span><b>${v}/100</b><div class="tb-v145-track"><div class="tb-v145-fill" style="width:${Math.max(0,Math.min(100,v))}%"></div></div></div>`).join('')}</div>`:`<div class="tb-v145-score-title">Chỉ số Wiki tham khảo</div><div class="tb-v145-unknown">Chưa có bộ chỉ số đủ tin cậy cho khẩu này — không tự điền số.</div>`}`;
    const mapHtml=p.maps?.[0]==='Tất cả bản đồ Classic'?`<div class="tb-v145-note">Khả dụng: <b>Tất cả bản đồ Classic</b> theo điều chỉnh 4.4.</div>`:p.maps?`<div class="tb-v145-mapgrid">${ALLMAPS.map(m=>`<div class="tb-v145-map ${p.maps.includes(m)?'on':''}"><i>${p.maps.includes(m)?'✓':''}</i>${m}</div>`).join('')}</div>`:`<div class="tb-v145-unknown">Chưa xác minh đầy đủ danh sách bản đồ cho phiên bản hiện tại.</div>`;
    const att=p.att?.length?`<div class="tb-v145-att">${p.att.map(a=>`<span>${esc(a)}</span>`).join('')}</div>`:`<div class="tb-v145-unknown">Không tự gán bộ phụ kiện theo nhóm; chỉ hiện khi đã đối chiếu riêng.</div>`;
    o.querySelector('.tb-v145-right').innerHTML=`<div class="tb-v145-title">Bản đồ / nguồn xuất hiện</div>${mapHtml}${p.air===true?`<div class="tb-v145-note">✓ Có trạng thái <b>vũ khí thả dù</b> trong nguồn đã đối chiếu.</div>`:''}<div class="tb-v145-title">Phụ kiện / cấu hình đã đối chiếu</div>${att}<div class="tb-v145-source"><b>Nguồn dữ liệu:</b> ưu tiên PUBG MOBILE chính thức cho thay đổi phiên bản, loại đạn, chế độ, khả dụng và cơ chế. Các điểm 0–100 dùng nguồn Wiki tham khảo (BitTopup/MadTamizha) và được ghi rõ là chỉ số tham khảo. Khi nguồn mâu thuẫn, dữ liệu chính thức được ưu tiên; trường chưa đủ nguồn được để trống thay vì ước lượng.</div>`;
    o.classList.add('open');document.documentElement.style.overflow='hidden'}

  function patchCount(){document.querySelectorAll('#tbWikiTabs .tb-wiki-tab').forEach(b=>{if(b.textContent.includes('Phụ kiện')){const sm=b.querySelector('small');if(sm)sm.textContent='51'}})}
  function boot(){if(!patchData()){setTimeout(boot,70);return}patchCount();const tabs=document.getElementById('tbWikiTabs');if(tabs)new MutationObserver(patchCount).observe(tabs,{childList:true,subtree:true});
    window.addEventListener('click',e=>{const card=e.target.closest?.('#tbWikiGrid .tb-wiki-card');if(!card)return;const name=card.querySelector('h3')?.textContent.trim();const row=rowByName(name);if(!row)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();render(row,card)},true);
    document.addEventListener('keydown',e=>{if(!overlay?.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)});
  }
  boot();
})();