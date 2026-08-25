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
    <section><h2>KẾT NỐI</h2><nav><a href="https://www.tiktok.com/@trainingbot.ai2">♪ <span>@trainingbot.ai2</span></a><a href="mailto:trainingbot.ai2@gmail.com">✉ <span>trainingbot.ai2@gmail.com</span></a><a href="https://trainingbot.ai">◉ <span>trainingbot.ai</span></a></nav></section>
  </div>`;
  document.body.append(footer);

  const betaDownloadLinks={
    'V4.6.1':'http://k.gjacky.com/1375135419/230/apkupdate/4.6.1.21395/1375135419_230_4.6.1.21395_20260801175229_459046313_apkupdate.apk',
    'V4.6.2':'http://k.gjacky.com/1375135419/230/apkupdate/4.6.2.21415/1375135419_230_4.6.2.21415_20260807154052_1447578134_apkupdate.apk',
    'V4.6.3':'http://k.gjacky.com/1375135419/230/apkupdate/4.6.3.21435/1375135419_230_4.6.3.21435_20260814163305_39475866_apkupdate.apk',
    'V4.6.4':'http://k.gjacky.com/1375135419/230/apkupdate/4.6.4.21455/1375135419_230_4.6.4.21455_20260824160548_128024679_apkupdate.apk'
  };
  document.querySelectorAll('.beta-build-card').forEach(card=>{
    const version=card.querySelector('.beta-build-version')?.textContent.trim();
    const url=betaDownloadLinks[version];
    const button=card.querySelector('.beta-build-btn.primary');
    if(!url||!button)return;
    const link=document.createElement('a');
    link.className=button.className;
    link.textContent=button.textContent;
    link.href=url;
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.referrerPolicy='no-referrer';
    button.replaceWith(link);
  });
})();
