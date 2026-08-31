(()=>{
  function normalizePath(pathname){
    let path=String(pathname||'/').replace(/\/index\.html$/i,'/').replace(/\.html$/i,'');
    if(path.length>1)path=path.replace(/\/+$/,'');
    return path||'/';
  }

  function parentFor(path){
    if(path==='/')return null;

    // Child pages with an explicit parent section.
    if(path==='/tim-dong-doi')return '/community';
    if(/^\/news-/.test(path))return '/news';
    if(/^\/wiki-/.test(path))return '/wiki';
    if(/^\/(?:ban-cap-nhat|updates|update)-/.test(path))return '/ban-cap-nhat';
    if(/^\/community-/.test(path))return '/community';

    // Main navigation pages do not need a back button.
    if(['/community','/news','/wiki','/ban-cap-nhat','/updates','/contact'].includes(path))return null;

    // For nested URL paths, go to the immediate URL parent.
    const parts=path.split('/').filter(Boolean);
    if(parts.length>1)return '/'+parts.slice(0,-1).join('/');

    // Other standalone public pages can return to the homepage.
    return '/';
  }

  function init(){
    if(document.querySelector('.tb-global-back'))return;
    const path=normalizePath(location.pathname);
    let parent=parentFor(path);

    // A detail state that lives on a main route (query/hash) can return to the clean parent page.
    if((location.search||location.hash)&&['/wiki','/news','/community','/ban-cap-nhat','/updates'].includes(path)){
      parent=path==='/updates'?'/ban-cap-nhat':path;
    }

    if(!parent)return;
    const button=document.createElement('a');
    button.className='tb-global-back';
    button.setAttribute('aria-label','Quay lại trang mẹ');
    button.href=parent;
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg><span>Quay lại</span>';
    document.body.appendChild(button);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
