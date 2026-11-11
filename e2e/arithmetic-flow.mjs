import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5194/';const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5194','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await pause(100);}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});await mkdir('docs/arithmetic/screenshots',{recursive:true});
 for(const [width,height] of [[320,568],[390,844],[820,1180],[844,390],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true});await page.goto(base,{waitUntil:'networkidle'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const mount=async operation=>page.evaluate(async operation=>{window.disposeLayout?.();window.disposeExercise?.();document.body.replaceChildren();const root=document.createElement('main');document.body.append(root);const mod=await import('/src/modules/mathlab/addition-flow.ts');const {attachPracticeView}=await import('/src/core/practice-view.ts');window.disposeExercise=(operation==='addition'?mod.mountAdditionFlow:mod.mountMultiplicationFlow)(root,{profile:{id:'arithmetic-browser'}});window.disposeLayout=attachPracticeView(root);},operation);
  const fits=async locator=>{const box=await locator.boundingBox();assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,`${width}x${height}: ${await locator.getAttribute('class')} outside ${JSON.stringify(box)}`);};
  const configure=async(level,mode)=>{await page.getByRole('button',{name:'← Настройки и разделы',exact:true}).tap();await page.getByLabel('Сложность',{exact:true}).selectOption(level);await page.getByLabel('Режим',{exact:true}).selectOption(mode);if(await page.getByLabel('Порядок ответов',{exact:true}).isVisible())await page.getByLabel('Порядок ответов',{exact:true}).selectOption('mixed');await page.getByRole('button',{name:'Играть на одном экране',exact:true}).tap();};
  const total=async operation=>{const [a,b]=(await page.locator('.ml-equation').innerText()).match(/\d+/g).map(Number);return operation==='addition'?a+b:a*b;};
  const waitNext=()=>page.waitForFunction(()=>document.querySelector('.ml-flow-feedback').textContent==='');
  for(const operation of ['addition','multiplication'])for(const level of ['easy','hard']){
   await mount(operation);await configure(level,'lives');assert.equal(await page.locator('.ml-flow-heart').count(),3);
   if(operation==='multiplication'||level==='hard')assert.equal(await page.locator('.ml-keypad button').count(),4);
   await fits(page.locator('.ml-equation'));await fits(page.locator('.ml-keypad'));await fits(page.locator('.practice-live-stats'));await fits(page.getByRole('button',{name:'Начать заново',exact:true}));
   const order=await page.locator('.ml-keypad button').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.value)));if(operation==='addition'&&level==='easy')assert.notDeepEqual(order,[...order].sort((a,b)=>a-b));
   const correct=await total(operation),wrong=await page.locator(`.ml-keypad button:not([data-value="${correct}"])`).first().getAttribute('data-value');await page.locator(`[data-value="${wrong}"]`).tap();assert.equal(await page.locator('.ml-flow-heart').count(),2);await page.waitForTimeout(370);await page.locator(`[data-value="${correct}"]`).tap();await waitNext();assert.equal(await page.locator('.practice-live-stats .ml-stat strong').first().innerText(),'1');if(operation==='addition'&&level==='easy')assert.notDeepEqual(await page.locator('.ml-keypad button').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.value))),order);
   await page.locator(`[data-value="${await total(operation)}"]`).tap();await waitNext();assert.equal(await page.locator('.practice-live-stats .ml-stat strong').nth(1).innerText(),'50%');
   await mount(operation);assert.equal(await page.getByLabel('Сложность',{exact:true}).inputValue(),level);assert.equal(await page.locator('.practice-live-stats .ml-stat strong').first().innerText(),'2');
   await page.screenshot({path:`docs/arithmetic/screenshots/${operation}-${level}-${width}x${height}.png`});
   assert.equal(await page.locator('.practice-focused').evaluate(el=>el.scrollTop),0);assert.ok(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));assert.equal(await page.locator('input').count(),0,'answers never open a software keyboard');
   await configure(level,'survival');const bad=await page.locator(`.ml-keypad button:not([data-value="${await total(operation)}"])`).first();await bad.tap();assert.equal(await page.locator('.ml-flow-heart').count(),0);await fits(page.getByRole('button',{name:'Новая попытка',exact:true}));assert.ok(await page.locator('.ml-keypad').isHidden());await page.getByRole('button',{name:'Новая попытка',exact:true}).tap();assert.equal(await page.locator('.ml-flow-heart').count(),1);
  }
  assert.deepEqual(errors,[]);console.log(`${width}x${height}: both exercises, both levels, touch answers, accuracy, hearts, survival, saved progress and no scrolling passed`);await page.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');}
