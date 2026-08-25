(()=>{
  const RED_SOURCE='https://www.pubgmobile.jp/news_20221122/';
  const SKINS=[
    {brand:'McLaren',model:'570S',variant:'Zenith Black',collab:'PUBG MOBILE × McLaren',source:'https://www.pubgmobile.com/webplat/info/news_version3/35372/60662/60663/60724/60725/60728/m22521/202106/891185.shtml'},
    {brand:'McLaren',model:'570S',variant:'Lunar White',collab:'PUBG MOBILE × McLaren',source:'https://www.pubgmobile.com/webplat/info/news_version3/35372/60662/60663/60724/60725/60728/m22521/202106/891185.shtml'},
    {brand:'Tesla',model:'Roadster',variant:'Diamond',collab:'PUBG MOBILE × Tesla',source:'https://www.pubgmobile.com/en/event/tesla/'},
    {brand:'Tesla',model:'Cybertruck',variant:'Splendid-Silver',collab:'PUBG MOBILE × Tesla',source:'https://www.pubgmobile.com/en/event/tesla/'},
    {brand:'Koenigsegg',model:'Gemera',variant:'Silver Grey',collab:'PUBG MOBILE × Koenigsegg',source:'https://www.pubgmobile.com/webplat/info/news_version3/35372/60662/60663/60724/60725/60728/m22521/202111/904231.shtml'},
    {brand:'Koenigsegg',model:'Gemera',variant:'Dawn',collab:'PUBG MOBILE × Koenigsegg',source:'https://www.pubgmobile.com/webplat/info/news_version3/35372/60662/60663/60724/60725/60728/m22521/202111/904231.shtml'},
    {brand:'Koenigsegg',model:'Jesko',variant:'Silver Grey',collab:'PUBG MOBILE × Koenigsegg',source:'https://www.pubgmobile.com/webplat/info/news_version3/35372/60662/60663/60724/60725/60728/m22521/202111/904231.shtml'},
    {brand:'Koenigsegg',model:'Jesko',variant:'Dawn',collab:'PUBG MOBILE × Koenigsegg',source:'https://www.pubgmobile.com/webplat/info/news_version3/35372/60662/60663/60724/60725/60728/m22521/202111/904231.shtml'},
    {brand:'Koenigsegg',model:'One:1',variant:'Jade',collab:'PUBG MOBILE × Koenigsegg',source:'https://pubgmobile.jp/pubg-mobile-koenigsegg-notice-20220729/'},
    {brand:'Koenigsegg',model:'One:1',variant:'Phoenix',collab:'PUBG MOBILE × Koenigsegg',source:'https://pubgmobile.jp/pubg-mobile-koenigsegg-notice-20220729/'}
  ].map((x,i)=>({...x,id:i,rarity:'Đỏ',verified:true}));

  const BRANDS=['Tất cả',...new Set(SKINS.map(x=>x.brand))];
  let active=false,brand='Tất cả',query='';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

  function style(){
    if(document.getElementById('tb-v149-cars-style'))return;
    const s=document.createElement('style');
    s.id='tb-v149-cars-style';
    s.textContent=`
      #tbWikiTabs .tb-v149-cars-tab svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8}
      .tb-v149-car-card{border-color:rgba(255,72,92,.24)!important}
      .tb-v149-car-card .tb-card-tag{background:#8b1022!important;color:#ffe5e9!important;border-color:rgba(255,104,120,.38)!important}
      .tb-v149-car-visual{min-height:112px!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;gap:9px!important;background:linear-gradient(145deg,#1d1015,#0b0d12)!important;border-color:rgba(255,72,92,.18)!important}
      .tb-v149-car-visual svg{width:112px;height:42px;fill:none;stroke:#f2c0c7;stroke-width:1.7;opacity:.9}
      .tb-v149-brand{font-size:.72rem;font-weight:900;letter-spacing:.12em;color:#ff8e9c;text-transform:uppercase}
      .tb-v149-variant{margin-top:5px;color:#96a2b7;font-size:.73rem;text-align:center}
      .tb-v149-red-note{margin:0 0 16px;padding:12px 14px;border:1px solid rgba(255,72,92,.22);border-radius:12px;background:rgba(139,16,34,.08);color:#b3bdce;line-height:1.6}
      .tb-v149-detail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .tb-v149-detail-item{padding:14px;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:#101622}
      .tb-v149-detail-item small{display:block;color:#7f8ca5;font-size:.67rem;font-weight:900;text-transform:uppercase;letter-spacing:.07em}
      .tb-v149-detail-item b{display:block;margin-top:5px;color:#f5f7ff}
      .tb-v149-red{color:#ff6b7d!important}
      .tb-v149-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
      .tb-v149-links a{display:inline-flex;align-items:center;min-height:38px;padding:0 12px;border:1px solid rgba(91,120,255,.3);border-radius:10px;background:#111827;color:#cbd8ff;font-weight:800;font-size:.75rem}
      @media(max-width:620px){.tb-v149-detail{grid-template-columns:1fr}.tb-v149-car-visual{min-height:94px!important}}
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
    let btn=tabs.querySelector('.tb-v149-cars-tab');
    if(btn){btn.querySelector('small').textContent=String(SKINS.length);return;}
    btn=document.createElement('button');
    btn.type='button';btn.className='tb-wiki-tab tb-v149-cars-tab';btn.dataset.tab='red-collab-cars';
    btn.innerHTML='<svg viewBox="0 0 24 24"><path d="M4 15h16l-1.5-5-3-2h-7l-3 2L4 15Z"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/></svg><span>Siêu xe đỏ</span><small>'+SKINS.length+'</small>';
    btn.addEventListener('click',()=>{active=true;brand='Tất cả';query='';render();});
    tabs.appendChild(btn);
  }

  function render(){
    const n=nodes();if(!n.tabs||!n.filters||!n.grid||!n.title||!n.subtitle||!n.search)return;
    style();ensureTab();active=true;
    n.tabs.querySelectorAll('.tb-wiki-tab').forEach(b=>b.classList.toggle('active',b.classList.contains('tb-v149-cars-tab')));
    n.title.textContent='Skin siêu xe hợp tác · phẩm chất đỏ';
    n.subtitle.textContent='Chỉ hiển thị skin xe hợp tác đã được PUBG MOBILE công bố chính thức là rarity Đỏ; không tự gán phẩm chất cho các mẫu chưa có xác nhận.';
    n.search.placeholder='Tìm McLaren, Tesla, Jesko, Gemera...';
    n.search.value=query;
    if(n.compare)n.compare.style.display='none';
    n.filters.innerHTML=BRANDS.map(x=>`<button class="tb-wiki-filter ${x===brand?'active':''}" type="button" data-v149-brand="${esc(x)}">${esc(x)}</button>`).join('');
    n.filters.querySelectorAll('[data-v149-brand]').forEach(b=>b.addEventListener('click',()=>{brand=b.dataset.v149Brand;render();}));
    const rows=SKINS.filter(x=>(brand==='Tất cả'||x.brand===brand)&&(!query||norm(`${x.brand} ${x.model} ${x.variant} ${x.collab}`).includes(norm(query))));
    n.grid.innerHTML=rows.length?rows.map(x=>`<article class="tb-wiki-card tb-v149-car-card" data-v149-car="${x.id}" tabindex="0" role="button" aria-label="Xem ${esc(x.brand+' '+x.model+' '+x.variant)}"><span class="tb-card-tag">ĐỎ</span><div class="tb-card-visual tb-v149-car-visual"><svg viewBox="0 0 120 46" aria-hidden="true"><path d="M9 28h102l-8-14H77l-13-7H43l-15 7H16L9 28Z"/><path d="M30 14h46M43 7l-6 21M64 7l9 21"/><circle cx="29" cy="31" r="7"/><circle cx="92" cy="31" r="7"/></svg><div class="tb-v149-brand">${esc(x.brand)}</div></div><h3>${esc(x.model)}</h3><p>Phẩm chất đỏ · Hợp tác chính thức</p><div class="tb-v149-variant">${esc(x.variant)}</div></article>`).join(''):'<div class="tb-wiki-empty">Không tìm thấy skin xe phù hợp.</div>';
    n.grid.querySelectorAll('[data-v149-car]').forEach(card=>{
      const open=()=>openDetail(SKINS[Number(card.dataset.v149Car)]);
      card.addEventListener('click',open);
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
  }

  function openDetail(x){
    if(!x)return;
    const modal=document.getElementById('tbWikiModal'),body=document.getElementById('tbWikiModalBody'),title=document.getElementById('tbWikiModalTitle');
    if(!modal||!body||!title)return;
    title.textContent=`${x.brand} ${x.model} (${x.variant})`;
    body.innerHTML=`<div class="tb-v149-red-note"><b>Đã xác minh:</b> PUBG MOBILE Nhật Bản thông báo ngày 22/11/2022 rằng skin này được thống nhất rarity thành <b>Red / Đỏ</b>. Tên mẫu và hợp tác được đối chiếu từ trang/sự kiện PUBG MOBILE chính thức.</div><div class="tb-v149-detail"><div class="tb-v149-detail-item"><small>Hãng</small><b>${esc(x.brand)}</b></div><div class="tb-v149-detail-item"><small>Mẫu xe</small><b>${esc(x.model)}</b></div><div class="tb-v149-detail-item"><small>Phiên bản skin</small><b>${esc(x.variant)}</b></div><div class="tb-v149-detail-item"><small>Phẩm chất</small><b class="tb-v149-red">Đỏ · Red</b></div><div class="tb-v149-detail-item"><small>Hợp tác</small><b>${esc(x.collab)}</b></div><div class="tb-v149-detail-item"><small>Trạng thái</small><b>Đã xác minh chính thức</b></div></div><div class="tb-v149-links"><a href="${esc(x.source)}" target="_blank" rel="noopener noreferrer">Nguồn hợp tác PUBG MOBILE</a><a href="${RED_SOURCE}" target="_blank" rel="noopener noreferrer">Nguồn xác nhận phẩm chất Đỏ</a></div>`;
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  }

  function bindSearch(){
    const n=nodes();if(!n.search||n.search.dataset.v149CarsBound)return;
    n.search.dataset.v149CarsBound='1';
    n.search.addEventListener('input',e=>{
      if(!active)return;
      e.stopImmediatePropagation();query=n.search.value;render();
    },true);
  }

  function boot(){
    const n=nodes();if(!n.tabs){setTimeout(boot,70);return;}
    style();ensureTab();bindSearch();
    n.tabs.addEventListener('click',e=>{
      const b=e.target.closest('.tb-wiki-tab');
      if(!b||b.classList.contains('tb-v149-cars-tab'))return;
      active=false;
      if(n.compare)n.compare.style.display='';
    },true);
    let queued=false;
    const obs=new MutationObserver(()=>{
      if(queued)return;queued=true;
      requestAnimationFrame(()=>{queued=false;ensureTab();bindSearch();if(active)render();});
    });
    obs.observe(n.tabs,{childList:true});
  }

  boot();
})();