import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5195/';const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5195','--strictPort'],{stdio:'ignore'});let browser;
try{
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await pause(100);}assert.ok(ready);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
 for(const [width,touch] of [[320,true],[820,true],[1440,false]]){
  const context=await browser.newContext({viewport:{width,height:1100},hasTouch:touch,isMobile:touch});const page=await context.newPage();await page.goto(base);
  await page.evaluate(async()=>{const {mathExercise}=await import('/src/modules/mathlab/index.ts');document.body.replaceChildren();const root=document.createElement('main');root.style.padding='12px';document.body.append(root);window.disposeBuilder=mathExercise('builder')(root,{profile:{id:'splitter-test'}});});
  const rail=page.locator('.ml-splitter'),input=page.getByRole('slider',{name:'Первая часть'});await rail.evaluate(el=>el.scrollIntoView({block:'center'}));await page.waitForTimeout(80);
  const box=()=>rail.boundingBox();const value=async n=>{await page.waitForFunction(n=>document.querySelector('.ml-splitter input').value===String(n),n,{timeout:1000});assert.equal(await input.inputValue(),String(n));};
  const point=async(p,y=28)=>{const r=await box();return{x:r.x+r.width*p,y:r.y+y};};
  const tap=async(p,y=28)=>{const pos=await point(p,y);if(touch)await page.touchscreen.tap(pos.x,pos.y);else await page.mouse.click(pos.x,pos.y);};
  await tap(.25);await value(2);await tap(.75);await value(6);await tap(0);await value(0);await tap(1);await value(8);
  await tap(.625,74);await value(5); // Numbered row below the painted track.
  const a=await point(.25),b=await point(.75,40);let cdp;
  if(touch){cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...a,id:1,force:.01,radiusX:2,radiusY:2}]});}
  else{await page.mouse.move(a.x,a.y);await page.mouse.down();}
  await value(2);assert.ok(await rail.evaluate(el=>el.classList.contains('is-dragging')),'first contact accepted without pressure or movement');
  if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...b,id:1,force:.01}]});else await page.mouse.move(b.x,b.y,{steps:5});
  await value(6);assert.equal(await page.locator('.ml-split-handle').evaluate(el=>getComputedStyle(el).transitionDuration),'0s','handle follows immediately');
  const partial=await point(.79,40);
  if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...partial,id:1,force:.01}]});else await page.mouse.move(partial.x,partial.y);
  await value(6);await page.waitForFunction(x=>{const r=document.querySelector('.ml-split-handle').getBoundingClientRect();return Math.abs(r.x+r.width/2-x)<2;},partial.x,{timeout:1000});
  const outsideRight=await point(1.02,80),outsideLeft=await point(-.02,-15);
  for(const [p,n] of [[outsideRight,8],[outsideLeft,0]]){
   if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...p,id:1,force:.01}]});else await page.mouse.move(p.x,p.y,{steps:3});await value(n);
  }
  if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();
  assert.ok(!await rail.evaluate(el=>el.classList.contains('is-dragging')));
  if(touch){const p=await point(.5);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1,force:.01}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.ok(!await rail.evaluate(el=>el.classList.contains('is-dragging')));await tap(.125);await value(1);}
  await input.focus();await page.keyboard.press('Home');await value(0);await page.keyboard.press('ArrowRight');await value(1);await page.keyboard.press('End');await value(8);
  await page.getByLabel('Целое число',{exact:true}).fill('6');await page.getByLabel('Целое число',{exact:true}).press('Tab');await rail.evaluate(el=>el.scrollIntoView({block:'center'}));await page.waitForTimeout(80);await tap(.5);await value(3);assert.ok((await page.locator('.ml-equation').innerText()).includes('6 = 3 + 3'));
  assert.ok(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'no horizontal overflow');
  if(touch){const p=await point(.5);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1,force:.01}]});await page.evaluate(()=>disposeBuilder());assert.ok(!await rail.evaluate(el=>el.classList.contains('is-dragging')));await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else await page.evaluate(()=>disposeBuilder());
  await context.close();console.log(`Splitter ${width}px ${touch?'touch':'mouse'}: track/number taps, light contact, drag, cancel, endpoints, keyboard and changed whole passed`);
 }
}finally{await browser?.close();server.kill('SIGTERM');}
