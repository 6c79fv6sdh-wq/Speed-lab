import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as pause } from 'node:timers/promises';
const base = 'http://127.0.0.1:5198/';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5198', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', chunk => { serverLog += chunk; });
server.stderr.on('data', chunk => { serverLog += chunk; });
let browser;
try {
 let ready = false;
 for (let i=0; i<100; i++) {
  if (server.exitCode !== null) throw Error(serverLog);
  try { if ((await fetch(base)).ok) { ready=true; break; } } catch {}
  await pause(100);
 }
 if (!ready) throw Error('Touch test server did not start: '+serverLog);
browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {});
const assert=(ok,message)=>{if(!ok)throw Error(message)};
try{
 for(const mode of ['select','both','drag']){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  if(process.env.UI_THEME)await page.addInitScript(theme=>localStorage.setItem('chesslab.theme',theme),process.env.UI_THEME);
  await page.goto(base);
  await page.evaluate(async mode=>{
   const {Board}=await import('/src/board/board.ts');const {INITIAL_FEN,dests,posFromFen}=await import('/src/core/chess.ts');
   document.body.replaceChildren();const fixture=document.createElement('main');fixture.style.cssText='padding:200px 20px 1400px';document.body.append(fixture);
   window.moves=[];window.board=new Board(fixture,{orientation:'white',size:344,coordinates:true,inputMode:mode,onMove:(from,to)=>window.moves.push(from+to)});
   window.board.setPosition({fen:INITIAL_FEN,orientation:'white',turnColor:'white',movableColor:'white',dests:dests(posFromFen(INITIAL_FEN))});
  },mode);
  await page.evaluate(()=>{
   window.gestureLog=[];
   for(const type of ['pointerdown','pointercancel','touchstart','touchend'])window.board.wrap.addEventListener(type,e=>{
    const d=window.board.api.state.draggable.current;
    window.gestureLog.push({type,target:e.target.tagName,drag:!!d,originSame:d?.originTarget===e.target,pos:d?.pos,started:d?.started,selected:window.board.api.state.selected});
   },true);
  });
  const cdp=await page.context().newCDPSession(page);
  // Let native scroll inertia stop before measuring a new gesture's origin.
  const settle = () => page.evaluate(async () => {
    let previous = scrollY, stable = 0;
    for (let i=0; i<120 && stable<6; i++) {
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const next = scrollY;
      stable = Math.abs(next-previous)<0.5 ? stable+1 : 0;
      previous=next;
    }
  });
  const point=async key=>page.evaluate(key=>{const b=window.board.wrap.getBoundingClientRect(),f=key.charCodeAt(0)-97,r=Number(key[1])-1;return{x:b.x+(f+.5)*b.width/8,y:b.y+(7.5-r)*b.height/8}},key);
  const drag=async (from,to)=>{
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});
   for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/12,y:from.y+(to.y-from.y)*i/12}]});await page.waitForTimeout(30)}
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settle();
  };
  let p=await point(mode==='select'?'e2':'e4');let before=await page.evaluate(()=>scrollY);
  await drag(p,{x:p.x,y:p.y-110});let after=await page.evaluate(()=>scrollY);
  assert(after>before+30,`${mode}: swipe did not scroll down ${before}→${after}`);
  assert((await page.evaluate(()=>window.moves.length))===0,`${mode}: scrolling made a move`);
  await page.evaluate(()=>scrollTo(0,150));await settle();
  p=await point('e4');before=await page.evaluate(()=>scrollY);await drag(p,{x:p.x,y:p.y+90});after=await page.evaluate(()=>scrollY);
  assert(after<before-25,`${mode}: swipe did not scroll up ${before}→${after}`);
  await page.evaluate(()=>scrollTo(0,0));await settle();
  if(mode==='select'){
   p=await point('e2');await page.touchscreen.tap(p.x,p.y);p=await point('e4');await page.touchscreen.tap(p.x,p.y);
  }else{before=await page.evaluate(()=>scrollY);await drag(await point('e2'),await point('e4'));assert(Math.abs(await page.evaluate(()=>scrollY)-before)<3,`${mode}: piece drag scrolled page`)}
  await page.waitForTimeout(100);


  if((await page.evaluate(()=>window.moves.length))!==1)console.log(JSON.stringify(await page.evaluate(()=>({events:window.gestureLog,pieces:[...window.board.api.state.pieces].filter(([key])=>['e2','e4'].includes(key)),scrollY}))));
  assert(JSON.stringify(await page.evaluate(()=>window.moves))==='["e2e4"]',`${mode}: move failed/duplicated ${await page.evaluate(()=>window.moves)}`);
  console.log(`${mode}: native swipe down/up, no move during scroll, move once, drag stable`);
  for(const color of ['white','black']){
   await page.evaluate(async color=>{
    const {INITIAL_FEN}=await import('/src/core/chess.ts');
    window.moves=[];window.board.api.set({premovable:{enabled:true}});
    window.board.setPosition({fen:INITIAL_FEN,orientation:color,turnColor:color==='white'?'black':'white',movableColor:color});
    scrollTo(0,0);
   },color);
   await settle();
   const squarePoint=async key=>page.evaluate(key=>{
    const b=window.board.wrap.getBoundingClientRect(),black=window.board.api.state.orientation==='black',f=key.charCodeAt(0)-97,r=Number(key[1])-1;
    return{x:b.x+((black?7-f:f)+.5)*b.width/8,y:b.y+((black?r:7-r)+.5)*b.height/8};
   },key);
   const from=await squarePoint(color==='white'?'g1':'g8'),to=await squarePoint(color==='white'?'f3':'f6');
   if(mode==='select'){await page.touchscreen.tap(from.x,from.y);await page.touchscreen.tap(to.x,to.y);}else await drag(from,to);
   assert(await page.evaluate(()=>window.board.hasPremove()),`${mode}/${color}: touch premove not queued`);
   const p=await squarePoint('e4');await drag(p,{x:p.x,y:p.y-80});
   assert(await page.evaluate(()=>window.board.hasPremove()),`${mode}/${color}: scroll cancelled premove`);
   await page.evaluate(async color=>{
    const {posFromFen,INITIAL_FEN,moveFromUci,fenOf,dests}=await import('/src/core/chess.ts');
    const pos=posFromFen(INITIAL_FEN);if(color==='white')pos.turn='black';pos.play(moveFromUci(color==='white'?'e7e5':'e2e4'));
    window.board.setPosition({fen:fenOf(pos),orientation:color,turnColor:color,movableColor:color,dests:dests(pos)});
    window.board.playPremove();
   },color);
   await page.waitForTimeout(100);
   assert((await page.evaluate(()=>window.moves.length))===1,`${mode}/${color}: queued move not executed once`);
   console.log(`${mode}/${color}: touch premove survives native scroll and executes once`);
  }
  await page.close();
 }
}finally{await browser.close()}
} finally { server.kill(); }
