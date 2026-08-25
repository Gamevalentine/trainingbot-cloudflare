(()=>{
  if(document.querySelector('.tb-global-footer'))return;
  const style=document.createElement('link');
  style.rel='stylesheet';
  style.href='/footer_v135.css?v=135';
  document.head.append(style);

  document.querySelectorAll('footer').forEach(footer=>footer.remove());
  const footer=document.createElement('footer');
  footer.className='tb-global-footer';
  footer.innerHTML=`<div class="tb-global-footer-inner">
    <section class="tb-global-about"><div><img src="/trainingbot-logo-v110.png" alt=""><strong>TRAININGBOT</strong></div><p>Nền tảng cập nhật PUBG Mobile, tin tức, bản thử nghiệm, hướng dẫn và nội dung cộng đồng.</p></section>
    <section><h2>LIÊN KẾT NHANH</h2><nav><a href="/">Trang chủ</a><a href="/ban-cap-nhat">Bản cập nhật</a><a href="/news">Tin tức</a><a href="/wiki">Wiki</a><a href="/community">Cộng đồng</a><a href="/contact">Liên hệ</a></nav></section>
    <section><h2>KẾT NỐI</h2><nav>
      <a href="https://www.tiktok.com/@trainingbot.ai2" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M15.2 3c.5 2.3 1.9 3.7 4.1 4.2v3.2c-1.5 0-2.9-.4-4.1-1.2v5.9a6.1 6.1 0 1 1-5.3-6v3.3a2.9 2.9 0 1 0 2.1 2.8V3h3.2Z"/></svg><span>@trainingbot.ai2</span></a>
      <a href="mailto:trainingbot.ai2@gmail.com"><svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg><span>trainingbot.ai2@gmail.com</span></a>
      <a href="https://trainingbot.ai" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21M12 3c-2.2 2.5-3.3 5.5-3.3 9S9.8 18.5 12 21"/></svg><span>trainingbot.ai</span></a>
    </nav></section>
  </div>`;
  document.body.append(footer);

  if(document.getElementById('wikiGrid')){
    const wikiStyle=document.createElement('link');
    wikiStyle.rel='stylesheet';
    wikiStyle.href='/wiki_reference_v136.css?v=136';
    document.head.append(wikiStyle);
    const wikiScript=document.createElement('script');
    wikiScript.src='/wiki_reference_v136.js?v=136';
    document.body.append(wikiScript);

    const wikiRealStyle=document.createElement('link');
    wikiRealStyle.rel='stylesheet';
    wikiRealStyle.href='/wiki_real_images_v137.css?v=137';
    document.head.append(wikiRealStyle);
    const wikiRealScript=document.createElement('script');
    wikiRealScript.src='/wiki_real_images_v137.js?v=137';
    document.body.append(wikiRealScript);

    const wikiCompletionScript=document.createElement('script');
    wikiCompletionScript.src='/wiki_completion_v138.js?v=138';
    document.body.append(wikiCompletionScript);
  }

  if(document.querySelector('.release-hero')&&!document.querySelector('#tb-release-hero-highlight')){
    const releaseHeroStyle=document.createElement('style');
    releaseHeroStyle.id='tb-release-hero-highlight';
    releaseHeroStyle.textContent=`
      .release-hero{
        border-color:rgba(255,111,18,.58)!important;
        background:
          radial-gradient(circle at 20% 46%,rgba(255,111,18,.28),transparent 38%),
          radial-gradient(circle at 76% 28%,rgba(255,142,58,.14),transparent 44%),
          linear-gradient(135deg,#2a211d 0%,#201c25 50%,#181b28 100%)!important;
        box-shadow:0 28px 80px rgba(0,0,0,.40),0 0 0 1px rgba(255,111,18,.10),0 18px 52px rgba(255,86,7,.18)!important;
      }
      .release-hero .hero-art{
        background:linear-gradient(90deg,rgba(255,102,18,.055),transparent 72%)!important;
      }
      .release-hero .hero-info{
        background:linear-gradient(90deg,rgba(49,27,19,.24),rgba(10,12,18,.62))!important;
      }
    `;
    document.head.append(releaseHeroStyle);
  }

  const signupBtn=document.querySelector('.light-signup-btn');
  if(signupBtn&&!document.querySelector('.light-signup-platforms')){
    const signupStyle=document.createElement('style');
    signupStyle.textContent=`
      .light-signup-btn{cursor:pointer;user-select:none}
      .light-signup-platforms{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:min(100%,300px);max-height:0;margin-top:0;opacity:0;overflow:hidden;transform:translateY(-4px);transition:max-height .22s ease,opacity .18s ease,margin-top .22s ease,transform .22s ease}
      .light-signup-platforms.is-open{max-height:52px;margin-top:10px;opacity:1;transform:translateY(0)}
      .light-platform-btn{min-height:38px;border:1px solid rgba(123,142,188,.42);border-radius:10px;background:#1a2233;color:#fff;font:800 .78rem/1 Inter,system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none}
      .light-platform-btn:hover{background:#222c42}
      @media(max-width:600px){.light-signup-platforms{width:min(100%,250px);gap:6px}.light-platform-btn{min-height:34px;font-size:.7rem}}
    `;
    document.head.append(signupStyle);

    const platforms=document.createElement('div');
    platforms.className='light-signup-platforms';
    platforms.innerHTML='<button class="light-platform-btn" type="button">Đăng kí IOS</button><a class="light-platform-btn" href="https://play.google.com/store/apps/details?id=com.tencent.igfit" target="_blank" rel="noopener noreferrer">Đăng kí Android</a>';
    signupBtn.insertAdjacentElement('afterend',platforms);

    signupBtn.setAttribute('role','button');
    signupBtn.setAttribute('tabindex','0');
    signupBtn.setAttribute('aria-expanded','false');
    const togglePlatforms=()=>{
      const open=platforms.classList.toggle('is-open');
      signupBtn.setAttribute('aria-expanded',String(open));
    };
    signupBtn.addEventListener('click',togglePlatforms);
    signupBtn.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();
        togglePlatforms();
      }
    });
  }
})();
