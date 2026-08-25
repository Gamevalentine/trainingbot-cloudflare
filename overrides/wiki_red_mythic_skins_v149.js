(()=>{
  const SKINS=[
    ['Viper Assassin Set','Mythic Forge','Mythic Forge'],
    ['Star Guardian','Mythic Forge','Mythic Forge'],
    ['Space Mascot Set','Mythic Forge','Mythic Forge'],
    ['Rhythm Rider Set','Mythic Forge','Mythic Forge Deal'],
    ['Armed Hound Set','Mythic Forge','Mythic Forge Deal'],
    ['Golden Splendor Set','Mythic Forge','Mythic Forge Deal'],
    ['Dream Idol Set','Mythic Forge','Mythic Forge Deal'],
    ['Snow Vanguard Set','Mythic Forge','Mythic Forge Deal'],
    ['Ghillie Lion Set','Mythic Forge','Mythic Forge Deal'],
    ['Jester Set','Mythic Forge','Mythic Forge Deal'],
    ['Fright Night Outfit','Mythic Forge','Mythic Forge Deal'],
    ['Furnance Man Set','Mythic Forge','Mythic Forge Deal'],
    ['Charged Armor Set','Mythic Forge','Mythic Forge Deal'],
    ['Eerie Doll Set','Mythic Forge','Mythic Forge Deal'],
    ['Dark Assassin Set','Mythic Forge','Mythic Forge Deal'],
    ['Cherry Blossom Set','Mythic Forge','Mythic Forge Deal'],
    ['Bunny Set','Mythic Forge','Mythic Forge Deal'],
    ['Cute Baddie Set','Mythic Forge','Mythic Forge Deal'],
    ['Dystopian Survivor Set','Mythic Forge','Mythic Forge Deal'],
    ['Mech Rabbit Set','Mythic Forge','Mythic Forge Deal'],
    ['Glacier Set','Mythic Forge','Mythic Forge Deal'],
    ['Extreme Punk Set','Mythic Forge','Mythic Forge Deal'],
    ['Arachnoid Set','Mythic Forge','Mythic Forge Deal'],
    ['Invader Set','Mythic Forge','Mythic Forge Deal'],
    ['Armed Maid Suit','Mythic Forge','Mythic Forge Deal'],
    ['Black Shark Diving Suit','Mythic Forge','Mythic Forge Deal'],
    ['Rock Star Set','Mythic Forge','Mythic Forge Deal'],
    ['Space Guardian Suit','Mythic Forge','Mythic Forge Deal'],
    ['Sleek Agent Set','Mythic Forge','Mythic Forge Deal'],
    ['Gunslinger Set','Mythic Forge','Mythic Forge Deal'],
    ['Smooth Hitman Set (Cat)','Mythic Forge','Mythic Forge Deal'],
    ['Sea Serpent Set','Mythic Forge','Mythic Forge Deal'],
    ['Rising Star','Sự kiện PUBG MOBILE','Trendy Power'],
    ['Project Idol','Sự kiện PUBG MOBILE','Trendy Power'],
    ['Neon Wave','Sự kiện PUBG MOBILE','Trendy Power'],
    ['Holo Rave','Sự kiện PUBG MOBILE','Trendy Power'],
    ['RAMI Outfit Set','Collab BABYMONSTER','Lucky Spin'],
    ['RORA Outfit Set','Collab BABYMONSTER','Lucky Spin'],
    ['ASA Outfit Set','Collab BABYMONSTER','Lucky Spin'],
    ['CHIQUITA Outfit Set','Collab BABYMONSTER','Lucky Spin'],
    ['PHARITA Outfit Set','Collab BABYMONSTER','Lucky Spin'],
    ['RUKA Outfit Set','Collab BABYMONSTER','Lucky Spin'],
    ['AHYEON Outfit Set','Collab BABYMONSTER','Lucky Spin']
  ].map(([name,group,source])=>({name,group,source,quality:'Mythic',type:'Trang phục'}));

  const FILTERS=['Tất cả','Mythic Forge','Sự kiện PUBG MOBILE','Collab BABYMONSTER'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  let skinMode=false,filter='Tất cả',query='';

  function style(){
    if(document.getElementById('tb-v149-style'))return;
    const s=document.createElement('style');
    s.id='tb-v149-style';
    s.textContent=`
      #tbWikiTabs .tb-v149-tab{position:relative}
      #tbWikiTabs .tb-v149-tab svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8}
      .tb-v149-card{border-color:rgba(255,72,92,.25)!important}
      .tb-v149-card .tb-card-visual{background:linear-gradient(145deg,#351019,#17090d)!important;border-color:rgba(255,72,92,.28)!important}
      .tb-v149-emblem{width:72px;height:72px;border-radius:18px;display:grid;place-items:center;border:1px solid rgba(255,93,109,.42);background:radial-gradient(circle at 35% 25%,rgba(255,104,119,.32),rgba(118,16,31,.24) 45%,rgba(30,8,12,.82));color:#ffb2bb;font:900 1.35rem/1 Inter,sans-serif;letter-spacing:.08em;box-shadow:inset 0 0 24px rgba(255,52,78,.08)}
      .tb-v149-card .tb-card-tag{background:#7c1020!important;color:#ffd9de!important;border-color:rgba(255,105,120,.35)!important}
      .tb-v149-source{margin-top:5px;font-size:.72rem;color:#9da7b8;text-align:center;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
      .tb-v149-note{margin:0 0 16px;padding:11px 13px;border:1px solid rgba(255,72,92,.22);border-radius:12px;background:rgba(124,16,32,.08);color:#aeb7c8;font-size:.76rem;line-height:1.55}
      .tb-v149-detail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .tb-v149-item{padding:14px;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:#101622}
      .tb-v149-item small{display:block;color:#7f8ca5;font-size:.67rem;font-weight:900;text-transform:uppercase;letter-spacing:.07em}
      .tb-v149-item b{display:block;margin-top:5px;color:#f5f7ff}
      .tb-v149-quality{color:#ff6b7d!important}
      @media(max-width:620px){.tb-v149-detail{grid-template-columns:1fr}.tb-v149-emblem{width:58px;height:58px;border-radius:15px;font-size:1.1rem}}
    `;
    document.head.appendChild(s);
  }

  function nodes(){
    return {
      tabs:document.getElementById('tbWikiTabs'),filters:document.getElementById('tbWikiFilters'),grid:document.getElementById('tbWikiGrid'),
      title:document.getElementById('tbWikiTitle'),subtitle:document.getElementById('tbWikiSubtitle'),search:document.getElementById('tbWikiSearch'),compare:document.getElementById('tbCompareBtn')
    };
  }

  function ensureTab(){
    const {tabs}=nodes();if(!tabs||tabs.querySelector('.tb-v149-tab'))return;
    const btn=document.createElement('button');
    btn.type='button';btn.className='tb-wiki-tab tb-v149-tab';btn.dataset.tab='red-skins';
    btn.innerHTML='<svg viewBox="0 0 24 24"><path d="M7 4h10l2 4-2 12H7L5 8l2-4Z"/><path d="M9 4v4h6V4"/></svg><span>Skin đỏ</span><small>'+SKINS.length+'</small>';
    btn.addEventListener('click',()=>{skinMode=true;filter='Tất cả';query='';renderSkin();});
    tabs.appendChild(btn);
  }

  function renderSkin(){
    const n=nodes();if(!n.tabs||!n.filters||!n.grid)return;
    style();ensureTab();skinMode=true;
    n.tabs.querySelectorAll('.tb-wiki-tab').forEach(b=>b.classList.toggle('active',b.classList.contains('tb-v149-tab')));
    n.title.textContent='Skin phẩm chất đỏ';
    n.subtitle.textContent='Chỉ hiển thị trang phục Mythic (phẩm chất đỏ). Không đưa Ultimate, Legendary, Epic hoặc vật phẩm chưa xác minh phẩm chất vào danh sách.';
    n.search.placeholder='Tìm skin Mythic...';
    n.search.value=query;
    if(n.compare)n.compare.style.display='none';
    n.filters.innerHTML=FILTERS.map(x=>`<button class="tb-wiki-filter ${x===filter?'active':''}" type="button" data-v149-filter="${esc(x)}">${esc(x)}</button>`).join('');
    n.filters.querySelectorAll('[data-v149-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.v149Filter;renderSkin();}));
    const rows=SKINS.filter(s=>(filter==='Tất cả'||s.group===filter)&&(!query||norm(`${s.name} ${s.group} ${s.source}`).includes(norm(query))));
    n.grid.innerHTML=rows.length?rows.map((s,i)=>`<article class="tb-wiki-card tb-v149-card" data-v149-index="${SKINS.indexOf(s)}" tabindex="0" role="button" aria-label="Xem ${esc(s.name)}"><span class="tb-card-tag">MYTHIC</span><div class="tb-card-visual"><div class="tb-v149-emblem">M</div></div><h3>${esc(s.name)}</h3><p>Phẩm chất đỏ · Mythic</p><div class="tb-v149-source">${esc(s.source)}</div></article>`).join(''):'<div class="tb-wiki-empty">Không tìm thấy skin Mythic phù hợp.</div>';
    n.grid.querySelectorAll('[data-v149-index]').forEach(card=>{
      const open=()=>openDetail(SKINS[Number(card.dataset.v149Index)]);
      card.addEventListener('click',open);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
  }

  function openDetail(s){
    if(!s)return;
    const modal=document.getElementById('tbWikiModal'),body=document.getElementById('tbWikiModalBody'),title=document.getElementById('tbWikiModalTitle');
    if(!modal||!body||!title)return;
    title.textContent=s.name;
    body.innerHTML=`<div class="tb-v149-note"><b>Phạm vi Wiki:</b> mục Skin hiện chỉ lưu vật phẩm đã đối chiếu là <b>Mythic / phẩm chất đỏ</b>. Không tự suy đoán giá, tỉ lệ quay hay thời điểm quay lại.</div><div class="tb-v149-detail"><div class="tb-v149-item"><small>Phẩm chất</small><b class="tb-v149-quality">Mythic · Đỏ</b></div><div class="tb-v149-item"><small>Loại</small><b>${esc(s.type)}</b></div><div class="tb-v149-item"><small>Nhóm nguồn</small><b>${esc(s.group)}</b></div><div class="tb-v149-item"><small>Nguồn / cách sở hữu gốc</small><b>${esc(s.source)}</b></div></div>`;
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  }

  function bindSearch(){
    const n=nodes();if(!n.search||n.search.dataset.v149Bound)return;
    n.search.dataset.v149Bound='1';
    n.search.addEventListener('input',e=>{
      if(!skinMode)return;
      e.stopImmediatePropagation();query=n.search.value;renderSkin();
    },true);
  }

  function watchTabs(){
    const n=nodes();if(!n.tabs){setTimeout(boot,70);return;}
    ensureTab();bindSearch();
    n.tabs.addEventListener('click',e=>{
      const b=e.target.closest('.tb-wiki-tab');
      if(!b||b.classList.contains('tb-v149-tab'))return;
      skinMode=false;
      if(n.compare)n.compare.style.display='';
    },true);
    let queued=false;
    const obs=new MutationObserver(()=>{
      if(queued)return;queued=true;
      requestAnimationFrame(()=>{queued=false;ensureTab();bindSearch();if(skinMode)renderSkin();});
    });
    obs.observe(n.tabs,{childList:true});
  }

  function boot(){style();watchTabs();}
  boot();
})();