import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5190/';const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5190','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await pause(100);}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--autoplay-policy=user-gesture-required']});
 for(const touch of [false,true]){
  const context=await browser.newContext({viewport:{width:820,height:1180},hasTouch:touch,isMobile:touch});const page=await context.newPage();await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{
   const {mountAdditionFlow}=await import('/src/modules/mathlab/addition-flow.ts');const {setMoveSoundEnabled}=await import('/src/core/move-sound.ts');setMoveSoundEnabled(true);
   window.sounds=[];const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){window.sounds.push(this.playbackRate.value);return start.apply(this,args);};
   document.body.replaceChildren();const root=document.createElement('main');root.style.padding='16px';document.body.append(root);window.dispose=mountAdditionFlow(root,{profile:{id:'flow-sound-test'}});
  });
  const tap=async locator=>{if(touch)await locator.tap();else await locator.click();await page.waitForTimeout(65);};
  const answer=n=>page.locator(`.ml-keypad [data-value="${n}"]`);const sounds=()=>page.evaluate(()=>window.sounds.length);
  assert.equal(await sounds(),0);await tap(answer(0));assert.equal(await sounds(),1,'first answer sounds once');
  await tap(answer(0));assert.equal(await sounds(),2,'each separate wrong answer sounds once');
  const sum=(await page.locator('.ml-equation').innerText()).match(/\d+/g).map(Number).reduce((a,b)=>a+b,0);await tap(answer(sum));assert.equal(await sounds(),3,'correct answer sounds once');
  await page.evaluate(n=>document.querySelector(`.ml-keypad [data-value="${n}"]`).click(),sum);assert.equal(await sounds(),3,'locked answer silent');
  await page.waitForFunction(()=>document.querySelector('.ml-flow-feedback').textContent==='');assert.equal(await sounds(),3,'automatic next silent');assert.ok(await page.evaluate(()=>sounds.every(rate=>Math.abs(rate-.9)<1e-5)),'full answer click used');
  const toggle=page.getByRole('button',{name:'Звук нажатий',exact:true});await tap(toggle);assert.equal(await toggle.getAttribute('aria-pressed'),'false');assert.equal(await sounds(),3);await tap(answer(0));assert.equal(await sounds(),3,'muted answer silent');
  await tap(toggle);assert.equal(await toggle.getAttribute('aria-pressed'),'true');assert.equal(await sounds(),4,'enable preview once');await tap(answer(0));assert.equal(await sounds(),5,'sound restored');
  await tap(toggle);await page.reload({waitUntil:'networkidle'});assert.equal(await page.evaluate(async()=>(await import('/src/core/move-sound.ts')).moveSoundEnabled()),false,'mute shared and persisted');
  console.log(`${touch?'touch':'mouse'}: first press, correct/wrong sound once, silent lock/automatic next, toggle and persisted mute passed`);await context.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');}
