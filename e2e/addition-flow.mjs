import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5191/';const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5191','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await pause(100);}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});await mkdir('docs/addition-flow/screenshots',{recursive:true});
 for(const [name,width,touch] of [['phone',320,true],['tablet',820,true],['desktop',1440,false]]){
  const context=await browser.newContext({viewport:{width,height:1100},hasTouch:touch,isMobile:touch});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  const mount=()=>page.evaluate(async()=>{const {mountAdditionFlow}=await import('/src/modules/mathlab/addition-flow.ts');document.body.replaceChildren();const root=document.createElement('main');root.style.padding='12px';document.body.append(root);window.dispose=mountAdditionFlow(root,{profile:{id:'flow-browser'}});});
  await mount();assert.equal(await page.locator('input').count(),0,'no software keyboard needed');
  const sum=async()=>{const nums=(await page.locator('.ml-equation').innerText()).match(/\d+/g).map(Number);return nums[0]+nums[1];};
  const select=async n=>{const b=page.locator('.ml-keypad').getByRole('button',{name:String(n),exact:true});if(touch)await b.tap();else{await b.focus();await b.press('Enter');}};
  await select(0);const original=await page.locator('.ml-equation').innerText();assert.ok(await page.getByText('Попробуй ещё раз',{exact:true}).isVisible());
  await page.screenshot({path:`docs/addition-flow/screenshots/${name}.png`,fullPage:true});
  for(let i=0;i<15;i++){
   const n=await sum();await select(n);assert.ok(await page.locator('.ml-keypad button').evaluateAll(bs=>bs.every(b=>b.disabled)));
   await page.waitForFunction(()=>document.querySelector('.ml-flow-feedback').textContent==='');assert.ok((await page.locator('.ml-stats').innerText()).includes(String(i+1)));
   if(i===0)assert.notEqual(await page.locator('.ml-equation').innerText(),original);
  }
  assert.ok((await page.locator('.ml-stats').innerText()).includes('93%'));
  await page.reload();await mount();assert.ok((await page.locator('.ml-stats').innerText()).includes('15'));assert.ok((await page.locator('.ml-stats').innerText()).includes('93%'));
  await page.getByLabel('Сложение',{exact:true}).selectOption('20');assert.equal(await page.locator('.ml-keypad button').count(),21);await select(await sum());await page.waitForFunction(()=>document.querySelector('.ml-flow-feedback').textContent==='');
  await page.getByRole('button',{name:'Начать заново',exact:true}).click();assert.ok((await page.locator('.ml-stats').innerText()).includes('Решено\n0'));
  assert.ok(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  await page.getByLabel('Режим',{exact:true}).selectOption('lives');assert.equal(await page.locator('.ml-flow-heart').count(),3);
  await select(await sum());await page.waitForFunction(()=>document.querySelector('.ml-flow-feedback').textContent==='');
  await select(0);assert.equal(await page.locator('.ml-flow-heart').count(),2);assert.ok((await page.locator('.ml-stats').innerText()).includes('50%'));
  await page.reload();await mount();assert.equal(await page.getByLabel('Режим',{exact:true}).inputValue(),'lives');assert.equal(await page.locator('.ml-flow-heart').count(),2);
  await page.screenshot({path:`docs/addition-flow/screenshots/${name}-lives.png`,fullPage:true});
  for(const remaining of [1,0]){await select(0);assert.equal(await page.locator('.ml-flow-heart').count(),remaining);if(remaining)await page.waitForFunction(()=>!document.querySelector('.ml-keypad button').disabled);}
  assert.ok(await page.getByText('Попытка завершена',{exact:true}).isVisible());assert.ok((await page.locator('.ml-stats').innerText()).includes('50%'));
  assert.ok(await page.locator('.ml-keypad button').evaluateAll(bs=>bs.every(b=>b.disabled)));
  await page.reload();await mount();assert.ok(await page.getByText('Попытка завершена',{exact:true}).isVisible());
  await page.getByRole('button',{name:'Новая попытка',exact:true}).click();assert.equal(await page.locator('.ml-flow-heart').count(),3);
  await page.getByLabel('Режим',{exact:true}).selectOption('survival');assert.equal(await page.locator('.ml-flow-heart').count(),1);await select(0);assert.equal(await page.locator('.ml-flow-heart').count(),0);assert.ok(await page.getByText('Попытка завершена',{exact:true}).isVisible());
  await page.getByRole('button',{name:'Новая попытка',exact:true}).click();await page.getByLabel('Режим',{exact:true}).selectOption('endless');assert.ok(!await page.locator('.ml-flow-lives').isVisible());
  await select(await sum());const text=await page.locator('.ml-equation').innerText();await page.evaluate(()=>dispose());await page.waitForTimeout(500);assert.equal(await page.locator('.ml-equation').innerText(),text);
  assert.deepEqual(errors,[]);console.log(`${name}: 15 continuous additions, retry, first-try accuracy, persisted progress, sum to 20, reset, survival, three hearts, saved lives, end screen and cleanup passed`);await context.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');}
