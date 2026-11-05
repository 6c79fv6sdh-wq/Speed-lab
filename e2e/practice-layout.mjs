import {chromium} from 'playwright';import {spawn} from 'node:child_process';import {setTimeout as pause} from 'node:timers/promises';import {mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';
const base='http://127.0.0.1:5189/';const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5189','--strictPort'],{stdio:'ignore'});let browser;
try{for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await pause(100);}browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});await mkdir('docs/practice/screenshots',{recursive:true});
 for(const [width,height] of [[320,568],[390,844],[820,1180],[844,390],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});await page.goto(base,{waitUntil:'networkidle'});
  const mount=async id=>{await page.evaluate(async id=>{window.disposeLayout?.();window.disposeExercise?.();const {mathExercise}=await import('/src/modules/mathlab/index.ts');const {mountAdditionFlow}=await import('/src/modules/mathlab/addition-flow.ts');const {attachPracticeView}=await import('/src/core/practice-view.ts');document.body.replaceChildren();const root=document.createElement('main');document.body.append(root);Math.random=()=>.5;window.disposeExercise=id==='addition-flow'?mountAdditionFlow(root,{profile:{id:'layout-'+id}}):mathExercise(id)(root,{profile:{id:'layout-'+id}});window.disposeLayout=attachPracticeView(root);},id);};
  const fits=async locator=>{const box=await locator.boundingBox();if(box&&box.y+box.height>height+1)await page.screenshot({path:'/tmp/practice-fail.png'});assert.ok(box&&box.y>=0&&box.y+box.height<=height+1,`outside viewport ${width}x${height}: ${await locator.getAttribute('class')} ${JSON.stringify(box)}`);};
  for(const id of ['glance','friends','builder','signs','bridge','material','addition-flow']){
   await mount(id);if(id==='builder'||id==='bridge')await page.getByRole('button',{name:'← Настройки и разделы',exact:true}).click();if(id==='builder')await page.getByLabel('Режим',{exact:true}).selectOption('train');if(id==='bridge')await page.getByLabel('Режим',{exact:true}).selectOption('train');if(id!=='addition-flow')await page.getByRole('button',{name:'Начать',exact:true}).click();
   await page.locator('.practice-focused').waitFor();if(id==='glance')await page.locator('.ml-keypad').waitFor();assert.ok(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
   if(id==='addition-flow'){await page.getByRole('button',{name:'← Настройки и разделы',exact:true}).click();await page.getByLabel('Режим',{exact:true}).selectOption('lives');await page.getByLabel('Сложение',{exact:true}).selectOption('20');await page.getByRole('button',{name:'Играть на одном экране',exact:true}).click();await fits(page.locator('.ml-keypad'));await fits(page.locator('.ml-equation'));}
   else if(id==='material'){await fits(page.locator('.ml-material-comparison'));await page.getByRole('button',{name:'Выбрать левую группу',exact:true}).click();await fits(page.getByRole('button',{name:'Далее',exact:true}));}
   else if(id==='bridge'){
    await fits(page.locator('.ml-boxes'));
    while(await page.locator('[data-side=left] .ml-ball').count()<10){await page.locator('[data-side=right]:has(.ml-ball)').first().click();await page.locator('[data-side=left]:not(:has(.ml-ball))').first().click();}
    await fits(page.locator('.ml-keypad'));await fits(page.getByRole('button',{name:'Проверить',exact:true}));
    await page.locator('.ml-keypad').getByRole('button',{name:'13',exact:true}).click();await page.getByRole('button',{name:'Проверить',exact:true}).click();await fits(page.getByRole('button',{name:'Далее',exact:true}));
   }
   else if(id==='signs'){
    await fits(page.locator('.ml-sign-board'));await fits(page.getByRole('group',{name:'Ввод количества знаков'}));
    await page.getByRole('group',{name:'Ввод количества знаков'}).getByRole('button',{name:'3',exact:true}).click();await page.getByRole('group',{name:'Ввод количества знаков'}).getByRole('button',{name:'3',exact:true}).click();
    await fits(page.getByRole('button',{name:'Проверить',exact:true}));await page.getByRole('button',{name:'Проверить',exact:true}).click();await fits(page.getByRole('button',{name:'Далее',exact:true}));
   }else{await fits(page.locator('.ml-keypad'));await fits(page.getByRole('button',{name:'Проверить',exact:true}));await page.locator('.ml-keypad').getByRole('button',{name:'5',exact:true}).click();await page.getByRole('button',{name:'Проверить',exact:true}).click();await fits(page.getByRole('button',{name:'Далее',exact:true}));}
   await page.screenshot({path:`docs/practice/screenshots/${id}-${width}x${height}.png`,fullPage:false});
   assert.equal(await page.locator('.practice-focused').evaluate(el=>el.scrollTop),0,'no scrolling needed');
  }
  await page.evaluate(()=>{disposeLayout();disposeExercise();});assert.equal(await page.evaluate(()=>document.body.style.overflow),'');console.log(`${width}x${height}: task, keypad, confirmation, next and cleanup passed`);await page.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');}
