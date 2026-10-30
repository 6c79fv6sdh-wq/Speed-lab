import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5193/';const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5193','--strictPort'],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await pause(100);}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
 await mkdir('docs/material/screenshots',{recursive:true});
 for(const [name,width,touch] of [['phone',320,true],['tablet',820,true],['desktop',1440,false]]){
  const context=await browser.newContext({viewport:{width,height:1000},hasTouch:touch,isMobile:touch});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  const mount=()=>page.evaluate(async()=>{const {mathExercise}=await import('/src/modules/mathlab/index.ts');document.body.replaceChildren();const root=document.createElement('main');root.style.padding='12px';document.body.append(root);window.dispose=mathExercise('material')(root,{profile:{id:'material-browser-test'}});});
  await mount();await page.getByLabel('Заданий в серии',{exact:true}).selectOption('5');await page.getByRole('button',{name:'Начать',exact:true}).click();
  const buttons=page.getByRole('group',{name:'Сравнение стоимости'}).getByRole('button');
  const value=side=>page.getByRole('region',{name:side,exact:true}).locator('img').evaluateAll(images=>images.reduce((n,img)=>n+({Пешка:1,Конь:3,Слон:3,Ладья:5,Ферзь:9}[img.alt]),0));
  for(let i=0;i<5;i++){
   const a=await value('Слева'),b=await value('Справа');const index=a===b?1:a>b?2:0;
   assert.equal(await page.locator('.ml-material-pieces img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)),true,'piece SVGs loaded');
   if(i===0){await page.screenshot({path:`docs/material/screenshots/${name}-task.png`,fullPage:true});
    if(touch)await buttons.nth((index+1)%3).tap();else await buttons.nth((index+1)%3).click();
    assert.ok(await page.getByText('Попробуй ещё раз.',{exact:false}).isVisible());assert.ok(await buttons.evaluateAll(bs=>bs.every(b=>b.disabled)));
    await page.getByRole('button',{name:'Попробовать ещё раз',exact:true}).click();
   }
   if(touch)await buttons.nth(index).tap();else await buttons.nth(index).click();assert.ok(await page.getByText('Верно!',{exact:true}).isVisible());
   assert.ok(await page.locator('.ml-feedback').innerText().then(t=>t.includes(`Слева:`)&&t.includes(`= ${a}.`)));
   if(i===0)await page.screenshot({path:`docs/material/screenshots/${name}-answer.png`,fullPage:true});
   await page.getByRole('button',{name:i===4?'Результат':'Далее',exact:true}).click();
  }
  assert.ok(await page.locator('.ml-stats').innerText().then(t=>t.includes('4 из 5')&&t.includes('80%')));
  assert.ok(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  await page.evaluate(()=>window.dispose());await mount();assert.equal(await page.getByLabel('Заданий в серии',{exact:true}).inputValue(),'5');
  await page.getByText('Мои тренировки',{exact:true}).click();assert.ok(await page.locator('.ml-history').innerText().then(t=>t.includes('4 из 5')));
  assert.deepEqual(errors,[]);console.log(`${name}: graphic pieces, all controls, wrong/retry, five-task score, persistence, no overflow passed`);await context.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');}
