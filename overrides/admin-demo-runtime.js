/* TrainingBot Admin Demo — synthetic in-memory data only.
 * Loaded as FIRST script of reconstructed Admin on /admin-demo.html.
 * Do not include this shim in the genuine Admin page.
 */
(function () {
  "use strict";
  if (location.pathname !== "/admin-demo.html" && location.pathname !== "/admin-demo") {
    throw new Error("TrainingBot demo script refused outside the dedicated demo route");
  }
  var TOKEN="TRAININGBOT-DEMO-FAKE-NOT-A-CREDENTIAL";
  var now="2026-10-28T00:00:00Z", seq=10, blocked=0, writes=[];
  var posts=[
    {id:"demo-post-1",slug:"demo-post-1",title:"PUBG Mobile — Tin mẫu đã xuất bản",summary:"Bài viết dữ liệu giả dùng để nghiệm thu.",content:"Đây là bài viết mẫu của Admin Demo. Không xuất hiện trên trang web thật.",rich_content:"<p>Đây là bài viết mẫu của Admin Demo. Không xuất hiện trên trang web thật.</p>",category:"Tin mới",cover_url:"",status:"published",published_at:now,updated_at:now,featured_at:"",url:"/bai-viet/demo-post-1"},
    {id:"demo-post-2",slug:"demo-post-2",title:"Bản nháp — Chưa công khai",summary:"Thử tính năng lọc và chỉnh sửa bài nháp.",content:"Bản nháp hoàn toàn giả lập trong trình duyệt.",rich_content:"<p>Bản nháp hoàn toàn giả lập trong trình duyệt.</p>",category:"Hướng dẫn",cover_url:"",status:"draft",published_at:"",updated_at:now,featured_at:"",url:""}
  ];
  var betas=[
    {id:"demo-beta-1",version:"V4.7.0",major:"V4.7",arch:"x64",status:"released",download_url:"https://example.invalid/fake-demo.apk"},
    {id:"demo-beta-2",version:"V4.8.0",major:"V4.8",arch:"x64",status:"coming_soon",download_url:""}
  ];
  var users=[{id:"demo-user-1",username:"demo_user",display_name:"Tài khoản thử nghiệm",email:"demo@example.invalid",registration_method:"email",created_at:now,status:"active"}];
  var mail=[{id:"demo-mail-1",name:"Người gửi mẫu",email:"reader@example.invalid",message:"Đây là hộp thư giả để kiểm tra giao diện.",subject:"Thư thử nghiệm",status:"new",page:"/contact",created_at:now}];
  var virtualStorage=function(){
    var map=new Map();
    return {getItem:function(k){return map.has(String(k))?map.get(String(k)):null;},
      setItem:function(k,v){map.set(String(k),String(v));},removeItem:function(k){map.delete(String(k));},
      clear:function(){map.clear();},key:function(n){return Array.from(map.keys())[n]||null;},
      get length(){return map.size;}};
  };
  // Never read/write a real saved Admin token on this origin.
  try {
    Object.defineProperty(window,"sessionStorage",{configurable:true,value:virtualStorage()});
    Object.defineProperty(window,"localStorage",{configurable:true,value:virtualStorage()});
  } catch (err) {
    document.documentElement.textContent="Không thể khởi chạy Demo an toàn trong trình duyệt này.";
    throw new Error("Demo storage isolation unavailable");
  }
  var originalFetch=window.fetch.bind(window);
  var reply=function(body,status){
    return Promise.resolve(new Response(JSON.stringify(body),{status:status||200,headers:{"Content-Type":"application/json;charset=utf-8","Cache-Control":"no-store","X-TrainingBot-Demo":"synthetic"}}));
  };
  var bad=function(message,status){return reply({ok:false,message:message},status||400);};
  var clone=function(o){return JSON.parse(JSON.stringify(o));};
  var parseBody=async function(init){
    if (!init || !init.body) return {};
    if (typeof init.body==="string") {try{return JSON.parse(init.body);}catch(e){return {};}}
    if (init.body instanceof FormData) return {__form:true};
    return {};
  };
  var checkToken=function(init){
    var hdr=new Headers(init && init.headers || {});
    return hdr.get("Authorization")==="Bearer "+TOKEN;
  };
  var handle=async function(path,url,method,init){
    // All requests to /api are answered here, never forwarded.
    if (!checkToken(init)) return bad("Demo chưa được kích hoạt.",401);
    var body=await parseBody(init);
    if(path==="/api/v71/admin/posts") {
      if(method==="GET"){
        var id=url.searchParams.get("id");
        var one=posts.find(function(p){return p.id===id;});
        return id?one?reply({ok:true,post:clone(one)}):bad("Không tìm thấy bài demo",404):reply({ok:true,posts:clone(posts)});
      }
      if(method==="POST"){
        if(!body.title || !body.content) return bad("Nhập tiêu đề và nội dung bài viết demo.");
        var id="demo-new-"+(++seq),status=body.status==="draft"?"draft":"published";
        var p=Object.assign({id:id,slug:id,category:"Tin mới",cover_url:"",summary:"",rich_content:"",featured_at:"",published_at:status==="draft"?"":now,updated_at:now},body,{id:id,slug:id,status:status,url:status==="draft"?"":"/bai-viet/"+id});
        posts.unshift(p);writes.push({scope:"posts",method:method});return reply({ok:true,post:clone(p)},201);
      }
      if(method==="PATCH"){
        var target=posts.find(function(p){return p.id===body.id;});
        if(!target)return bad("Không tìm thấy bài demo",404);
        var status=body.status || target.status;
        if(status!=="draft" && status!=="published")return bad("Trạng thái không hợp lệ");
        if(body.featured && status==="draft")return bad("Không thể ghim bản nháp",409);
        Object.assign(target,body,{updated_at:now,status:status});
        target.published_at=status==="published"?(target.published_at||now):target.published_at;
        target.url=status==="published"?"/bai-viet/"+target.slug:"";
        writes.push({scope:"posts",method:method});return reply({ok:true,post:clone(target)});
      }
      if(method==="DELETE"){
        var i=posts.findIndex(function(p){return p.id===body.id;});
        if(i<0)return bad("Không tìm thấy bài demo",404);
        posts.splice(i,1);writes.push({scope:"posts",method:method});return reply({ok:true,posts:clone(posts)});
      }
    }
    if(path==="/api/v71/admin/beta-versions"){
      if(method==="GET")return reply({ok:true,versions:clone(betas)});
      if(method==="POST" || method==="PATCH"){
        if(!/^V?\d+\.\d+(?:\.\d+)?$/i.test(String(body.version||"")))return bad("Định dạng phiên bản demo không hợp lệ");
        if(body.status==="released" && !/^https:\/\//i.test(String(body.download_url||"")))return bad("Link APK Demo cần là HTTPS");
        var duplicate=betas.find(function(b){return b.version.toLowerCase()===body.version.toLowerCase() && b.arch===body.arch && b.id!==body.id;});
        if(duplicate)return bad("Phiên bản đã tồn tại trong Demo",409);
        var index=betas.findIndex(function(b){return b.id===body.id;});
        if(method==="PATCH" && index<0)return bad("Không tìm thấy phiên bản Demo",404);
        var major=String(body.version).replace(/^V/i,"").split(".").slice(0,2).join(".");
        var record=Object.assign({},body,{id:method==="POST"?"demo-beta-"+(++seq):body.id,major:"V"+major});
        if(method==="POST")betas.unshift(record);else betas[index]=record;
        writes.push({scope:"beta",method:method});return reply({ok:true,versions:clone(betas)});
      }
      if(method==="DELETE"){
        betas=betas.filter(function(b){return b.id!==body.id;});
        writes.push({scope:"beta",method:method});return reply({ok:true,versions:clone(betas)});
      }
    }
    if(path==="/api/v49/admin/users"){
      if(method==="GET")return reply({ok:true,users:clone(users),stats:{total:users.length,active_24h:1,active_7d:1,new_today:0}});
      writes.push({scope:"users",method:method});return reply({ok:true,message:"Đã mô phỏng thao tác tài khoản."});
    }
    if(path.endsWith("/admin-contacts") || path.endsWith("/contact-messages")){
      if(method==="GET")return reply({ok:true,messages:clone(mail),counts:{total:mail.length,unread:1,read:0,replied:0}});
      writes.push({scope:"inbox",method:method});return reply({ok:true,message:"Đã mô phỏng thao tác hộp thư."});
    }
    if(path.includes("visitor-events"))return reply({ok:true,summary:{today_visitors:8,today_sessions:12,online_visitors:2,online_sessions:2},sessions:[],devices:[],oses:[],browsers:[]});
    if(path.includes("image-replace") || path.includes("image-restore")){
      // Do not pretend a real image was uploaded to R2.
      return bad("Demo không tải ảnh lên R2; vui lòng thử giao diện với ảnh có sẵn.",422);
    }
    if(method!=="GET" && method!=="HEAD")return bad("Thao tác này cần staging riêng; Demo không ghi hệ thống thật.",422);
    return reply({ok:true,changes:[],page:"/index.html",status:"demo"});
  };
  window.fetch=function(input,options){
    var init=options||{},raw=typeof input==="string"?input:input && input.url;
    var url;
    try {url=new URL(raw,location.href);} catch(e){blocked++;return Promise.reject(new TypeError("Blocked invalid Demo URL"));}
    var method=String(init.method||input && input.method||"GET").toUpperCase();
    if(url.pathname.startsWith("/api/"))return handle(url.pathname,url,method,init);
    if(url.origin===location.origin && (method==="GET"||method==="HEAD") &&
       (/^\/admin-v2-runtime\//.test(url.pathname) || /\.(?:css|js|svg|png|jpe?g|webp|woff2?)$/i.test(url.pathname))){
      return originalFetch(input,options);
    }
    blocked++;
    return Promise.reject(new TypeError("Demo chặn yêu cầu mạng ngoài dữ liệu giả"));
  };
  // Hard stop for legacy request channels not using fetch.
  XMLHttpRequest.prototype.open=function(){blocked++;throw new Error("XHR disabled in Admin Demo");};
  try{navigator.sendBeacon=function(){blocked++;return false;};}catch(e){}
  try{window.WebSocket=function(){blocked++;throw new Error("WebSocket blocked in Admin Demo");};}catch(e){}
  try{window.EventSource=function(){blocked++;throw new Error("EventSource blocked in Admin Demo");};}catch(e){}
  window.open=function(){blocked++;notify("Demo không mở trang/ứng dụng bên ngoài.");return null;};
  var banner;
  function notify(message){
    var live=document.getElementById("tbDemoNotice");
    if(live)live.textContent=message;
  }
  function mount(){
    if(document.getElementById("tbDemoBanner"))return;
    var style=document.createElement("style");style.textContent=
      "#tbDemoBanner{position:fixed;z-index:2147483646;right:12px;bottom:12px;max-width:min(440px,calc(100vw - 24px));background:#171735;color:#f3edff;padding:11px 14px;border:1px solid #9782ff;border-radius:13px;box-shadow:0 12px 40px #0009;font:600 12px/1.45 system-ui,sans-serif;display:flex;align-items:center;gap:12px;flex-wrap:wrap}" +
      "#tbDemoBanner button{cursor:pointer;border:1px solid #a69cff;background:#5848bc;color:white;border-radius:9px;padding:8px 12px;font:700 12px system-ui}" +
      "#tbDemoNotice{flex-basis:100%;font-weight:400;color:#b7cafa}" +
      "@media(max-width:760px){#tbDemoBanner{left:8px;right:8px;bottom:8px;justify-content:center}}";
    document.head.append(style);
    banner=document.createElement("aside");banner.id="tbDemoBanner";banner.setAttribute("aria-label","Chế độ demo an toàn");
    var text=document.createElement("span");text.textContent="DEMO ADMIN • dữ liệu giả • không kết nối API thật";
    var reset=document.createElement("button");reset.type="button";reset.textContent="Làm lại Demo";
    reset.addEventListener("click",function(){location.reload();});
    var live=document.createElement("span");live.id="tbDemoNotice";live.setAttribute("role","status");live.textContent="Thay đổi chỉ tồn tại trong phiên xem này.";
    banner.append(text,reset,live);document.body.append(banner);
  }
  document.addEventListener("click",function(event){
    var link=event.target.closest("a[href]");
    if(!link)return;
    var href=link.getAttribute("href")||"";
    if(href.startsWith("#") || href==="")return;
    event.preventDefault();event.stopImmediatePropagation();
    blocked++;notify("Đường dẫn ngoài Demo đã được chặn; không chuyển đến trang thật.");
  },true);
  // Auto-login through the unchanged legacy form with a non-secret fake token.
  var loginAttempts=0;
  function boot(){
    mount();
    // The main V5 loader is appended after document.close(). In the
    // synthetic Demo, initialize the category UI from the finished document
    // too, in case the outer async loader has already yielded.
    if(document.getElementById("adminApp")&&!document.getElementById("tb5Categories")&&!document.querySelector('script[data-tb5-demo-loader]')){
      var script=document.createElement("script");
      script.src="/admin-six-groups-v5.js?v=1";
      script.dataset.tb5DemoLoader="true";
      document.body.appendChild(script);
    }
    var app=document.getElementById("adminApp");
    if(app && !app.classList.contains("hidden")){
      notify("Đã vào Demo bằng token giả. Có thể thử lưu nháp và Beta.");
      return;
    }
    var input=document.getElementById("adminToken"),button=document.querySelector('#loginForm button[type="submit"]');
    if(input && button){input.value=TOKEN;button.click();}
    if(++loginAttempts<20)window.setTimeout(boot,350);
    else notify("Demo chưa mở được Dashboard; vui lòng báo lỗi để kiểm tra khởi tạo.");
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  Object.defineProperty(window,"__TRAININGBOT_DEMO__",{
    value:{getPosts:function(){return clone(posts);},getBetas:function(){return clone(betas);},
      getWrites:function(){return clone(writes);},getBlockedCount:function(){return blocked;}},
    configurable:false
  });
})();
