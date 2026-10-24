import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,extname} from 'node:path';
import assert from 'node:assert/strict';
const baseline=process.argv.includes('--baseline');const functional=process.argv.includes('--functional');const dir='docs/themes/screenshots';await mkdir(dir,{recursive:true});
const dist=new URL('../dist/',import.meta.url).pathname;const token=(await readFile(join(dist,'e2e-token.txt'),'utf8')).trim();
const server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;const file=path==='/'?'index.html':path.slice(1);if(file.includes('..'))return res.writeHead(400).end();try{res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'})[extname(file)]??'application/octet-stream'}).end(await readFile(join(dist,file)));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(5715,'127.0.0.1',r));const base='http://127.0.0.1:5715/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});let checks=0;
const check=(ok,label)=>{assert.ok(ok,label);checks++;console.log('OK '+label);};
try{
 for(const width of functional?[]:[390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});const page=await context.newPage();
  await page.addInitScript(t=>{localStorage.setItem('sciencechess-lab-access',t);localStorage.setItem('chesslab.theme','classic');},token);await page.goto(base,{waitUntil:'networkidle'});await page.locator('#profile-name').fill('Theme test');await page.getByRole('button',{name:'Продолжить',exact:true}).click();await page.getByRole('button',{name:/Готово, к тренировке/}).click();await page.locator('#tabs .tab-secondary.active').filter({hasText:'Сегодня'}).waitFor();
  for(const route of ['reaction','motorics','math','scramble']){
   await page.goto(base+'#'+route);await page.locator('#view h1').waitFor();if(route==='reaction'){await page.getByRole('button',{name:'Мат в 2',exact:true}).click();await page.getByRole('button',{name:'3 с',exact:true}).click();}
   await page.mouse.move(0,0);await page.waitForTimeout(350);
   const shot=await page.screenshot({fullPage:true,animations:'disabled'});const name=`${route}-${width}`;
   if(baseline){await writeFile(`${dir}/classic-before-${name}.png`,shot);check(true,`baseline ${name}`);}
   else{await writeFile(`${dir}/classic-after-${name}.png`,shot);check(shot.equals(await readFile(`${dir}/classic-before-${name}.png`)),`Classic pixel-identical ${name}`);}
  }
  await context.close();
 }
 if(!baseline){
  const ctx=await browser.newContext({viewport:{width:390,height:1000},hasTouch:true,serviceWorkers:'block'});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(t=>localStorage.setItem('sciencechess-lab-access',t),token);
  await page.goto(base);await page.locator('#profile-name').fill('Theme test');await page.getByRole('button',{name:'Продолжить',exact:true}).click();await page.getByRole('button',{name:/Готово, к тренировке/}).click();await page.locator('#tabs .tab-secondary.active').filter({hasText:'Сегодня'}).waitFor();
  check(await page.evaluate(()=>document.documentElement.dataset.uiTheme)==='brilliant','new default is Brilliant without a saved choice');
  await page.goto(base+'#calibration');await page.getByRole('button',{name:'Brilliant Dark',exact:true}).click();
  check(await page.evaluate(()=>document.documentElement.dataset.uiTheme)==='brilliant','settings selects Brilliant without reload');
  await page.addInitScript(()=>{new PerformanceObserver(list=>{if(list.getEntries().some(e=>e.name==='first-contentful-paint'))window.themeAtFirstPaint=document.documentElement.dataset.uiTheme;}).observe({type:'paint',buffered:true});});
  await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.themeAtFirstPaint);check(await page.evaluate(()=>window.themeAtFirstPaint)==='brilliant','Brilliant applied at first contentful paint');check(await page.evaluate(()=>document.documentElement.dataset.uiTheme)==='brilliant','theme persists before application mount');
  const apply=theme=>page.evaluate(theme=>window.chesslabUiTheme.apply(theme,true),theme);
  const go=async id=>{await page.goto(base+'#'+id);await page.locator('#view h1').waitFor();};
  for(const width of [320,375,390,402,430,768,1024,1440]){
   await page.setViewportSize({width,height:1000});await go('reaction');await page.getByRole('button',{name:'Мат в 2',exact:true}).click();await page.getByRole('button',{name:'3 с',exact:true}).click();await page.getByRole('button',{name:'500 мс',exact:true}).click();await page.mouse.move(0,0);await page.waitForTimeout(200);
   check(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),`Brilliant ${width}px has no horizontal overflow`);
   const active=await page.locator('.seg-btn.active').evaluateAll(bs=>bs.map(b=>({background:getComputedStyle(b).backgroundColor,color:getComputedStyle(b).color,border:getComputedStyle(b).borderColor})));
   check(active.length===3&&active.every(b=>b.background===active[0].background&&b.border===active[0].border),`same selected states ${width}px`);
   if(width===390){await page.locator('.seg-btn.active').first().hover();check(await page.locator('.seg-btn.active').first().evaluate(b=>getComputedStyle(b).backgroundColor)===active[0].background,'hover does not erase selected state');await page.mouse.move(0,0);}
   const board=page.locator('cg-board');const rect=await board.boundingBox();check(Math.abs(rect.width-rect.height)<1,`square board ${width}px`);
   await board.scrollIntoViewIfNeeded();const r=await board.boundingBox();const clip={x:Math.ceil(r.x)+1,y:Math.ceil(r.y)+1,width:Math.floor(r.width)-2,height:Math.floor(r.height)-2};
   const shot=await page.screenshot({clip,animations:'disabled'});await apply('classic');await page.waitForTimeout(150);const classic=await page.screenshot({clip,animations:'disabled'});await writeFile(`${dir}/board-brilliant-${width}.png`,shot);await writeFile(`${dir}/board-classic-${width}.png`,classic);check(shot.equals(classic),`unchanged board interior pixels ${width}px`);await apply('brilliant');
   await page.screenshot({path:`${dir}/brilliant-tactics-${width}.png`,fullPage:true,animations:'disabled'});
  }
  await page.setViewportSize({width:1440,height:1000});
  for(const route of ['today','motorics','premove','openings','scramble','games','data','math','calibration']){
   await go(route);check(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),`Brilliant page ${route}`);
   if(['math','calibration','scramble'].includes(route))await page.screenshot({path:`${dir}/brilliant-${route}-1440.png`,fullPage:true,animations:'disabled'});
  }
  await page.setViewportSize({width:390,height:1000});await go('reaction');await page.getByRole('button',{name:'Мат в 2',exact:true}).click();await page.getByRole('button',{name:'3 с',exact:true}).click();await page.getByRole('button',{name:'500 мс',exact:true}).click();await page.getByRole('button',{name:'Старт',exact:true}).click();
  await page.waitForTimeout(180);
  await page.screenshot({path:`${dir}/brilliant-active-mate2-390.png`,fullPage:true,animations:'disabled'});
  const boardNode=await page.locator('cg-board').elementHandle();const position=await page.locator('piece').evaluateAll(ps=>ps.map(p=>p.className+' '+p.style.transform).sort());const startTime=Date.now();
  const quick=async name=>{const gear=page.getByRole('button',{name:'Настройки',exact:true});await gear.scrollIntoViewIfNeeded();const r=await gear.boundingBox();const cdp=await ctx.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});await page.waitForTimeout(480);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();await page.getByRole('dialog',{name:'Тема интерфейса'}).getByRole('button',{name,exact:true}).tap();};
  await quick('Classic Dark');await quick('Brilliant Dark');
  check(await boardNode.evaluate(n=>n===document.querySelector('cg-board')),'switch retains the actual board instance');
  check(JSON.stringify(position)===JSON.stringify(await page.locator('piece').evaluateAll(ps=>ps.map(p=>p.className+' '+p.style.transform).sort())),'switch retains current position');
  check(await page.getByRole('button',{name:'Старт',exact:true}).isDisabled(),'switch keeps active session');
  await page.locator('.hl-board.pieces-hidden').waitFor({timeout:2000});check(true,'exposure timer survives theme changes');
  await page.getByText(/Время вышло\. Правильно:/).waitFor({timeout:4500});check(Date.now()-startTime<4500,'answer deadline is not reset');await page.getByRole('button',{name:'Прервать',exact:true}).click();
  await go('calibration');await page.getByRole('button',{name:'Classic Dark',exact:true}).click();check(await page.evaluate(()=>document.documentElement.dataset.uiTheme)==='classic','settings returns to Classic');await page.reload();check(await page.evaluate(()=>document.documentElement.dataset.uiTheme)==='classic','explicit Classic choice survives reload');
  await page.evaluate(()=>localStorage.setItem('chesslab.theme','unsupported'));await page.reload();check(await page.evaluate(()=>document.documentElement.dataset.uiTheme)==='brilliant','invalid persisted value falls back to Brilliant');
  const gear=page.getByRole('button',{name:'Настройки',exact:true});await gear.focus();await gear.press('ArrowDown');await page.getByRole('dialog',{name:'Тема интерфейса'}).waitFor();await page.keyboard.press('Escape');check(await page.getByRole('dialog').count()===0,'keyboard picker opens and closes without navigation');
  await quick('Brilliant Dark');check(await page.getByRole('button',{name:'Brilliant Dark',exact:true}).getAttribute('aria-pressed')==='true','settings picker stays synchronized with quick picker');
  await go('reaction');await page.getByRole('button',{name:'Snapshot',exact:true}).click();const square=page.locator('.sn-sq').first();await square.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');const focus=()=>square.evaluate(e=>{const s=getComputedStyle(e);return [s.outlineColor,s.outlineWidth,s.backgroundColor];});const brilliantFocus=await focus();await apply('classic');check(JSON.stringify(brilliantFocus)===JSON.stringify(await focus()),'Snapshot board focus and square colors preserved');await apply('brilliant');
  await go('motorics');await page.getByRole('button',{name:'Старт',exact:true}).click();check(await page.locator('.exercise-seg .seg-btn.active').evaluate(e=>getComputedStyle(e,'::before').animationName)==='none','Brilliant active control does not pulse');await page.getByRole('button',{name:'Прервать',exact:true}).click();
  check(errors.length===0,'no runtime errors '+errors.join('; '));await ctx.close();
 }
 console.log(`${checks} theme checks passed`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
