import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {extname,join} from 'node:path';
import assert from 'node:assert/strict';
const dist=new URL('../dist/',import.meta.url).pathname;
const server=createServer(async(req,res)=>{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!path.startsWith('/lab/'))return res.writeHead(404).end();const file=path==='/lab/'?'index.html':path.slice(5);if(file.includes('..'))return res.writeHead(400).end();try{const body=await readFile(join(dist,file));res.writeHead(200,{'Content-Type':({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.webmanifest':'application/manifest+json'})[extname(file)]??'application/octet-stream'}).end(body);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(5713,'127.0.0.1',resolve));
const base='http://127.0.0.1:5713/lab/';const token=(await readFile(join(dist,'e2e-token.txt'),'utf8')).trim();
const screenshots=process.env.UI_THEME==='brilliant'?'docs/themes/mathlab':'docs/mathlab/screenshots';
await mkdir(new URL(`../${screenshots}/`,import.meta.url),{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
let checks=0;
const check=(ok,label)=>{assert.ok(ok,label);checks++;console.log('OK '+label);};
try{
 for(const [name,width,height,touch] of [['desktop',1280,1000,false],['tablet',820,1180,true],['phone',390,844,true],['phone-landscape',844,390,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,serviceWorkers:'block'});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(token=>localStorage.setItem('sciencechess-lab-access',token),token);
  if(process.env.UI_THEME)await page.addInitScript(theme=>localStorage.setItem('chesslab.theme',theme),process.env.UI_THEME);
  await page.goto(base+'#math-builder',{waitUntil:'networkidle'});await page.locator('#profile-name').fill('MathLab test');await page.getByRole('button',{name:'Продолжить',exact:true}).click();await page.getByRole('button',{name:/Готово, к тренировке/}).click();
  await page.locator('.mathlab[data-exercise=builder]').waitFor();check(true,name+': direct exercise URL survives first-run setup');
  check(await page.locator('#tabs-primary-scroll .tab-primary').allTextContents().then(labels=>labels.join('|')==='Тренировки|Спарринг|Мои партии|Прогресс'),name+': chess navigation stays grouped in order');
  check(await page.locator('.math-portal').count()===1,name+': one separate MathLab entrance');
  check(await page.locator('.math-portal').evaluate(el=>innerWidth<=650?el.parentElement.id==='tabs'&&el===el.parentElement.lastElementChild:el.previousElementSibling?.id==='tabs-primary-scroll'),name+': MathLab follows chess navigation');
  await page.locator('#tabs').getByRole('button',{name:'Математика',exact:true}).click();await page.locator('.ml-card').first().waitFor();check(await page.locator('.ml-card').count()===4,name+': four cards through main menu');
  if(name==='desktop')await page.screenshot({path:`${screenshots}/home-desktop.png`,fullPage:true});
  const go=async id=>{await page.goto(base+'#math-'+id);await page.locator('.mathlab[data-exercise="'+id+'"]').waitFor();};
  const option=async(label,value)=>{if(!await page.locator('.ml-settings').evaluate(el=>el.open))await page.locator('.ml-settings > summary').click();const select=page.getByLabel(label,{exact:true});await select.selectOption(value);};
  const btn=label=>page.locator('.mathlab').getByRole('button',{name:label,exact:true});
  const enter=async(value,label='Ответ')=>{const input=page.getByLabel(label,{exact:true});await input.fill(String(value));await input.press('Enter');await page.locator('.ml-feedback .ml-actions').waitFor();};
  const next=async last=>{await btn(last?'Результат':'Далее').click();};
  const finish=async()=>{check(await page.locator('.ml-progress').innerText()==='Тренировка завершена',name+': series finished');};
  // Builder exploration is live and persisted; test every unknown location through real forms.
  await go('builder');await page.getByLabel('Целое число',{exact:true}).fill('7');await page.getByLabel('Целое число',{exact:true}).press('Tab');
  const range=page.getByRole('slider',{name:'Первая часть'});await range.fill('3');check((await page.locator('.ml-equation').innerText()).includes('7 = 3 + 4'),name+': live slider');await range.focus();await page.keyboard.press('ArrowRight');check((await page.locator('.ml-equation').innerText()).includes('7 = 4 + 3'),name+': splitter keyboard step');await range.fill('3');await btn('Поменять местами').click();check((await page.locator('.ml-equation').innerText()).includes('7 = 4 + 3'),name+': swap');
  await page.locator('.ml-splitter').scrollIntoViewIfNeeded();const rail=await page.locator('.ml-splitter').boundingBox();const clickPoint={x:rail.x+rail.width*.28,y:rail.y+rail.height/2};if(touch)await page.touchscreen.tap(clickPoint.x,clickPoint.y);else await page.mouse.click(clickPoint.x,clickPoint.y);check(await range.inputValue()==='2',name+': numbered rail responds to direct press');await range.fill('4');await page.waitForTimeout(150);
  if(name==='desktop'||name==='phone')await page.screenshot({path:`${screenshots}/builder-${name}.png`,fullPage:true});
  await page.reload();await page.locator('.mathlab').waitFor();check(await page.getByLabel('Целое число',{exact:true}).inputValue()==='7',name+': exploration settings survive reload');
  await option('Режим','train');await option('Заданий в серии','5');await btn('Начать').click();
  for(let i=0;i<5;i++){
   const eq=await page.locator('.ml-equation').innerText();const numbers=eq.match(/\d+/g).map(Number);check(await page.locator('.ml-parts').count()===0,name+': no hidden-part hint');
   await enter(i===0?99:numbers[0]-numbers[1]);await next(i===4);
  }await finish();check((await page.locator('.ml-stats').innerText()).includes('4 из 5'),name+': first-attempt accuracy');
  // Friends, including a wrong response and hidden frame.
  await go('friends');if(name==='desktop')await page.screenshot({path:`${screenshots}/friends-desktop.png`,fullPage:true});await option('Заданий в серии','5');await option('Уровень','3');await page.getByLabel('Показывать рамку',{exact:true}).uncheck();await btn('Начать').click();
  for(let i=0;i<5;i++){
   const eq=await page.locator('.ml-equation').innerText();const known=eq.match(/\d+/g).map(Number).find(n=>n!==10)??10;
   check(await page.locator('.ml-surface .ml-frame').count()===0,name+': unassisted friends');await enter(i===0?99:10-known);await next(i===4);
  }await finish();if(name==='desktop')await page.screenshot({path:`${screenshots}/results-desktop.png`,fullPage:true});await page.reload();await page.locator('.mathlab').waitFor();check(await page.getByLabel('Заданий в серии',{exact:true}).inputValue()==='5',name+': training settings persist');await page.getByText('Мои тренировки',{exact:true}).click();check(await page.locator('.ml-history li').count()>=1,name+': saved result');
  // Exact visibility interval and manual/automatic next cancellation.
  await go('glance');await option('Заданий в серии','5');await option('Время показа','2000');await page.getByLabel('Движущиеся точки',{exact:true}).check();await btn('Начать').click();
  for(let i=0;i<5;i++){
   await page.locator('.ml-dot').first().waitFor();const count=await page.locator('.ml-dot').count();if(i===0){const dot=page.locator('.ml-dot').first();const before=await dot.boundingBox();await page.waitForTimeout(230);const after=await dot.boundingBox();check(Math.abs(before.x-after.x)+Math.abs(before.y-after.y)>1,name+': dots actually move');check(await page.locator('.ml-dot').count()===count,name+': motion preserves count');const bounded=await page.locator('.ml-dots').evaluate(area=>{const a=area.getBoundingClientRect(),dots=[...area.querySelectorAll('.ml-dot')].map(d=>d.getBoundingClientRect());return dots.every(d=>d.left>=a.left&&d.right<=a.right&&d.top>=a.top&&d.bottom<=a.bottom)&&dots.every((d,i)=>dots.slice(i+1).every(b=>d.right<=b.left||b.right<=d.left||d.bottom<=b.top||b.bottom<=d.top));});check(bounded,name+': moving dots stay separated and inside frame');await page.emulateMedia({reducedMotion:'reduce'});check(await dot.evaluate(el=>getComputedStyle(el).animationName)==='none',name+': reduced motion stops movement');await page.emulateMedia({reducedMotion:'no-preference'});}if(name==='desktop'&&i===0)await page.screenshot({path:`${screenshots}/glance-desktop.png`,fullPage:true});await page.getByLabel('Ответ',{exact:true}).waitFor();check(await page.locator('.ml-dot').count()===0,name+': points hidden before answer');await enter(i===0?99:count);await next(i===4);
  }await finish();
  // Pointer drag is real on both mouse and touch; invalid destinations preserve objects.
  await go('bridge');
  const total=()=>page.locator('.ml-boxes .ml-ball').count();
  const source=()=>page.locator('[data-side=right].ml-amber:not(:disabled)').first();
  const target=()=>page.locator('[data-side=left]:not(:disabled)').first();
  const drag=async(from,to)=>{
   await from.scrollIntoViewIfNeeded();const a=await from.boundingBox();await to.scrollIntoViewIfNeeded();const b=await to.boundingBox();
   // Both boxes fit into the viewport after this scroll at every tested size.
   const start={x:a.x+a.width/2,y:a.y+a.height/2},end={x:b.x+b.width/2,y:b.y+b.height/2};
   if(touch){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/5,y:start.y+(end.y-start.y)*i/5,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
   else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:8});check(await page.locator('.ml-drag-ghost').count()===1,name+': ball follows pointer');await page.mouse.up();}
  };
  await page.locator('.ml-boxes').scrollIntoViewIfNeeded();await drag(source(),page.locator('[data-side=left][data-index="0"]'));check(await total()===13&&await page.locator('[data-side=right].ml-amber').count()===5,name+': occupied drop rejected');
  await drag(source(),page.locator('.ml-equation'));check(await total()===13&&await page.locator('[data-side=right].ml-amber').count()===5,name+': outside drop rejected');
  await drag(source(),target());check(await page.locator('[data-side=left].ml-amber').count()===1&&await total()===13,name+': real drag keeps origin and count');await btn('Отменить перемещение').click();check(await page.locator('[data-side=right].ml-amber').count()===5,name+': undo');
  const tap=async locator=>touch?locator.tap():locator.click();
  for(let i=0;i<2;i++){await tap(source());await tap(target());}
  check((await page.locator('.ml-equation').innerText()).includes('10 + 3'),name+': tap alternative and full ten');
  if(name==='phone')await page.screenshot({path:`${screenshots}/bridge-phone.png`,fullPage:true});
  await option('Режим','train');await option('Заданий в серии','5');await option('Помощь','3');await btn('Начать').click();
  for(let i=0;i<5;i++){const [a,b]=(await page.locator('.ml-equation').innerText()).match(/\d+/g).map(Number);check(await page.locator('.ml-boxes').count()===0,name+': mental mode needs no invisible drag');await page.getByLabel('До десятки не хватает',{exact:true}).fill(String(10-a));await page.getByLabel('Останется во второй части',{exact:true}).fill(String(a+b-10));await enter(i===0?99:a+b,'Сумма');await next(i===4);}await finish();
  check(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),name+': no horizontal overflow');
  if(name==='phone'){await page.setViewportSize({width:320,height:740});await go('bridge');await option('Режим','explore');await option('Помощь','1');check(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'320px: boxes fit without horizontal overflow');}
  await page.locator('#tabs').getByRole('button',{name:'Тренировки',exact:true}).click();await page.locator('#tabs').getByRole('button',{name:'Моторика',exact:true}).click();await page.getByRole('button',{name:'Старт',exact:true}).click();check(await page.locator('cg-board').count()>0,name+': chess still starts');
  check(errors.length===0,name+': no JavaScript errors '+errors.join('; '));await context.close();
 }
 console.log(`${checks} MathLab browser checks passed`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
