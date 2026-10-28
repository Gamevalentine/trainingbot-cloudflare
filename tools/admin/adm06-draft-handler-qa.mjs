// ADM-06: real Admin and public Pages Functions over a disposable in-memory D1.
// Uses actual handler code, no Cloudflare secrets, networks or persisted DB.
import fs from "node:fs";
import assert from "node:assert/strict";
const mod=async p=>import("data:text/javascript;base64,"+Buffer.from(fs.readFileSync(p,"utf8")).toString("base64"));
const admin=await mod("functions/api/v71/admin/posts.js");
const pub=await mod("functions/api/posts.js");
const article=await mod("functions/bai-viet/[slug].js");
const TOKEN="STAGE_C_FAKE_TOKEN";
function fakeDB(){
 const rows=new Map(),log=[];
 return {
  rows,log,
  prepare(sql){
   let args=[];
   return {
    bind(...v){args=v;return this;},
    async first(){
     log.push(["first",sql,args]);
     if(sql.includes("SELECT 1 FROM tb_manual_posts_v1"))return [...rows.values()].some(x=>x.slug===args[0])?{yes:1}:null;
     if(sql.includes("WHERE id=? LIMIT 1"))return rows.get(args[0])||null;
     if(sql.includes("WHERE slug=? AND status='published'"))return [...rows.values()].find(x=>x.slug===args[0]&&x.status==="published")||null;
     return null;
    },
    async all(){
     log.push(["all",sql,args]);
     if(sql.includes("PRAGMA table_info"))return {results:[{name:"featured_at"},{name:"rich_content"}]};
     if(sql.includes("SELECT")&&sql.includes("tb_manual_posts_v1")){
      let result=[...rows.values()];
      if(sql.includes("status='published'"))result=result.filter(x=>x.status==="published");
      return {results:result};
     }
     return {results:[]};
    },
    async run(){
     log.push(["run",sql,args]);
     if(sql.includes("INSERT INTO tb_manual_posts_v1")){
      const [id,slug,title,summary,content,rich_content,category,cover_url,status,created_at,updated_at,published_at]=args;
      rows.set(id,{id,slug,title,summary,content,rich_content,category,cover_url,status,featured_at:"",created_at,updated_at,published_at});
     }else if(sql.includes("UPDATE tb_manual_posts_v1 SET title")){
      const [title,summary,content,rich_content,category,cover_url,status,featured_at,published_at,updated_at,id]=args;
      const row=rows.get(id);if(!row)throw Error("Missing row "+id);
      Object.assign(row,{title,summary,content,rich_content,category,cover_url,status,featured_at,published_at,updated_at});
     }else if(sql.includes("UPDATE tb_manual_posts_v1 SET featured_at")){
      const [featured_at,updated_at,id]=args;if(rows.has(id))Object.assign(rows.get(id),{featured_at,updated_at});
     }
     return {success:true,meta:{changes:1}};
    }
   };
  }
 };
}
const db=fakeDB(),env={DB:db,ADMIN_TOKEN:TOKEN};
const request=(method,body,auth=TOKEN,path="/api/v71/admin/posts")=>new Request("http://localhost"+path,{
 method,headers:{"Authorization":"Bearer "+auth,...(body?{"Content-Type":"application/json"}:{})},
 body:body?JSON.stringify(body):undefined
});
const ctx=(req)=>({env,request:req});
const payload={title:"Bản thử nghiệm Admin C",content:"Nội dung giả lập đủ dài để lưu nháp và kiểm tra chức năng xuất bản.",category:"Tin mới",summary:"Bài kiểm tra giả lập",status:"draft"};
const denied=await admin.onRequestPost(ctx(request("POST",payload,"BAD")));
assert.equal(denied.status,401);
assert.equal(db.log.length,0,"Invalid token reached the database");
const create=await admin.onRequestPost(ctx(request("POST",payload)));
assert.equal(create.status,201);
const d=await create.json();assert.equal(d.post.status,"draft");assert.equal(d.post.url,"");
const id=d.post.id,slug=d.post.slug;
assert.equal(db.rows.get(id).status,"draft");
const list=await admin.onRequestGet(ctx(request("GET")));
assert.equal((await list.json()).posts[0].status,"draft");
const publicList=await pub.onRequestGet({env,request:new Request("http://localhost/api/posts")});
assert.equal((await publicList.json()).posts.length,0,"Draft leaked to public listing");
const draftArticle=await article.onRequestGet({env,params:{slug}});
assert.equal(draftArticle.status,404,"Draft leaked to public article");
const update={...payload,id,title:"Tiêu đề đã biên tập",status:"published"};
const publish=await admin.onRequestPatch(ctx(request("PATCH",update)));
assert.equal(publish.status,200);
assert.equal((await publish.json()).post.status,"published");
assert(db.rows.get(id).published_at,"Published timestamp missing");
const publicAfter=await pub.onRequestGet({env,request:new Request("http://localhost/api/posts")});
assert.equal((await publicAfter.json()).posts.length,1,"Published article missing from public listing");
const articleAfter=await article.onRequestGet({env,params:{slug}});
assert.equal(articleAfter.status,200);
const back=await admin.onRequestPatch(ctx(request("PATCH",{...update,status:"draft"})));
assert.equal(back.status,200);
assert.equal((await back.json()).post.url,"");
const listAfter=await pub.onRequestGet({env,request:new Request("http://localhost/api/posts")});
assert.equal((await listAfter.json()).posts.length,0);
assert.equal((await article.onRequestGet({env,params:{slug}})).status,404);
const featureDraft=await admin.onRequestPatch(ctx(request("PATCH",{id,featured:true})));
assert.equal(featureDraft.status,409,"Draft should not be featured");
const badState=await admin.onRequestPatch(ctx(request("PATCH",{...update,status:"deleted"})));
assert.equal(badState.status,400,"Invalid status accepted");
const oldStatus=await admin.onRequestGet(ctx(request("GET",null,TOKEN,"/api/v71/admin/posts?id="+encodeURIComponent(id))));
assert.equal((await oldStatus.json()).post.status,"draft");
console.log("ADM-06 real handler test: auth, create draft, public 404, publish, unpublish, featured guard, invalid status: PASS");
console.log("All D1 operations confined to local disposable Map; no real network/DB");
