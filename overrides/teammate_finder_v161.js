(()=>{
  const API='/api/team-finder';
  const DISCORD_INVITE='https://discord.com/invite/5u5PbZMqx';
  const $=s=>document.querySelector(s);
  const grid=$('#tbMatchGrid');
  if(!grid)return;

  const controls={server:$('#tbFilterServer'),rank:$('#tbFilterRank'),mode:$('#tbFilterMode'),needed:$('#tbFilterNeeded'),mic:$('#tbFilterMic'),play_time:$('#tbFilterTime'),language:$('#tbFilterLanguage'),q:$('#tbFilterQuery'),sort:$('#tbFilterSort')};
  const countEl=$('#tbResultCount');
  const modal=$('#tbPostModal');
  const form=$('#tbPostForm');
  const statusEl=$('#tbPostStatus');
  let loading=false;

  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function initials(name){const parts=String(name||'?').trim().split(/\s+/).filter(Boolean);return (parts.length>1?parts[0][0]+parts[parts.length-1][0]:parts[0]?.slice(0,2)||'?').toUpperCase();}
  function ago(iso){const ms=Date.now()-Date.parse(iso);if(!Number.isFinite(ms)||ms<0)return 'MỚI';const h=Math.floor(ms/36e5);if(h<24)return 'MỚI';const d=Math.max(1,Math.floor(h/24));return `${d}N`;}
  function ownTokens(){try{return JSON.parse(localStorage.getItem('tbTeamFinderTokens')||'{}')||{};}catch{return {};}}
  function saveToken(id,token){const data=ownTokens();data[id]=token;localStorage.setItem('tbTeamFinderTokens',JSON.stringify(data));}
  function removeToken(id){const data=ownTokens();delete data[id];localStorage.setItem('tbTeamFinderTokens',JSON.stringify(data));}
  function toast(message){document.querySelector('.tb-toast')?.remove();const el=document.createElement('div');el.className='tb-toast';el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),3600);}
  async function copy(text){try{await navigator.clipboard.writeText(text);return true;}catch{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy');}catch{}ta.remove();return ok;}}
  function contactMessage(post){return `Chào ${post.name}, mình thấy tin tìm đồng đội của bạn trên TrainingBot. Mình muốn ghép team với bạn.`;}

  function render(posts){
    countEl.textContent=String(posts.length);
    if(!posts.length){grid.innerHTML=`<div class="tb-match-empty"><strong>Chưa có tin phù hợp</strong><span>Thử đổi bộ lọc hoặc trở thành người đầu tiên đăng tin tìm đồng đội.</span><br><button class="tb-match-primary" type="button" id="tbEmptyPost">＋ ĐĂNG TIN TÌM ĐỒNG ĐỘI</button></div>`;$('#tbEmptyPost')?.addEventListener('click',openModal);return;}
    const tokens=ownTokens();
    grid.innerHTML=posts.map(post=>{
      const uid=post.pubg_uid?escapeHtml(post.pubg_uid):'—';
      const note=post.note?escapeHtml(post.note):'Sẵn sàng kết nối và lập team cùng người chơi phù hợp.';
      const own=Boolean(tokens[post.id]);
      const hasRoom=Boolean(post.discord_thread_url);
      return `<article class="tb-player-card" data-id="${escapeHtml(post.id)}">
        <span class="tb-player-badge">${ago(post.created_at)}</span>
        <div class="tb-player-top"><div class="tb-player-avatar">${escapeHtml(initials(post.name))}</div><div class="tb-player-name"><strong>${escapeHtml(post.name)}</strong><span>Discord: ${escapeHtml(post.discord_name)}</span></div></div>
        <div class="tb-player-rank">✦ ${escapeHtml(post.rank)}</div>
        <div class="tb-player-meta">
          <div><span>◎ Server</span><span>${escapeHtml(post.server)}</span></div>
          <div><span>◈ Chế độ</span><span>${escapeHtml(post.mode)}</span></div>
          <div><span>♙ Số người cần tìm</span><span>${escapeHtml(post.needed)} người</span></div>
          <div><span>◷ Khung giờ</span><span>${escapeHtml(post.play_time)}</span></div>
          <div><span>♬ Mic</span><span>${post.mic==='yes'?'Có':'Không yêu cầu'}</span></div>
          <div><span>◫ Ngôn ngữ</span><span>${escapeHtml(post.language)}</span></div>
          <div><span>UID</span><span>${uid}</span></div>
        </div>
        <div class="tb-player-note">${note}</div>
        <div class="tb-player-actions"><button class="tb-discord-btn" type="button" data-contact>${hasRoom?'☁ Vào phòng đội':'☁ Liên hệ Discord'}</button><button class="tb-copy-btn" type="button" data-copy>▣ Sao chép</button></div>
        ${own?'<button class="tb-close-own" type="button" data-close-own>✓ Đã tìm đủ đồng đội</button>':''}
      </article>`;
    }).join('');
    grid.querySelectorAll('.tb-player-card').forEach((card,index)=>{
      const post=posts[index];
      card.querySelector('[data-contact]')?.addEventListener('click',()=>{
        if(post.discord_thread_url){
          window.open(post.discord_thread_url,'_blank','noopener,noreferrer');
          toast('Đang mở phòng đội trên Discord.');
          return;
        }
        const msg=contactMessage(post);
        const url=/^\d{17,20}$/.test(String(post.discord_user_id||''))?`https://discord.com/users/${post.discord_user_id}`:DISCORD_INVITE;
        window.open(url,'_blank','noopener,noreferrer');
        copy(msg).then(copied=>toast(copied?'Đã sao chép lời nhắn. Discord đang được mở.':'Discord đang được mở.'));
      });
      card.querySelector('[data-copy]')?.addEventListener('click',async()=>{
        const lines=[`Discord: ${post.discord_name}`,post.pubg_uid?`PUBG UID: ${post.pubg_uid}`:'',post.discord_thread_url?`Phòng đội: ${post.discord_thread_url}`:'',contactMessage(post)].filter(Boolean).join('\n');
        toast(await copy(lines)?'Đã sao chép thông tin liên hệ.':'Không thể sao chép tự động.');
      });
      card.querySelector('[data-close-own]')?.addEventListener('click',()=>closeOwn(post.id));
    });
  }

  function params(){const p=new URLSearchParams();Object.entries(controls).forEach(([key,el])=>{const value=el?.value?.trim();if(value)p.set(key,value);});return p;}
  async function load(){
    if(loading)return;loading=true;grid.innerHTML='<div class="tb-match-loading">Đang tải danh sách...</div>';
    try{const res=await fetch(`${API}?${params().toString()}`,{headers:{accept:'application/json'}});const data=await res.json();if(!res.ok||!data.ok)throw new Error(data.message||'Không tải được danh sách.');render(Array.isArray(data.posts)?data.posts:[]);}catch(err){countEl.textContent='0';grid.innerHTML=`<div class="tb-match-error">${escapeHtml(err.message||'Không tải được danh sách tìm đồng đội.')}</div>`;}finally{loading=false;}
  }

  function openModal(){modal.hidden=false;document.body.style.overflow='hidden';setTimeout(()=>form?.elements?.name?.focus(),30);}
  function closeModal(){modal.hidden=true;document.body.style.overflow='';statusEl.textContent='';statusEl.className='tb-match-form-status';}
  document.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',closeModal));
  $('#tbOpenPost')?.addEventListener('click',openModal);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeModal();});

  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    const submit=form.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='ĐANG TẠO PHÒNG...';
    statusEl.textContent='';statusEl.className='tb-match-form-status';
    const body=Object.fromEntries(new FormData(form).entries());
    try{
      const res=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await res.json();
      if(!res.ok||!data.ok)throw new Error(data.message||'Không thể đăng tin.');
      if(data.id&&data.manage_token)saveToken(data.id,data.manage_token);
      statusEl.textContent=data.discord_thread_created?'Đã đăng tin và tạo phòng Discord thành công.':(data.warning||'Đăng tin thành công.');
      statusEl.className='tb-match-form-status success';
      form.reset();
      setTimeout(()=>{closeModal();load();toast(data.discord_thread_created?'Đã tạo phòng đội trong Discord TrainingBot.':(data.warning||'Tin tìm đồng đội đã được đăng.'));},650);
    }catch(err){statusEl.textContent=err.message||'Không thể đăng tin.';statusEl.className='tb-match-form-status error';}
    finally{submit.disabled=false;submit.textContent='ĐĂNG TIN & TẠO PHÒNG ĐỘI →';}
  });

  async function closeOwn(id){
    const token=ownTokens()[id];if(!token)return;
    if(!confirm('Đã tìm đủ đồng đội? Tin trên web sẽ được ẩn và phòng Discord sẽ được khóa.'))return;
    try{const res=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'close',id,manage_token:token})});const data=await res.json();if(!res.ok||!data.ok)throw new Error(data.message||'Không cập nhật được tin.');removeToken(id);toast(data.warning||data.message||'Đã đóng tin tìm đồng đội.');load();}catch(err){toast(err.message||'Không cập nhật được tin.');}
  }

  $('#tbSearch')?.addEventListener('click',load);
  $('#tbFilterQuery')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();load();}});
  Object.entries(controls).filter(([key])=>key!=='q').forEach(([,el])=>el?.addEventListener('change',load));
  $('#tbResetFilters')?.addEventListener('click',()=>{Object.values(controls).forEach(el=>{if(el)el.value=el.id==='tbFilterSort'?'latest':'';});load();});
  load();
})();
