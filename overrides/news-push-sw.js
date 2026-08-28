self.addEventListener('push',event=>{
  let data={title:'TrainingBot có tin mới',body:'Có bài viết mới trên TrainingBot.',url:'/news'};
  try{data={...data,...event.data.json()};}catch{}
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,tag:data.tag||'trainingbot-news',data:{url:data.url||'/news'},icon:'/pubg-game-avatar.webp',badge:'/pubg-game-avatar.webp'}));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=new URL(event.notification.data?.url||'/news',self.location.origin).href;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if(c.url===url&&'focus'in c)return c.focus();}return clients.openWindow(url);}));
});