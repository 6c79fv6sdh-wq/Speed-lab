import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5193/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5193','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await pause(100);}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
 await mkdir('docs/flags/screenshots',{recursive:true});
 for(const [width,height] of [[320,568],[390,844],[820,1180],[844,390],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true});await page.goto(base,{waitUntil:'networkidle'});
  const mount=async()=>page.evaluate(async()=>{window.disposeLayout?.();window.disposeFlags?.();document.body.replaceChildren();const root=document.createElement('main');document.body.append(root);const {mountFlags}=await import('/src/modules/mathlab/flags.ts');const {attachPracticeView}=await import('/src/core/practice-view.ts');window.disposeFlags=mountFlags(root,{profile:{id:'flags-browser'}});window.disposeLayout=attachPracticeView(root);});
  await page.evaluate(()=>localStorage.setItem('sciencechess-mathlab:v1:flags-browser:flags',JSON.stringify({version:1,pool:'all',total:0,correct:0,task:{country:'bt',options:['bt','nr','tv','pw']},selected:null})));
  await mount();await page.locator('.flags-answer:not([disabled])').first().waitFor();
  assert.equal(await page.locator('.flags-answer').count(),4);assert.ok(!(await page.locator('.flags-image').getAttribute('alt')).includes('Бутан'));
  const fits=async locator=>{const box=await locator.boundingBox();assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,`${width}x${height} overflow ${JSON.stringify(box)}`);};
  await fits(page.locator('.flags-picture'));await fits(page.locator('.flags-choices'));await fits(page.locator('.practice-live-stats'));
  await page.locator('[data-country=nr]').click();assert.equal(await page.locator('.flags-feedback').innerText(),'Это Бутан.');assert.equal(await page.locator('.flags-answer:disabled').count(),4);
  await fits(page.getByRole('button',{name:'Дальше',exact:true}));await mount();assert.equal(await page.locator('.flags-feedback').innerText(),'Это Бутан.');assert.equal(await page.locator('.practice-live-stats .ml-stat strong').last().innerText(),'1');
  await page.getByRole('button',{name:'Дальше',exact:true}).click();await page.locator('.flags-answer:not([disabled])').first().waitFor();
  const code=await page.locator('.flags-image').evaluate(img=>img.src.match(/\/([a-z]{2})\.svg/)[1]);assert.notEqual(code,'bt');await page.locator(`[data-country=${code}]`).click();assert.match(await page.locator('.flags-feedback').innerText(),/^Верно!/);assert.equal(await page.locator('.practice-live-stats .ml-stat strong').first().innerText(),'1');
  await page.getByRole('button',{name:'← Настройки и разделы',exact:true}).click();await page.getByLabel('Набор флагов').selectOption('rare');await page.getByRole('button',{name:'Играть на одном экране',exact:true}).click();await page.locator('.flags-answer:not([disabled])').first().waitFor();assert.equal(await page.locator('.practice-live-stats .ml-stat strong').last().innerText(),'0');
  await page.screenshot({path:`docs/flags/screenshots/flags-${width}x${height}.png`});assert.equal(await page.locator('.practice-focused').evaluate(el=>el.scrollTop),0);assert.ok(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  console.log(`${width}x${height}: flag, four answers, feedback, persistence, pools and visible statistics passed`);await page.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');}
