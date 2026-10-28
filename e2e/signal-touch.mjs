import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5196/';const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5196','--strictPort'],{stdio:'ignore'});let browser;
try{
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await pause(100);}assert.ok(ready,'server');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
 const context=await browser.newContext({viewport:{width:820,height:1180},hasTouch:true,isMobile:true});const page=await context.newPage();await page.goto(base);
 await page.evaluate(async()=>{
  const {mountMotorics}=await import('/src/modules/motorics.ts');const {DEFAULT_CALIBRATION}=await import('/src/core/settings.ts');
  document.body.replaceChildren();const root=document.createElement('main');root.style.padding='20px';document.body.append(root);
  // Always green, shortest normal gap. Keep actual DOM, gesture and audio handling.
  Math.random=()=>0;window.soundStarts=0;const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){window.soundStarts++;return start.apply(this,args);};
  window.unmountSignal=mountMotorics(root,{calibration:DEFAULT_CALIBRATION,profile:{id:'signal-touch',name:'Test'}});
 });
 await page.getByRole('button',{name:'Сигнал',exact:true}).tap();await page.getByRole('button',{name:'Старт',exact:true}).tap();
 const cdp=await context.newCDPSession(page);
 for(const [xFraction,yFraction,force] of [[.5,.5,.01],[.03,.03,.02],[.97,.97,.01]]){
  await page.locator('.side.signal-live').waitFor();const board=page.locator('cg-board');await board.scrollIntoViewIfNeeded();const rect=await board.boundingBox();
  const x=rect.x+rect.width*xFraction,y=rect.y+rect.height*yFraction;const before=await page.evaluate(()=>soundStarts);
  const previous=await page.locator('.side .metrics-note').innerText();
  const hits=page.locator('.side .metric').filter({has:page.locator('.metric-k',{hasText:'Верно'})}).locator('.metric-v');const priorHits=Number(await hits.innerText());
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1,force,radiusX:2,radiusY:2}]});
  await page.waitForFunction(previous=>document.querySelector('.side .metrics-note').textContent!==previous,previous,{timeout:250});
  assert.notEqual(await page.locator('.side .metrics-note').innerText(),previous,'reaction registered before finger release');
  assert.equal(Number(await hits.innerText()),priorHits+1,'light touch scores a correct green reaction');
  assert.equal(await page.evaluate(()=>soundStarts),before+1,'audible feedback at contact, before release');
  const counted=await page.locator('.side .metrics-note').innerText();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+12,y,id:1,force,radiusX:2,radiusY:2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(50);
  assert.equal(await page.evaluate(()=>soundStarts),before+1,'release and slight drift do not double count or retract feedback');
  assert.equal(await page.locator('.side .metrics-note').innerText(),counted,'one recorded trial per contact');
  await page.locator('.side.signal-live').waitFor({state:'hidden'});
 }
 await page.getByRole('button',{name:'Прервать',exact:true}).tap();
 const before=await page.locator('.side').innerText();await page.locator('cg-board').tap();assert.equal(await page.locator('.side').innerText(),before,'idle touches do not submit');
 await page.evaluate(()=>unmountSignal());console.log('Signal: light contact at center and corners, immediate audio, drift/release deduplication and stop passed');
}finally{await browser?.close();server.kill('SIGTERM');}
