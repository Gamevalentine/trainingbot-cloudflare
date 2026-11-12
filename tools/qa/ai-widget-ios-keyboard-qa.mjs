// iPhone keyboard regression gate for the in-page TrainingBot AI widget.
// Pure offline DOM/visualViewport simulation: never contacts Worker or costs quota.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const chatCss=fs.readFileSync('public/ai-widget.css','utf8');
const parentCss=fs.readFileSync('public/visitor-ai-widget-v2.css','utf8');
const chatJs=fs.readFileSync('public/ai-widget.js','utf8');
const parentJs=fs.readFileSync('public/visitor-ai-widget-v2.js','utf8');
const widgetFunction=fs.readFileSync('functions/ai-widget.js','utf8');

assert.match(chatCss,/\.tb-compose textarea\{[^}]*font-size:16px;/,
  'iOS input text must be at least 16px to avoid WebKit autozoom');
assert.doesNotMatch(chatCss,/\.tb-compose textarea\{[^}]*font:12px/,
  'old 12px input shorthand must be removed');
assert(!/user-scalable=no|maximum-scale=1/i.test(widgetFunction),
  'Do not disable user pinch zoom to mask a font-size defect');
assert.match(chatJs,/question\.addEventListener\("focus",\(\)=>notify\("input-focus"\)\)/);
assert.match(chatJs,/question\.addEventListener\("blur",\(\)=>notify\("input-blur"\)\)/);
assert.match(chatJs,/window\.matchMedia\?\.\("\(pointer:fine\)"\)/,
  'Only fine-pointer desktops receive programmatic input focus');
assert.match(parentCss,/\.tb-ai-popup\.tb-ai-keyboard\{/);
assert.match(parentCss,/--tb-ai-vv-height/);
assert.match(widgetFunction,/\/ai-widget\.css\?v=3/);
assert.match(widgetFunction,/\/ai-widget\.js\?v=4/);

function simulate({mobile}){
  const listener={},windowListener={},vvListener={};
  const classes=new Set(),properties=new Map(),timers=new Map();
  let nextTimer=0,frame=null;
  const trigger={isConnected:true,attributes:{},
    setAttribute(key,value){this.attributes[key]=value;},
    focus(){this.focused=true;}};
  const mount={append(child){frame=child;}};
  const backup={hidden:true};
  const panel={
    hidden:true,
    classList:{add(n){classes.add(n);},remove(n){classes.delete(n);},
      contains(n){return classes.has(n);}},
    style:{setProperty(k,v){properties.set(k,v);},removeProperty(k){properties.delete(k);}},
    querySelector(sel){return sel==='.tb-ai-frame-mount'?mount:
      sel==='.tb-ai-popup-backup'?backup:null;}
  };
  const viewport={height:760,width:390,offsetTop:0,offsetLeft:0,
    addEventListener(name,cb){vvListener[name]=cb;}};
  const pageOrigin='https://trainingbot.io.vn';
  const window={
    location:{origin:pageOrigin},innerHeight:760,visualViewport:viewport,
    matchMedia(){return {matches:mobile};},
    addEventListener(name,cb){windowListener[name]=cb;}
  };
  const document={
    getElementById(id){return id==='tb-ai-popup'?panel:null;},
    querySelectorAll(){return [trigger];},
    createElement(tag){assert.equal(tag,'iframe');return {
      attributes:{},contentWindow:{postMessage(){}},
      setAttribute(k,v){this.attributes[k]=v;}
    };},
    addEventListener(name,cb){listener[name]=cb;}
  };
  const setTimeout=(cb,delay)=>{const id=++nextTimer;timers.set(id,{cb,delay});return id;};
  const clearTimeout=id=>timers.delete(id);
  vm.runInNewContext(parentJs,{document,window,setTimeout,clearTimeout},
    {timeout:1500,filename:'visitor-ai-widget-v2.js'});
  function message(type){
    windowListener.message({origin:pageOrigin,source:frame.contentWindow,
      data:{source:'trainingbot-ai-widget',event:type}});
  }
  listener.click({target:{closest(){return trigger;}},preventDefault(){},
    ctrlKey:false,metaKey:false,altKey:false,shiftKey:false});
  assert.equal(panel.hidden,false,'Robot opens inline panel');
  assert.equal(frame.src,'/ai-widget');
  assert(!classes.has('tb-ai-keyboard'),'Chat open alone must not trigger keyboard mode');
  message('ready');
  viewport.height=420;viewport.offsetTop=27;
  vvListener.resize();
  assert(!classes.has('tb-ai-keyboard'),'No textarea focus = no keyboard mode');
  viewport.height=760;viewport.offsetTop=0;vvListener.resize();
  message('input-focus');
  viewport.height=420;viewport.offsetTop=27;vvListener.resize();
  if(mobile){
    assert(classes.has('tb-ai-keyboard'),
      'On mobile the input-focus event must enable keyboard-safe panel');
    assert.equal(properties.get('--tb-ai-vv-top'),'33px');
    assert.equal(properties.get('--tb-ai-vv-height'),'408px');
    assert.equal(properties.get('--tb-ai-vv-width'),'378px');
  }else{
    assert(!classes.has('tb-ai-keyboard'),'Desktop layout remains untouched');
  }
  message('input-blur');
  const blur=[...timers.values()].find(x=>x.delay===250);
  assert(blur,'Blur should allow Safari keyboard closing animation');
  blur.cb();
  assert(!classes.has('tb-ai-keyboard'),'Panel resets after keyboard is dismissed');
  viewport.height=760;viewport.offsetTop=0;vvListener.resize();
  message('close');
  assert(panel.hidden&&trigger.attributes['aria-expanded']==='false');
  assert(trigger.focused,'Close returns focus to native robot button');
  assert.equal(properties.size,0,'No visual-viewport CSS overrides after closing');
}
simulate({mobile:true});
simulate({mobile:false});
console.log('PASS: 16px iOS input, no forced phone focus, live keyboard visualViewport reposition, desktop unaffected, popup closes cleanly');
