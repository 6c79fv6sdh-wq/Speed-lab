import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5192/';const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5192','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await pause(100);}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
 for(const color of ['green','blue','purple','amber','red']){
  const page=await browser.newPage({hasTouch:true,viewport:{width:820,height:1180}});await page.goto(base,{waitUntil:'networkidle'});
  await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.evaluate(async color=>{
   const {mountMotorics}=await import('/src/modules/motorics.ts');const {DEFAULT_CALIBRATION}=await import('/src/core/settings.ts');const {Session}=await import('/src/core/session.ts');
   const original=Session.prototype.record;window.records=[];Session.prototype.record=function(data){if(this.mode==='signal')window.records.push(data);return original.call(this,data);};
   const index=['blue','purple','amber','red'].indexOf(color);let call=0;Math.random=()=>{const values=color==='green'?[0,0]:[0,.9,(index+.1)/4];return values[call++%values.length];};
   document.body.replaceChildren();const root=document.createElement('main');document.body.append(root);window.dispose=mountMotorics(root,{calibration:DEFAULT_CALIBRATION,profile:{id:'signal-scoring',name:'Test'}});
   [...root.querySelectorAll('button')].find(b=>b.textContent==='Сигнал').click();
   window.start=()=>[...root.querySelectorAll('button')].find(b=>b.textContent==='Старт').click();
   window.contact=(options={},stamp=performance.now())=>{const event=new PointerEvent('pointerdown',{bubbles:true,button:0,isPrimary:true,pointerType:'touch',pressure:.01,...options});Object.defineProperty(event,'timeStamp',{value:stamp});root.querySelector('cg-board').dispatchEvent(event);};
   window.shows=[];const overlay=root.querySelector('.signal-overlay');new MutationObserver(()=>{if(overlay.classList.contains('signal-pulse'))window.shows.push(performance.now());}).observe(overlay,{attributes:true,attributeFilter:['class']});
   window.start();
  },color);
  await pause(100);
  const outcomes=()=>page.evaluate(()=>records.map(r=>r.outcome));
  const next=async()=>{const before=await page.evaluate(()=>shows.length);for(let i=0;i<180;i++){await page.clock.runFor(16);if(await page.evaluate(n=>shows.length>n,before))return;}throw Error('No next stimulus');};
  const since=async ms=>{const elapsed=await page.evaluate(()=>performance.now()-shows.at(-1));if(ms>elapsed)await page.clock.runFor(Math.ceil(ms-elapsed));};
  await page.evaluate(()=>{contact();contact();});assert.deepEqual(await outcomes(),['falseStart'],'repeated early contact counted once');
  await next();await since(100);
  await page.evaluate(()=>{contact({isPrimary:false});contact({button:2});});assert.equal((await outcomes()).length,1);
  await page.evaluate(()=>contact());assert.equal((await outcomes()).at(-1),color==='green'?'hit':'falseAlarm');
  if(color==='green')assert.ok(Math.abs(await page.evaluate(()=>records.at(-1).reactionMs)-100)<=1);
  assert.equal(await page.locator('.signal-pulse').count(),0,'resolved signal disappears immediately');
  await page.evaluate(()=>{contact();contact();});assert.equal((await outcomes()).length,2,'double touch after an answer is not a false start');
  await page.clock.runFor(260);await page.evaluate(()=>contact());assert.equal((await outcomes()).at(-1),'falseStart','genuine independent early press still penalized');
  await next();const before=(await outcomes()).length;await since(750);assert.equal((await outcomes()).at(-1),color==='green'?'miss':'correctIgnore');
  await page.evaluate(()=>contact());assert.equal((await outcomes()).length,before+1,'late contact cannot add a false start to the same missed stimulus');
  await next();await since(300);assert.equal(await page.locator('.side.signal-live').count(),0);await page.evaluate(()=>contact());assert.equal((await outcomes()).at(-1),color==='green'?'hit':'falseAlarm','response after visual flash still accepted in 700 ms window');
  await next();const stale=(await outcomes()).length;await page.evaluate(()=>contact({},shows.at(-1)-5));assert.equal((await outcomes()).length,stale+1);assert.equal((await outcomes()).at(-1),'falseStart');assert.equal(await page.locator('.signal-pulse').count(),1,'queued early contact does not consume a newly shown stimulus');await since(100);await page.evaluate(()=>contact());assert.equal((await outcomes()).at(-1),color==='green'?'hit':'falseAlarm');
  await next();const pending=(await outcomes()).length;await page.evaluate(()=>{const at=shows.at(-1);setTimeout(()=>contact({},at+650),700-(performance.now()-at));});await since(720);assert.equal((await outcomes()).length,pending+1);assert.equal((await outcomes()).at(-1),color==='green'?'hit':'falseAlarm','queued timely contact is processed before timeout is committed');
  await next();await page.evaluate(()=>{const old=performance.now.bind(performance),at=shows.at(-1);Object.defineProperty(performance,'now',{configurable:true,value:()=>at+750});try{contact({},at+650);}finally{Object.defineProperty(performance,'now',{configurable:true,value:old});}});assert.equal((await outcomes()).at(-1),color==='green'?'hit':'falseAlarm','timestamp of queued timely touch wins over handler delay');
  await next();await page.evaluate(()=>{const old=performance.now.bind(performance),at=shows.at(-1);Object.defineProperty(performance,'now',{configurable:true,value:()=>at+750});try{contact({},at+750);}finally{Object.defineProperty(performance,'now',{configurable:true,value:old});}});assert.equal((await outcomes()).at(-1),color==='green'?'miss':'correctIgnore','actually late input remains late even with busy main thread');
  await next();await since(100);const paused=(await outcomes()).length;await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(3000);assert.equal((await outcomes()).length,paused,'backgrounding does not add errors');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await next();await since(100);await page.evaluate(()=>contact());assert.equal((await outcomes()).length,paused+1,'resumed trial scores once');
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Прервать').click());await pause(100);const stopped=(await outcomes()).length;await page.clock.runFor(5000);await page.evaluate(()=>contact());assert.equal((await outcomes()).length,stopped,'stop cancels timers and animation frames');
  if(color==='green'){await page.evaluate(()=>start());await pause(100);await page.clock.runFor(80000);await pause(100);assert.equal((await outcomes()).length-stopped,40,'forty outcomes per complete session');assert.ok(await page.evaluate(n=>records.slice(n).every(r=>r.outcome==='miss'),stopped));}
  await page.evaluate(()=>dispose());await page.close();console.log(`${color}: light contact, recovery, true false starts, flash/window timing, queued input, timeout, visibility and cleanup passed`);
 }
 // Native browser touch, without a mocked clock or synthetic pointer timestamp.
 const page=await browser.newPage({hasTouch:true,viewport:{width:820,height:1180}});await page.goto(base,{waitUntil:'networkidle'});
 await page.evaluate(async()=>{const {mountMotorics}=await import('/src/modules/motorics.ts');const {DEFAULT_CALIBRATION}=await import('/src/core/settings.ts');const {Session}=await import('/src/core/session.ts');window.records=[];const old=Session.prototype.record;Session.prototype.record=function(data){if(this.mode==='signal')records.push(data);return old.call(this,data);};Math.random=()=>0;document.body.replaceChildren();const root=document.createElement('main');document.body.append(root);window.dispose=mountMotorics(root,{calibration:DEFAULT_CALIBRATION,profile:{id:'native-signal'}});[...root.querySelectorAll('button')].find(b=>b.textContent==='Сигнал').click();[...root.querySelectorAll('button')].find(b=>b.textContent==='Старт').click();});
 await page.locator('.signal-pulse').waitFor();const box=await page.locator('cg-board').boundingBox();await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);assert.deepEqual(await page.evaluate(()=>records.map(r=>r.outcome)),['hit']);await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);assert.equal(await page.evaluate(()=>records.length),1);await page.evaluate(()=>dispose());await page.close();console.log('Native tablet touch: green hit and duplicate suppression passed');
}finally{await browser?.close();server.kill('SIGTERM');}
