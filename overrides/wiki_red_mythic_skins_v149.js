(()=>{
  const SKINS=[
    {
      name:'The Fool - M416',weapon:'M416',quality:'Mythic ở dạng tối đa',level:'Lv.7',
      source:'Anniversary Crate / The Fool',
      effect:'Skin nâng cấp; có hiệu ứng trúng đạn và animation chuyển súng ở lần trở lại năm 2026.',
      image:'https://i.ytimg.com/vi/Lqx0cuZxy_4/hqdefault.jpg',
      note:'PUBG MOBILE xác nhận The Fool - M416 là firearm nâng cấp. Nguồn đối chiếu độc lập xác nhận phẩm chất chuyển thành Mythic ở dạng nâng cấp tối đa.'
    },
    {
      name:'PMGC 2021 Prestige - SCAR-L',weapon:'SCAR-L',quality:'Mythic',level:'Không cần Gun Lab',
      source:'PMGC 2021 Premium Crate',
      effect:'Có hiệu ứng laser / on-hit đặc trưng.',
      image:'https://i.ytimg.com/vi/qOiaZbjhGTE/hqdefault.jpg',
      note:'PUBG MOBILE và PUBG MOBILE Esports xác nhận skin PMGC 2021 Prestige - SCAR-L; nguồn đối chiếu thứ cấp xác nhận đây là Mythic weapon skin.'
    },
    {
      name:'Ryomen Sukuna - Groza',weapon:'GROZA',quality:'Mythic',level:'Lv.7',
      source:'Jujutsu Kaisen Collaboration',
      effect:'Skin nâng cấp với các mốc hiệu ứng và hình thái theo cấp.',
      image:'https://i.ytimg.com/vi/aU55WMyVojM/hqdefault.jpg',
      note:'Đã đối chiếu với nội dung cộng đồng PUBG MOBILE có độ tin cậy cao; chỉ giữ thông tin phẩm chất Mythic và cấp tối đa đã được thể hiện rõ.'
    }
  ];

  const FILTERS=['Tất cả','M416','SCAR-L','GROZA'];
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
      .tb-v149-card .tb-card-visual{padding:0!important;background:#14090d!important;border-color:rgba(255,72,92,.28)!important}
      .tb-v149-card .tb-card-visual img{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:cover!important;border-radius:12px!important}
      .tb-v149-card .tb-card-tag{background:#7c1020!important;color:#ffd9de!important;border-color:rgba(255,105,120,.35)!important}
      .tb-v149-source{margin-top:5px;font-size:.72rem;color:#9da7b8;text-align:center;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
      .tb-v149-note{margin:0 0 16px;padding:11px 13px;border:1px solid rgba(255,72,92,.22);border-radius:12px;background:rgba(124,16,32,.08);color:#aeb7c8;font-size:.76rem;line-height:1.55}
      .tb-v149-detail-hero{display:grid;grid-template-columns:minmax(180px,.8fr) minmax(0,1.2fr);gap:16px;align-items:center;margin-bottom:14px}
      .tb-v149-detail-image{min-height:170px;border:1px solid rgba(255,72,92,.18);border-radius:14px;background:#0c0d12;overflow:hidden}
      .tb-v149-detail-image img{display:block;width:100%;height:170px;object-fit:cover}
      .tb-v149-detail-copy{color:#aeb7c8;line-height:1.65}.tb-v149-detail-copy b{color:#fff}
      .tb-v149-detail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .tb-v149-item{padding:14px;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:#101622}
      .tb-v149-item small{display:block;color:#7f8ca5;font-size:.67rem;font-weight:900;text-transform:uppercase;letter-spacing:.07em}
      .tb-v149-item b{display:block;margin-top:5px;color:#f5f7ff}
      .tb-v149-quality{color:#ff6b7d!important}
      @media(max-width:620px){.tb-v149-detail,.tb-v149-detail-hero{grid-template-columns:1fr}.tb-v149-detail-image,.tb-v149-detail-image img{min-height:140px;height:140px}}
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
    const {tabs}=nodes();if(!tabs)return;
    let btn=tabs.querySelector('.tb-v149-tab');
    if(btn){
      btn.querySelector('span').textContent='Skin súng đỏ';
      btn.querySelector('small').textContent=String(SKINS.length);
      return;
    }
    btn=document.createElement('button');
    btn.type='button';btn.className='tb-wiki-tab tb-v149-tab';btn.dataset.tab='red-gun-skins';
    btn.innerHTML='<svg viewBox="0 0 24 24"><path d="M3 13h10l3-3h5v4h-4l-3 3H9l-2 3H4l1-5H3Z"/></svg><span>Skin súng đỏ</span><small>'+SKINS.length+'</small>';
    btn.addEventListener('click',()=>{skinMode=true;filter='Tất cả';query='';renderSkin();});
    tabs.appendChild(btn);
  }

  function renderSkin(){
    const n=nodes();if(!n.tabs||!n.filters||!n.grid)return;
    style();ensureTab();skinMode=true;
    n.tabs.querySelectorAll('.tb-wiki-tab').forEach(b=>b.classList.toggle('active',b.classList.contains('tb-v149-tab')));
    n.title.textContent='Skin súng phẩm chất đỏ';
    n.subtitle.textContent='Ưu tiên skin súng Mythic đã đối chiếu. Chưa đưa trang phục, skin xe hoặc vật phẩm phẩm chất khác vào mục này.';
    n.search.placeholder='Tìm The Fool, PMGC SCAR-L, Sukuna...';
    n.search.value=query;
    if(n.compare)n.compare.style.display='none';
    n.filters.innerHTML=FILTERS.map(x=>`<button class="tb-wiki-filter ${x===filter?'active':''}" type="button" data-v149-filter="${esc(x)}">${esc(x)}</button>`).join('');
    n.filters.querySelectorAll('[data-v149-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.v149Filter;renderSkin();}));
    const rows=SKINS.filter(s=>(filter==='Tất cả'||s.weapon===filter)&&(!query||norm(`${s.name} ${s.weapon} ${s.source} ${s.quality}`).includes(norm(query))));
    n.grid.innerHTML=rows.length?rows.map(s=>`<article class="tb-wiki-card tb-v149-card" data-v149-index="${SKINS.indexOf(s)}" tabindex="0" role="button" aria-label="Xem ${esc(s.name)}"><span class="tb-card-tag">MYTHIC</span><div class="tb-card-visual"><img src="${esc(s.image)}" alt="${esc(s.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div><h3>${esc(s.name)}</h3><p>${esc(s.weapon)} · ${esc(s.quality)}</p><div class="tb-v149-source">${esc(s.source)}</div></article>`).join(''):'<div class="tb-wiki-empty">Không tìm thấy skin súng Mythic phù hợp.</div>';
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
    body.innerHTML=`<div class="tb-v149-detail-hero"><div class="tb-v149-detail-image"><img src="${esc(s.image)}" alt="${esc(s.name)}" loading="eager" decoding="async" referrerpolicy="no-referrer"></div><div class="tb-v149-detail-copy"><b>${esc(s.weapon)}</b><br>${esc(s.effect)}</div></div><div class="tb-v149-note"><b>Trạng thái xác minh:</b> ${esc(s.note)}</div><div class="tb-v149-detail"><div class="tb-v149-item"><small>Phẩm chất</small><b class="tb-v149-quality">${esc(s.quality)}</b></div><div class="tb-v149-item"><small>Vũ khí</small><b>${esc(s.weapon)}</b></div><div class="tb-v149-item"><small>Cấp / trạng thái</small><b>${esc(s.level)}</b></div><div class="tb-v149-item"><small>Nguồn gốc</small><b>${esc(s.source)}</b></div></div>`;
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