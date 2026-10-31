import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5192/';const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5192','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await pause(100);}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
 for(const color of ['green','blue','purple','amber','red']){
  const page=await browser.newPage();await page.goto(base);
  await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.evaluate(async color=>{
   const {mountMotorics}=await import('/src/modules/motorics.ts');const {DEFAULT_CALIBRATION}=await import('/src/core/settings.ts');const {Session}=await import('/src/core/session.ts');
   const original=Session.prototype.record;window.records=[];Session.prototype.record=function(data){if(this.mode==='signal')window.records.push(data);return original.call(this,data);};
   const index=['blue','purple','amber','red'].indexOf(color);let call=0;Math.random=()=>{const values=color==='green'?[0,0]:[0,.9,(index+.1)/4];return values[call++%values.length];};
   document.body.replaceChildren();const root=document.createElement('main');document.body.append(root);window.dispose=mountMotorics(root,{calibration:DEFAULT_CALIBRATION,profile:{id:'signal-scoring',name:'Test'}});
   [...root.querySelectorAll('button')].find(b=>b.textContent==='Сигнал').click();
   window.start=()=>[...root.querySelectorAll('button')].find(b=>b.textContent==='Старт').click();
   window.contact=(options={})=>root.querySelector('cg-board').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,isPrimary:true,...options}));
   window.start();
  },color);
  // IndexedDB startup is asynchronous; allow it to complete while the exercise clock is paused.
  await pause(100);await page.clock.runFor(700);
  assert.ok(await page.locator('.signal-pulse').count(),'stimulus shown');
  // Secondary pointers and right clicks never score.
  await page.evaluate(()=>{contact({isPrimary:false});contact({button:2});});assert.equal(await page.evaluate(()=>records.length),0);
  await page.clock.runFor(100);await page.evaluate(()=>contact());
  assert.equal(await page.evaluate(()=>records[0].outcome),color==='green'?'hit':'falseAlarm');
  assert.equal(await page.locator('.signal-pulse').count(),0,'resolved color is immediately hidden');
  assert.equal(await page.locator('.side.signal-live').count(),0,'old flash timer no longer owns next state');
  const rt=await page.evaluate(()=>records[0].reactionMs);assert.equal(rt,color==='green'?100:null);
  // A new independent press before the next signal is a separate false start.
  await page.evaluate(()=>contact());assert.deepEqual(await page.evaluate(()=>records.map(r=>r.outcome)),[color==='green'?'hit':'falseAlarm','falseStart']);
  await page.clock.runFor(700);await page.clock.runFor(700);
  assert.equal(await page.evaluate(()=>records.at(-1).outcome),color==='green'?'miss':'correctIgnore');
  const previous=await page.evaluate(()=>records.length);await page.clock.runFor(700);
  // The flash lasts 250 ms, but reaction is accepted until 700 ms.
  await page.clock.runFor(300);assert.equal(await page.locator('.side.signal-live').count(),0);await page.evaluate(()=>contact());
  assert.equal(await page.evaluate(()=>records.at(-1).outcome),color==='green'?'hit':'falseAlarm');assert.equal(await page.evaluate(()=>records.length),previous+1);
  await page.clock.runFor(700);
  await page.evaluate(()=>{const descriptor=Object.getOwnPropertyDescriptor(performance,'now');const now=performance.now.bind(performance);Object.defineProperty(performance,'now',{configurable:true,value:()=>now()+701});try{contact();}finally{if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete performance.now;}});
  assert.equal(await page.evaluate(()=>records.at(-1).outcome),color==='green'?'miss':'correctIgnore','late event cannot become an in-window answer while timeout is delayed');
  await page.evaluate(()=>{[...document.querySelectorAll('button')].find(b=>b.textContent==='Прервать').click();});await pause(100);const stopped=await page.evaluate(()=>records.length);
  await page.clock.runFor(5000);await page.evaluate(()=>contact());assert.equal(await page.evaluate(()=>records.length),stopped,'stop clears scoring timers');
  if(color==='green'){
   const initial=await page.evaluate(()=>records.length);await page.evaluate(()=>window.start());await pause(100);await page.clock.runFor(56000);await pause(100);
   assert.equal(await page.evaluate(n=>records.length-n,initial),40,'exactly forty outcomes per full session');
   assert.equal(await page.evaluate(n=>records.slice(n).every(r=>r.outcome==='miss'),initial),true);
   assert.ok((await page.locator('.side').innerText()).includes('Сессия закончена'));
  }
  await page.evaluate(()=>dispose());await page.close();console.log(`${color}: correct classification, ignored secondary buttons, early press, no-response, post-flash response and stop passed`);
 }
}finally{await browser?.close();server.kill('SIGTERM');}
