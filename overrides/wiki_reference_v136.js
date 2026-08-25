(()=>{
  if(!document.getElementById('wikiGrid')||typeof DATA==='undefined')return;
  document.body.classList.add('tb-wiki-reference');
  const oldModal=document.getElementById('modal');
  if(oldModal)oldModal.remove();

  const icons={
    weapons:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v3m0 4v3M7 12h3m4 0h3"/></svg>',
    attachments:'<svg viewBox="0 0 24 24"><path d="m14 7 3-3 3 3-3 3M4 20l7-7m-5-5 3 3m2-5 7 7"/></svg>',
    vehicles:'<svg viewBox="0 0 24 24"><path d="M5 16h14l-1-5-3-2H9l-3 2-1 5Z"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/></svg>',
    maps:'<svg viewBox="0 0 24 24"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15m6-12v15"/></svg>'
  };
  const labels={
    weapons:{title:'Kho vũ khí',subtitle:'Sát thương, chỉ số, phụ kiện và bản đồ có thể sử dụng cho từng loại vũ khí.',placeholder:'Khám xét vũ khí...'},
    attachments:{title:'Kho phụ kiện',subtitle:'Đầu nòng, tay cầm, ống ngắm, băng đạn, báng súng và phụ kiện chiến thuật.',placeholder:'Khám xét phụ kiện...'},
    vehicles:{title:'Kho xe cộ',subtitle:'Phương tiện di chuyển, số chỗ ngồi và bản đồ xuất hiện.',placeholder:'Khám xét xe cộ...'},
    maps:{title:'Kho bản đồ',subtitle:'Quy mô, nhịp độ và đặc điểm chiến đấu của từng bản đồ.',placeholder:'Khám xét bản đồ...'}
  };
  const filters={
    weapons:['Tất cả','Súng trường tấn công','DMR','Súng bắn tỉa','SMG','LMG','Shotgun','Súng ngắn','Đặc biệt'],
    attachments:['Tất cả','Đầu nòng','Tay cầm','Ống ngắm','Băng đạn','Báng súng','Chiến thuật'],
    vehicles:['Tất cả','Xe địa hình','Ô tô','Xe máy','Xe tuyết','Phương tiện nước','Xe đạp'],
    maps:['Tất cả','Cân bằng','Tầm xa','Nhịp nhanh','Hỗn hợp','Trận ngắn','Cận chiến','Siêu nhanh','Đa địa hình']
  };
  const main=document.querySelector('main');
  main.innerHTML=`<section class="tb-wiki-shell">
    <div class="tb-wiki-head">
      <div><div class="tb-wiki-kicker">${icons.maps}<span>WIKI PUBG MOBILE</span></div><h1 id="tbWikiTitle">Kho vũ khí</h1><p class="tb-wiki-subtitle" id="tbWikiSubtitle"></p></div>
      <div class="tb-wiki-tools"><label class="tb-wiki-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg><input id="tbWikiSearch" autocomplete="off"></label><button class="tb-compare-btn" id="tbCompareBtn" type="button"><svg viewBox="0 0 24 24"><circle cx="7" cy="5" r="2"/><circle cx="17" cy="19" r="2"/><path d="M7 7v8c0 2 2 4 4 4h4M17 17V9c0-2-2-4-4-4H9"/></svg><span>So sánh</span></button></div>
    </div>
    <div class="tb-wiki-tabs" id="tbWikiTabs"></div>
    <div class="tb-wiki-filters" id="tbWikiFilters"></div>
    <div class="tb-wiki-grid" id="tbWikiGrid"></div>
  </section>
  <div class="tb-wiki-modal" id="tbWikiModal" aria-hidden="true"><div class="tb-wiki-modal-card"><div class="tb-wiki-modal-head"><h3 id="tbWikiModalTitle"></h3><button class="tb-wiki-modal-close" id="tbWikiModalClose" type="button">×</button></div><div class="tb-wiki-modal-body" id="tbWikiModalBody"></div></div></div>`;

  let active='weapons',searchTerm='',filter='Tất cả',compareMode=false,selected=[];
  const titleEl=document.getElementById('tbWikiTitle'),subEl=document.getElementById('tbWikiSubtitle'),searchEl=document.getElementById('tbWikiSearch'),tabsEl=document.getElementById('tbWikiTabs'),filtersEl=document.getElementById('tbWikiFilters'),gridEl=document.getElementById('tbWikiGrid'),compareBtn=document.getElementById('tbCompareBtn');
  const norm=s=>(s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const weaponSvg=()=>`<svg viewBox="0 0 260 95" aria-hidden="true"><path class="gun-body" d="M24 42h92l17-12h60l18 10h29v12h-33l-16 8h-39l-14-7H91l-16 8H49l-4-8H24Z"/><path class="gun-dark" d="M116 50h22l11 33h-21l-13-24H98v-9ZM186 34l17-10h19l-10 16Z"/><path class="gun-line" d="M26 47h72m44-12h43m-92 19 18 8"/></svg>`;
  const visualFor=(row)=>active==='weapons'?weaponSvg():`<div class="tb-card-visual tb-glyph">${row[0].replace(/[^A-Za-z0-9]/g,'').slice(0,3).toUpperCase()||'TB'}</div>`;
  const rowType=row=>active==='weapons'?row[1]:active==='attachments'?row[1]:active==='vehicles'?row[1]:row[2];
  const rowSub=row=>active==='weapons'?row[2]:active==='attachments'?row[1]:active==='vehicles'?`${row[2]} chỗ · ${row[3]}`:`${row[1]} · ${row[2]}`;
  const shortTag=row=>{
    if(active!=='weapons')return rowType(row);
    const map={'Súng trường tấn công':'AR','DMR':'DMR','Súng bắn tỉa':'SR','SMG':'SMG','Shotgun':'SG','LMG':'LMG','Súng ngắn':'HG','Đặc biệt':'ĐB'};return map[row[1]]||row[1];
  };
  function currentRows(){
    return DATA[active].filter(row=>{
      const matchesSearch=!searchTerm||norm(row.join(' ')).includes(norm(searchTerm));
      const matchesFilter=filter==='Tất cả'||rowType(row)===filter;
      return matchesSearch&&matchesFilter;
    });
  }
  function renderTabs(){
    const info=[['weapons','Vũ khí',56],['attachments','Tệp đính kèm',49],['vehicles','Xe cộ',26],['maps','Bản đồ',8]];
    tabsEl.innerHTML=info.map(([key,name,count])=>`<button class="tb-wiki-tab ${key===active?'active':''}" data-tab="${key}" type="button">${icons[key]}<span>${name}</span><small>${count}</small></button>`).join('');
    tabsEl.querySelectorAll('.tb-wiki-tab').forEach(btn=>btn.onclick=()=>{active=btn.dataset.tab;filter='Tất cả';selected=[];compareMode=false;render();});
  }
  function renderFilters(){
    filtersEl.innerHTML=filters[active].map(name=>`<button class="tb-wiki-filter ${name===filter?'active':''}" data-filter="${name}" type="button">${name}</button>`).join('');
    filtersEl.querySelectorAll('.tb-wiki-filter').forEach(btn=>btn.onclick=()=>{filter=btn.dataset.filter;selected=[];renderFilters();renderGrid();});
  }
  function renderGrid(){
    const rows=currentRows();
    gridEl.parentElement.classList.toggle('compare-mode',compareMode&&active==='weapons');
    gridEl.innerHTML=rows.length?rows.map((row,i)=>`<article class="tb-wiki-card ${selected.includes(row[0])?'selected':''}" data-index="${i}" tabindex="0"><span class="tb-card-tag">${shortTag(row)}</span><span class="tb-card-check">✓</span>${active==='weapons'?`<div class="tb-card-visual">${weaponSvg()}</div>`:visualFor(row)}<h3>${row[0]}</h3><p>${rowSub(row)}</p></article>`).join(''):'<div class="tb-wiki-empty">Không tìm thấy kết quả phù hợp.</div>';
    gridEl.querySelectorAll('.tb-wiki-card').forEach((card,i)=>{
      const activate=()=>{const row=rows[i];if(compareMode&&active==='weapons'){const at=selected.indexOf(row[0]);if(at>=0)selected.splice(at,1);else if(selected.length<3)selected.push(row[0]);renderGrid();updateCompare();return;}openDetail(row)};
      card.onclick=activate;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}};
    });
  }
  function updateCompare(){compareBtn.classList.toggle('active',compareMode);compareBtn.querySelector('span').textContent=compareMode?(selected.length?`So sánh (${selected.length})`:'Chọn vũ khí'):'So sánh';}
  function openDetail(row){
    const modal=document.getElementById('tbWikiModal'),body=document.getElementById('tbWikiModalBody');document.getElementById('tbWikiModalTitle').textContent=row[0];
    if(active==='weapons')body.innerHTML=`<p class="tb-detail-lead">${row[1]} sử dụng ${row[2]} với chế độ bắn ${row[3]}.</p><div class="tb-detail-grid"><div class="tb-detail-item"><small>Nhóm</small><b>${row[1]}</b></div><div class="tb-detail-item"><small>Loại đạn</small><b>${row[2]}</b></div><div class="tb-detail-item"><small>Chế độ bắn</small><b>${row[3]}</b></div><div class="tb-detail-item"><small>Vai trò</small><b>${row[1]==='SMG'||row[1]==='Shotgun'?'Cận chiến':row[1]==='Súng bắn tỉa'||row[1]==='DMR'?'Trung – xa':'Đa dụng'}</b></div></div>`;
    if(active==='attachments')body.innerHTML=`<p class="tb-detail-lead">${row[2]}</p><div class="tb-detail-grid"><div class="tb-detail-item"><small>Nhóm</small><b>${row[1]}</b></div><div class="tb-detail-item"><small>Công dụng</small><b>${row[2]}</b></div></div>`;
    if(active==='vehicles')body.innerHTML=`<p class="tb-detail-lead">${row[4]}</p><div class="tb-detail-grid"><div class="tb-detail-item"><small>Loại</small><b>${row[1]}</b></div><div class="tb-detail-item"><small>Số chỗ</small><b>${row[2]}</b></div><div class="tb-detail-item"><small>Bản đồ</small><b>${row[3]}</b></div></div>`;
    if(active==='maps')body.innerHTML=`<p class="tb-detail-lead">${row[3]}</p><div class="tb-detail-grid"><div class="tb-detail-item"><small>Quy mô</small><b>${row[1]}</b></div><div class="tb-detail-item"><small>Nhịp chơi</small><b>${row[2]}</b></div></div>`;
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  }
  function openCompare(){
    if(selected.length<2)return;
    const rows=selected.map(name=>DATA.weapons.find(r=>r[0]===name)).filter(Boolean),modal=document.getElementById('tbWikiModal');document.getElementById('tbWikiModalTitle').textContent='So sánh vũ khí';document.getElementById('tbWikiModalBody').innerHTML=`<div class="tb-compare-list">${rows.map(r=>`<div class="tb-compare-col"><h4>${r[0]}</h4><p><b>Nhóm:</b> ${r[1]}</p><p><b>Đạn:</b> ${r[2]}</p><p><b>Chế độ:</b> ${r[3]}</p></div>`).join('')}</div>`;modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  }
  function render(){
    titleEl.textContent=labels[active].title;subEl.textContent=labels[active].subtitle;searchEl.placeholder=labels[active].placeholder;searchEl.value=searchTerm='';compareBtn.style.display=active==='weapons'?'inline-flex':'none';renderTabs();renderFilters();renderGrid();updateCompare();
  }
  searchEl.oninput=e=>{searchTerm=e.target.value.trim();renderGrid();};
  compareBtn.onclick=()=>{if(compareMode&&selected.length>=2){openCompare();return;}compareMode=!compareMode;if(!compareMode)selected=[];renderGrid();updateCompare();};
  const modal=document.getElementById('tbWikiModal');document.getElementById('tbWikiModalClose').onclick=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');};modal.onclick=e=>{if(e.target===modal)document.getElementById('tbWikiModalClose').click();};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))document.getElementById('tbWikiModalClose').click();});
  render();
})();
