/* Offline regression for image-replace: no Cloudflare credentials or mutations. */
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile("functions/api/v71/admin/image-replace.js","utf8");
const url="data:text/javascript;base64,"+Buffer.from(source).toString("base64");
const {onRequestPost}=await import(url);
const makeRequest=(file,target="/user-posts/pubg-mobile-4-7-cap-nhat-mua-dong.png",auth="Bearer local-test")=>{
  const data=new FormData();
  data.set("target",target);
  data.set("file",file);
  return new Request("https://example.test/api/v71/admin/image-replace",{
    method:"POST",headers:{Authorization:auth},body:data
  });
};
const payload=new Uint8Array(2_750_000);
payload.set([137,80,78,71,13,10,26,10],0);
payload.set([17,21,31],payload.length-3);
const file=new File([payload],"PUBG Mobile 4.7_ Cập nhật mùa đông.png",{type:"image/png"});
let calls=0;
const env={
  ADMIN_TOKEN:"local-test",
  VIDEO_BUCKET:{
    async put(key,bytes,opts){
      calls++;
      assert.equal(key,"site-overrides/%2Fuser-posts%2Fpubg-mobile-4-7-cap-nhat-mua-dong.png");
      assert.ok(bytes instanceof ArrayBuffer,"R2 must receive an ArrayBuffer, never File.stream()");
      assert.equal(bytes.byteLength,payload.byteLength);
      assert.equal(new Uint8Array(bytes)[8],0);
      assert.equal(opts.httpMetadata.contentType,"image/png");
      assert.ok(opts.customMetadata.originalName.includes("%E1%BA%AD"),"Vietnamese filename must be safely encoded");
      return {etag:"test"};
    }
  }
};
const response=await onRequestPost({request:makeRequest(file),env});
assert.equal(response.status,200);
const body=await response.json();
assert.equal(body.ok,true);
assert.equal(body.url,"/user-posts/pubg-mobile-4-7-cap-nhat-mua-dong.png");
assert.equal(calls,1);
assert.equal((await onRequestPost({request:makeRequest(file,undefined,"Bearer incorrect"),env})).status,401);
assert.equal((await onRequestPost({request:makeRequest(file,"/user-posts/test.txt"),env})).status,400);
const empty=new File([],"trong.png",{type:"image/png"});
assert.equal((await onRequestPost({request:makeRequest(empty),env})).status,400);
const tooLarge=new File([new Uint8Array(12*1024*1024+1)],"big.png",{type:"image/png"});
assert.equal((await onRequestPost({request:makeRequest(tooLarge),env})).status,413);
assert.equal((await onRequestPost({request:makeRequest(file),env:{ADMIN_TOKEN:"local-test"}})).status,503);
console.log("PASS: R2 image upload (Unicode PNG 2.75 MB), binary length, auth, validation, size and binding checks");
