import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5194/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5194','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await pause(100);}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
 for(const [width,touch] of [[320,true],[820,true],[1440,false]]){
  const context=await browser.newContext({viewport:{width,height:1000},hasTouch:touch,isMobile:touch});const page=await context.newPage();await page.goto(base);
  await page.evaluate(async()=>{const {mathExercise}=await import('/src/modules/mathlab/index.ts');document.body.replaceChildren();const root=document.createElement('main');root.style.padding='12px';document.body.append(root);mathExercise('friends')(root,{profile:{id:'friends-keypad-test'}});});
  await page.getByRole('button',{name:'Начать',exact:true}).click();
  const pad=page.locator('.ml-keypad');assert.equal(await pad.locator('button').count(),11);
  const input=page.getByRole('textbox',{name:'Ответ',exact:true});assert.equal(await input.evaluate(el=>el.readOnly),touch);
  for(const n of [0,10,3]){
   const b=pad.getByRole('button',{name:String(n),exact:true});if(touch)await b.tap();else await b.click();
   assert.equal(await input.inputValue(),String(n));assert.equal(await b.getAttribute('aria-pressed'),'true');
   assert.equal(await pad.locator('[aria-pressed="true"]').count(),1);
   if(touch)assert.ok(!await input.evaluate(el=>document.activeElement===el));
  }
  const expression=await page.locator('.ml-surface .ml-equation').innerText();const known=Number(expression.match(/\d+/)[0]);const correct=10-known;
  await pad.getByRole('button',{name:String(correct),exact:true}).click();await page.getByRole('button',{name:'Проверить',exact:true}).click();
  assert.ok(await page.getByText('Верно!',{exact:true}).isVisible());assert.ok(await pad.locator('button').evaluateAll(bs=>bs.every(b=>b.disabled)));
  assert.ok(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  console.log(`Friends keypad ${width}px ${touch?'touch':'mouse'}: 0–10, selection, no input focus, correct answer and locked feedback passed`);await context.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');}
