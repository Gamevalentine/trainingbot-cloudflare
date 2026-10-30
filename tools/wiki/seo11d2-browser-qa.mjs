import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const root='http://127.0.0.1:18996';
const server=spawn('python3',['-m','http.server','18996','--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
let browser;const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function openCard(page,kind,names){
 await page.locator('#tbWikiTabs .tb-wiki-tab[data-tab="'+kind+'"]').evaluate(el=>el.click());
 await page.waitForFunction((k)=>document.querySelector('#tbWikiTabs .tb-wiki-tab.active')?.dataset.tab===k,kind);
 const found=await page.evaluate(names=>{
  const cards=[...document.querySelectorAll('#tbWikiGrid .tb-wiki-card')];
  const card=cards.find(x=>names.includes(x.querySelector('h3')?.textContent?.trim()));
  if(!card) return {missing:cards.map(x=>x.querySelector('h3')?.textContent?.trim())};
  card.click();return {name:card.querySelector('h3')?.textContent?.trim()};
 },names);
 assert(!found.missing,'Missing '+names+'; available '+JSON.stringify(found.missing||[]));
 await page.waitForFunction(()=>document.querySelector('#tbWikiModal.open .tb-d-panel')||document.querySelector('.tb-v145.open'),undefined,{timeout:8000});
 return found.name;
}
try{
 await delay(700);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:920},reducedMotion:'reduce'}),errors=[],writes=[];
  await ctx.route('**/*',route=>{
   const req=route.request(),u=new URL(req.url());
   if(u.pathname.startsWith('/api/')){
    if(req.method()!=='GET'&&req.method()!=='HEAD'&&!(req.method()==='POST'&&u.pathname==='/api/visitor-events'))writes.push(req.method()+' '+u.pathname);
    return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});
   }
   return u.origin===root?route.continue():route.abort();
  });
  const page=await ctx.newPage();page.on('pageerror',err=>errors.push(err.message));
  try{
   await page.goto(root+'/wiki.html',{waitUntil:'domcontentloaded',timeout:25000});
   await page.waitForFunction(()=>window.__TB_WIKI_D__?.ready&&DATA.weapons.length===61&&DATA.attachments.length===51,{timeout:17000});
   assert.equal(await page.locator('#tb-wiki-seo-overview').count(),1,'Prior SEO-11.D overview must survive Wiki hydration');
   assert.equal(await page.locator('#tb-wiki-nguon-kiem-chung article').count(),4,'Versioned source cards must survive Wiki hydration');
   assert.equal(await page.locator('#tb-wiki-nguon-kiem-chung a').count(),4);
   await openCard(page,'attachments',['Bộ chuyển chế độ tự động','Full-Auto Mod']);
   await page.waitForFunction(()=>document.querySelector('#tbWikiModal .tb-d-release')?.textContent?.includes('M16A4'),undefined,{timeout:8000});
   let text=await page.locator('#tbWikiModal .tb-d-release').textContent();
   console.log('D2_MOD_DIAGNOSTIC',JSON.stringify(await page.locator('#tbWikiModal .tb-d-release').evaluate(el=>({modalClass:el.closest('#tbWikiModal')?.className,display:getComputedStyle(el).display,visible:!!el.getClientRects().length,text:el.textContent?.slice(0,380)}))));
   assert(text.includes('Mk47')&&text.includes('2.6')&&text.includes('hiện hành'),'Historical Mod pairing missing '+text);
   assert.equal(await page.locator('#tbWikiModal .tb-d-release a').getAttribute('href'),'https://www.pubgmobile.com/en/event/260Devnotes/');
   await page.locator('#tbWikiModalClose').click();
   await openCard(page,'attachments',['Khiên súng','Gun Shield']);
   await page.waitForFunction(()=>document.querySelector('#tbWikiModal .tb-d-release')?.textContent?.includes('DP-28'),undefined,{timeout:8000});
   text=await page.locator('#tbWikiModal .tb-d-release').textContent();
   assert(text.includes('M249')&&text.includes('2.5'),'Gun Shield pairing missing '+text);
   assert.equal(await page.locator('#tbWikiModal .tb-d-release a').getAttribute('href'),'https://www.pubgmobile.com/id/event/Imagiversary/');
   await page.locator('#tbWikiModalClose').click();
   await page.locator('#tbWikiTabs .tb-wiki-tab[data-tab="vehicles"]').evaluate(el=>el.click());
   await page.waitForFunction(()=>document.querySelector('#tbDSourceSummary')?.textContent?.includes('Thuyền Cao Su'),undefined,{timeout:8500});
   assert((await page.locator('#tbDSourceSummary').innerText()).includes('4 chỗ'));
   await openCard(page,'weapons',['ACE32']);
   await page.waitForFunction(()=>[...document.querySelectorAll('.tb-v145.open .tb-v145-stat')].some(s=>s.textContent.includes('Sát thương cơ bản (4.6)')&&s.textContent.includes('47')),undefined,{timeout:8500});
   assert.equal(await page.locator('#tb-wiki-nguon-kiem-chung').count(),1);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert(overflow<6,'Unexpected overflow '+overflow+' at '+width);
   assert.deepEqual(writes,[],'unexpected API writes');
   assert.deepEqual(errors,[],'JS error in wiki');
   console.log('SEO-11.D.2 browser '+width+'px PASS: historic compatibility, ACE32 release-tagged, missing boat, no writes');
  }finally{await ctx.close();}
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
