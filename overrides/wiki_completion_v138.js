(()=>{
  if(typeof DATA==='undefined')return;

  const RAW='https://raw.githubusercontent.com/pubg/api-assets/master/';
  const EXTRA={
    'Honey Badger':'https://www.pubgmobile.com/images/event/long_cache_30d/240Devnotes/weapons_big1.png',
    'ASM Abakan':'https://www.pubgmobile.com/images/event/Official-Transformers-Collaboration/s3_weapon1.png',
    'JS9':'https://pbs.twimg.com/media/HH7-HGEa4AAIKda.jpg',
    'M1014':'https://image.idn.media/post/20211210/img-20211210-221223-75518cf7651a87340b376c775dc61640-6b82ebfdce30aeed17ff1d0922541320.jpg',
    'NS2000':'https://www.pubgmobile.com/images/event/long_cache_30d/Devnotes2/weapons4.png?v=2.2',

    'Nòng giảm thanh (Súng tiểu liên, Súng ngắn)':RAW+'Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_Suppressor_Small_C.png',
    'Nòng kéo dài (Súng tiểu liên)':'https://www.pubgmobile.com/images/event/Official-Transformers-Collaboration/s3_weapon3.png',
    'Nòng kéo dài (Súng trường, Bắn tỉa)':'https://www.pubgmobile.com/images/event/Official-Transformers-Collaboration/s3_weapon3.png',
    'Phanh mõm (Súng bắn tỉa)':'https://www.pubgmobile.com/images/event/missionignition/s4_slide5.png',
    'Phanh mõm (Súng trường)':'https://www.pubgmobile.com/images/event/missionignition/s4_slide5.png',
    'Phanh mõm (Súng tiểu liên)':'https://www.pubgmobile.com/images/event/missionignition/s4_slide5.png',
    'Tay cầm công thái học':'https://www.pubgmobile.com/images/event/missionignition/s4_slide3.png',
    'Bao tên (Nỏ)':RAW+'Assets/Item/Attachment/Item_Attach_Weapon_Lower_QuickDraw_Large_Crossbow_C.png',
    'Ống ngắm 2x':RAW+'Assets/Item/Attachment/Item_Attach_Weapon_Upper_Aimpoint_C.png',
    'Ống ngắm 4x':RAW+'Assets/Item/Attachment/Item_Attach_Weapon_Upper_ACOG_01_C.png',
    'Ống ngắm 8x':RAW+'Assets/Item/Attachment/Item_Attach_Weapon_Upper_PM2_01_C.png',
    'Băng đạn mở rộng (Súng tiểu liên, Súng ngắn)':RAW+'Assets/Item/Attachment/Item_Attach_Weapon_Magazine_Extended_Small_C.png',
    'Băng đạn thay nhanh (Súng tiểu liên, Súng ngắn)':RAW+'Assets/Item/Attachment/Item_Attach_Weapon_Magazine_QuickDraw_Small_C.png',
    'Băng đạn mở rộng thay nhanh (Súng tiểu liên, Súng ngắn)':RAW+'Assets/Item/Attachment/Item_Attach_Weapon_Magazine_ExtendedQuickDraw_Small_C.png',

    'Zima UAZ':'https://static-cdn.manabuy.com/blog_20260626/pubg-mobile-vehicles-rotation-guide/zima-uaz.webp',
    'Xe tải quái vật':'https://static-cdn.manabuy.com/blog_20260626/pubg-mobile-vehicles-rotation-guide/monster-truck.webp',
    'UTV':'https://static-cdn.manabuy.com/blog_20260626/pubg-mobile-vehicles-rotation-guide/utv-utility-task-vehicle.webp',
    'Xe đạp địa hình':'https://wstatic-prod-boc.krafton.com/pubg-legacy/sites/6/2021/11/PUBG_BG_2_Mountain_Bike_16x9-1024x576.jpg',

    'Livik':{url:'https://cdn.topuplive.com/uploads/images/goods/20250503/1746210757_YJL1OdzVYy.jpg',map:true},
    'Nusa':{url:'https://cdn-www.bluestacks.com/bs-images/pubg-mobile-parachuting-spots-guide-in-nusa-map-vi-5.jpeg',map:true},
    'Rondo':{url:'https://liquipedia.net/commons/images/thumb/0/04/PUBG_Rondo_2023_Map.jpg/1200px-PUBG_Rondo_2023_Map.jpg',map:true}
  };

  const SPEED={
    'UAZ':131,
    'UAZ kín':131,
    'Dacia 1300':133,
    'Xe Buggy':120,
    'Xe mô tô':151,
    'Xe mô tô có thùng bên':110,
    'Mirado':163,
    'Mirado mui trần':163,
    'Xe bán tải':115,
    'Xe bán tải kín':115,
    'Xe tải nhỏ':116,
    'Rony':106,
    'Xe tay ga':90,
    'Tukshai':73,
    'Xe trượt tuyết':105,
    'Xe máy tuyết':134,
    'Zima UAZ':110,
    'Coupe RB':150,
    'Tàu lượn có động cơ':110,
    'BRDM-2':104,
    'Aquarail':84,
    'PG-117':95,
    'Xe tải quái vật':104,
    'UTV':115,
    'Quad':110,
    'Xe đạp địa hình':62
  };

  if(!document.getElementById('tb-wiki-v138-style')){
    const style=document.createElement('style');
    style.id='tb-wiki-v138-style';
    style.textContent=`
      .tb-vehicle-speed{margin-top:5px;font-size:.78rem;font-weight:800;line-height:1.2;color:#aeb7c7}
      .tb-wiki-card.tb-completion-map .tb-card-visual{border-radius:12px;overflow:hidden}
      .tb-wiki-card.tb-completion-map .tb-real-item-image{width:100%;max-width:100%;height:112px;max-height:none;object-fit:cover;filter:none}
      @media(max-width:700px){.tb-wiki-card.tb-completion-map .tb-real-item-image{height:88px}}
    `;
    document.head.append(style);
  }

  const failed=new Set();
  const getAsset=name=>{
    const value=EXTRA[name];
    if(!value)return null;
    return typeof value==='string'?{url:value,map:false}:value;
  };

  function start(){
    const grid=document.getElementById('tbWikiGrid');
    if(!grid){setTimeout(start,80);return;}

    const apply=()=>{
      grid.querySelectorAll('.tb-wiki-card').forEach(card=>{
        const title=card.querySelector('h3');
        if(!title)return;
        const name=title.textContent.trim();

        if(Object.prototype.hasOwnProperty.call(SPEED,name)){
          let speed=card.querySelector('.tb-vehicle-speed');
          if(!speed){
            speed=document.createElement('div');
            speed.className='tb-vehicle-speed';
            const sub=card.querySelector('p');
            if(sub)sub.insertAdjacentElement('afterend',speed);
            else card.append(speed);
          }
          speed.textContent=`Tốc độ tối đa: ${SPEED[name]} km/h`;
        }

        const asset=getAsset(name);
        const visual=card.querySelector('.tb-card-visual');
        if(!asset||!visual||failed.has(asset.url)||visual.querySelector('.tb-real-item-image')||visual.dataset.completionImage===asset.url)return;

        const fallback=visual.innerHTML;
        visual.dataset.completionImage=asset.url;
        visual.classList.add('tb-real-image');
        card.classList.toggle('tb-completion-map',!!asset.map);

        const img=document.createElement('img');
        img.className='tb-real-item-image';
        img.alt=name;
        img.loading='lazy';
        img.decoding='async';
        img.referrerPolicy='no-referrer';
        img.src=asset.url;
        img.onerror=()=>{
          failed.add(asset.url);
          delete visual.dataset.completionImage;
          visual.classList.remove('tb-real-image');
          card.classList.remove('tb-completion-map');
          visual.innerHTML=fallback;
        };
        visual.replaceChildren(img);
      });
    };

    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;apply();});
    });
    observer.observe(grid,{childList:true,subtree:true});
    apply();
  }

  start();
})();
