(()=>{
  const button=document.querySelector('.tb-topics-toggle');
  const groups=document.querySelector('#tb-topic-groups');
  if(!button||!groups)return;
  button.addEventListener('click',()=>{
    const open=button.getAttribute('aria-expanded')!=='true';
    button.setAttribute('aria-expanded',String(open));
    groups.hidden=!open;
  });
})();
