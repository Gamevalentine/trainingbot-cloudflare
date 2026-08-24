(()=>{
  const buttons=[...document.querySelectorAll('.tb-topic-toggle')];
  buttons.forEach(button=>button.addEventListener('click',()=>{
    const open=button.getAttribute('aria-expanded')!=='true';
    buttons.forEach(item=>{
      item.setAttribute('aria-expanded','false');
      document.querySelector(`#${item.getAttribute('aria-controls')}`).hidden=true;
    });
    if(open){
      button.setAttribute('aria-expanded','true');
      document.querySelector(`#${button.getAttribute('aria-controls')}`).hidden=false;
    }
  }));
})();
