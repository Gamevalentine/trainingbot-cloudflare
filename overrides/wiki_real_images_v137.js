(()=>{
  const BASE='https://raw.githubusercontent.com/pubg/api-assets/master/';
  const A={
    'AKM':'Assets/Item/Weapon/Main/Item_Weapon_AK47_C_w.png',
    'M16A4':'Assets/Item/Weapon/Main/Item_Weapon_M16A4_C_w.png',
    'SCAR-L':'Assets/Item/Weapon/Main/Item_Weapon_SCAR-L_C_w.png',
    'M416':'Assets/Item/Weapon/Main/Item_Weapon_HK416_C_w.png',
    'GROZA':'Assets/Item/Weapon/Main/Item_Weapon_GROZA_C_w.png',
    'AUG':'Assets/Item/Weapon/Main/Item_Weapon_AUG_C_w.png',
    'QBZ':'Assets/Item/Weapon/Main/Item_Weapon_QBZ95_C_w.png',
    'M762':'Assets/Item/Weapon/Main/Item_Weapon_BerylM762_C_w.png',
    'Mk47 Mutant':'Assets/Item/Weapon/Main/Item_Weapon_Mk47Mutant_C_w.png',
    'G36C':'Assets/Item/Weapon/Main/Item_Weapon_G36C_C_w.png',
    'FAMAS':'Assets/Item/Weapon/Main/Item_Weapon_FAMASG2_C_w.png',
    'ACE32':'Assets/Item/Weapon/Main/Item_Weapon_ACE32_C_w.png',
    'Mini14':'Assets/Item/Weapon/Main/Item_Weapon_Mini14_C_w.png',
    'SKS':'Assets/Item/Weapon/Main/Item_Weapon_SKS_C_w.png',
    'SLR':'Assets/Item/Weapon/Main/Item_Weapon_FNFAL_C_w.png',
    'Mk14':'Assets/Item/Weapon/Main/Item_Weapon_Mk14_C_w.png',
    'QBU':'Assets/Item/Weapon/Main/Item_Weapon_QBU88_C_w.png',
    'Mk12':'Assets/Item/Weapon/Main/Item_Weapon_Mk12_C_w.png',
    'VSS':'Assets/Item/Weapon/Main/Item_Weapon_VSS_C_w.png',
    'Kar98k':'Assets/Item/Weapon/Main/Item_Weapon_Kar98k_C_w.png',
    'M24':'Assets/Item/Weapon/Main/Item_Weapon_M24_C_w.png',
    'AWM':'Assets/Item/Weapon/Main/Item_Weapon_AWM_C_w.png',
    'Win94':'Assets/Item/Weapon/Main/Item_Weapon_Win1894_C_w.png',
    'Mosin Nagant':'Assets/Item/Weapon/Main/Item_Weapon_Mosin_C_w.png',
    'AMR':'Assets/Item/Weapon/Main/Item_Weapon_L6_C_w.png',
    'UZI':'Assets/Item/Weapon/Main/Item_Weapon_UZI_C_w.png',
    'UMP45':'Assets/Item/Weapon/Main/Item_Weapon_UMP_C_w.png',
    'Vector':'Assets/Item/Weapon/Main/Item_Weapon_Vector_C_w.png',
    'Thompson SMG':'Assets/Item/Weapon/Main/Item_Weapon_Thompson_C_w.png',
    'PP-19 Bizon':'Assets/Item/Weapon/Main/Item_Weapon_BizonPP19_C_w.png',
    'MP5K':'Assets/Item/Weapon/Main/Item_Weapon_MP5K_C_w.png',
    'P90':'Assets/Item/Weapon/Main/Item_Weapon_P90_C_w.png',
    'S686':'Assets/Item/Weapon/Main/Item_Weapon_Berreta686_C_w.png',
    'S1897':'Assets/Item/Weapon/Main/Item_Weapon_Winchester_C_w.png',
    'S12K':'Assets/Item/Weapon/Main/Item_Weapon_Saiga12_C_w.png',
    'DBS':'Assets/Item/Weapon/Main/Item_Weapon_DP12_C_w.png',
    'M249':'Assets/Item/Weapon/Main/Item_Weapon_M249_C_w.png',
    'DP-28':'Assets/Item/Weapon/Main/Item_Weapon_DP28_C_w.png',
    'MG3':'Assets/Item/Weapon/Main/Item_Weapon_MG3_C_w.png',
    'P92':'Assets/Item/Weapon/Handgun/Item_Weapon_M9_C.png',
    'P1911':'Assets/Item/Weapon/Handgun/Item_Weapon_M1911_C.png',
    'R1895':'Assets/Item/Weapon/Handgun/Item_Weapon_NagantM1895_C.png',
    'P18C':'Assets/Item/Weapon/Handgun/Item_Weapon_G18_C.png',
    'R45':'Assets/Item/Weapon/Handgun/Item_Weapon_Rhino_C.png',
    'Súng cưa nòng':'Assets/Item/Weapon/Handgun/Item_Weapon_Sawnoff_C.png',
    'Skorpion':'Assets/Item/Weapon/Handgun/Item_Weapon_vz61Skorpion_C.png',
    'Desert Eagle':'Assets/Item/Weapon/Handgun/Item_Weapon_DesertEagle_C.png',
    'Nỏ':'Assets/Item/Weapon/Main/Item_Weapon_Crossbow_C_w.png',
    'Panzerfaust':'Assets/Item/Weapon/Main/Item_Weapon_PanzerFaust100M_C.png',
    'Súng pháo sáng':'Assets/Item/Weapon/Handgun/Item_Weapon_FlareGun_C.png',
    'M79':'Assets/Item/Weapon/Handgun/Item_Weapon_M79_C.png',

    'Tay cầm góc':'Assets/Item/Attachment/Item_Attach_Weapon_Lower_AngledForeGrip_C.png',
    'Tay cầm dọc':'Assets/Item/Attachment/Item_Attach_Weapon_Lower_Foregrip_C.png',
    'Tay cầm nhẹ':'Assets/Item/Attachment/Item_Attach_Weapon_Lower_LightweightForeGrip_C.png',
    'Tay cầm nửa':'Assets/Item/Attachment/Item_Attach_Weapon_Lower_HalfGrip_C.png',
    'Tay cầm ngón cái':'Assets/Item/Attachment/Item_Attach_Weapon_Lower_ThumbGrip_C.png',
    'Laser ngắm':'Assets/Item/Attachment/Item_Attach_Weapon_Lower_LaserPointer_C.png',
    'Nòng thu hẹp (Súng săn)':'Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_Choke_C.png',
    'Nòng bù giật (Súng tiểu liên)':'Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_Compensator_Medium_C.png',
    'Nòng bù giật (Súng bắn tỉa)':'Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_Compensator_SniperRifle_C.png',
    'Nòng bù giật (Súng trường)':'Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_Compensator_Large_C.png',
    'Nòng giảm chớp (Súng tiểu liên)':'Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_FlashHider_Medium_C.png',
    'Nòng giảm chớp (Súng bắn tỉa)':'Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_FlashHider_SniperRifle_C.png',
    'Nòng giảm chớp (Súng trường)':'Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_FlashHider_Large_C.png',
    'Nòng giảm thanh (Súng bắn tỉa)':'Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_Suppressor_SniperRifle_C.png',
    'Nòng giảm thanh (Súng trường)':'Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_Suppressor_Large_C.png',
    'Mỏ vịt (Súng săn)':'Assets/Item/Attachment/Item_Attach_Weapon_Muzzle_Duckbill_C.png',
    'Ống ngắm chấm đỏ':'Assets/Item/Attachment/Item_Attach_Weapon_Upper_DotSight_01_C.png',
    'Ống ngắm Holo':'Assets/Item/Attachment/Item_Attach_Weapon_Upper_Holosight_C.png',
    'Ống ngắm 3x':'Assets/Item/Attachment/Item_Attach_Weapon_Upper_Scope3x_C.png',
    'Ống ngắm 6x':'Assets/Item/Attachment/Item_Attach_Weapon_Upper_Scope6x_C.png',
    'Ống ngắm nghiêng':'Assets/Item/Attachment/Item_Attach_Weapon_SideRail_DotSight_RMR_C.png',
    'Băng đạn mở rộng (Súng trường)':'Assets/Item/Attachment/Item_Attach_Weapon_Magazine_Extended_Large_C.png',
    'Băng đạn thay nhanh (Súng trường)':'Assets/Item/Attachment/Item_Attach_Weapon_Magazine_QuickDraw_Large_C.png',
    'Băng đạn mở rộng thay nhanh (Súng trường)':'Assets/Item/Attachment/Item_Attach_Weapon_Magazine_ExtendedQuickDraw_Large_C.png',
    'Băng đạn mở rộng (Súng bắn tỉa)':'Assets/Item/Attachment/Item_Attach_Weapon_Magazine_Extended_SniperRifle_C.png',
    'Băng đạn thay nhanh (Súng bắn tỉa)':'Assets/Item/Attachment/Item_Attach_Weapon_Magazine_QuickDraw_SniperRifle_C.png',
    'Băng đạn mở rộng thay nhanh (Súng bắn tỉa)':'Assets/Item/Attachment/Item_Attach_Weapon_Magazine_ExtendedQuickDraw_SniperRifle_C.png',
    'Băng trống mini (Súng trường)':'Assets/Item/Attachment/Item_Attach_Weapon_Magazine_Extended_DrumMagazine.png',
    'Báng súng (Micro UZI)':'Assets/Item/Attachment/Item_Attach_Weapon_Stock_UZI_C.png',
    'Báng súng chiến thuật (Súng trường, Tiểu liên)':'Assets/Item/Attachment/Item_Attach_Weapon_Stock_AR_Composite_C.png',
    'Đệm má (Súng bắn tỉa)':'Assets/Item/Attachment/Item_Attach_Weapon_Stock_SniperRifle_CheekPad_C.png',
    'Dây đạn (Súng săn, Bắn tỉa)':'Assets/Item/Attachment/Item_Attach_Weapon_Stock_Shotgun_BulletLoops_C.png',

    'UAZ':'Assets/Vehicle/Uaz_A_00_C.png',
    'UAZ kín':'Assets/Vehicle/Uaz_B_00_C.png',
    'Dacia 1300':'Assets/Vehicle/Dacia_A_00_v2_C.png',
    'Xe Buggy':'Assets/Vehicle/Buggy_A_00_C.png',
    'Xe mô tô':'Assets/Vehicle/BP_Motorbike_00_C.png',
    'Xe mô tô có thùng bên':'Assets/Vehicle/BP_Motorbike_00_SideCar_C.png',
    'Mirado':'Assets/Vehicle/BP_Mirado_A_00_C.png',
    'Mirado mui trần':'Assets/Vehicle/BP_Mirado_Open_00_C.png',
    'Xe bán tải':'Assets/Vehicle/BP_PickupTruck_A_00_C.png',
    'Xe bán tải kín':'Assets/Vehicle/BP_PickupTruck_B_00_C.png',
    'Xe tải nhỏ':'Assets/Vehicle/BP_Van_A_00_C.png',
    'Rony':'Assets/Vehicle/BP_M_Rony_A_00_C.png',
    'Xe tay ga':'Assets/Vehicle/BP_Scooter_00_A_C.png',
    'Tukshai':'Assets/Vehicle/BP_TukTukTuk_A_00_C.png',
    'Xe trượt tuyết':'Assets/Vehicle/BP_Snowmobile_00_C.png',
    'Xe máy tuyết':'Assets/Vehicle/BP_Snowbike_00_C.png',
    'Coupe RB':'Assets/Vehicle/BP_CoupeRB_C.png',
    'Tàu lượn có động cơ':'Assets/Vehicle/BP_Motorglider_C.png',
    'BRDM-2':'Assets/Vehicle/BP_BRDM_C.png',
    'Aquarail':'Assets/Vehicle/AquaRail_A_00_C.png',
    'PG-117':'Assets/Vehicle/Boat_PG117_C.png',
    'Quad':'Assets/Vehicle/BP_ATV_C.png',

    'Erangel':{path:'Assets/MapSelection/Erangel.png',kind:'map'},
    'Miramar':{path:'Assets/MapSelection/Miramar.png',kind:'map'},
    'Sanhok':{path:'Assets/MapSelection/Sanhok.png',kind:'map'},
    'Vikendi':{path:'Assets/MapSelection/Vikendi.png',kind:'map'},
    'Karakin':{path:'Assets/MapSelection/Karakin.jpg',kind:'map'}
  };

  const failed=new Set();
  const assetFor=name=>{
    const value=A[name];
    if(!value)return null;
    return typeof value==='string'?{path:value,kind:'item'}:value;
  };
  const coloredWeaponPath=path=>path.includes('/Weapon/Main/')&&path.endsWith('_w.png')?path.slice(0,-6)+'.png':path;

  function start(){
    const grid=document.getElementById('tbWikiGrid');
    if(!grid){setTimeout(start,80);return;}

    const apply=()=>{
      grid.querySelectorAll('.tb-wiki-card').forEach((card,index)=>{
        const title=card.querySelector('h3');
        const visual=card.querySelector('.tb-card-visual');
        if(!title||!visual)return;
        const name=title.textContent.trim();
        const asset=assetFor(name);
        if(!asset||failed.has(asset.path)||visual.dataset.realImage===asset.path)return;

        const fallback=visual.innerHTML;
        visual.dataset.realImage=asset.path;
        visual.classList.add('tb-real-image');
        card.classList.toggle('tb-real-map-card',asset.kind==='map');

        const img=document.createElement('img');
        img.className='tb-real-item-image';
        img.alt=name;
        img.decoding='async';
        if(index<5){img.loading='eager';img.fetchPriority='high';}
        else{img.loading='lazy';img.fetchPriority='low';}

        const primaryPath=coloredWeaponPath(asset.path);
        const fallbackUrl=BASE+asset.path;
        let triedFallback=primaryPath===asset.path;
        img.onerror=()=>{
          if(!triedFallback){
            triedFallback=true;
            img.src=fallbackUrl;
            return;
          }
          failed.add(asset.path);
          delete visual.dataset.realImage;
          visual.classList.remove('tb-real-image');
          card.classList.remove('tb-real-map-card');
          visual.innerHTML=fallback;
        };
        img.src=BASE+primaryPath;
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
