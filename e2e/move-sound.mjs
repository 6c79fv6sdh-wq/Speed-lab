import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5199/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5199','--strictPort'],{stdio:'ignore'});
let browser;
try {
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await pause(100);}assert.ok(ready,'server started');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--autoplay-policy=user-gesture-required']});
 for(const touch of [false,true]){
  const context=await browser.newContext({viewport:{width:820,height:1180},hasTouch:touch,isMobile:touch});const page=await context.newPage();
  await page.goto(base);await page.evaluate(async()=>{
   const {Board}=await import('/src/board/board.ts');const chess=await import('/src/core/chess.ts');
   document.body.replaceChildren();const host=document.createElement('main');host.style.cssText='padding:30px';document.body.append(host);
   window.sounds=0;window.moves=0;const start=AudioBufferSourceNode.prototype.start;
   AudioBufferSourceNode.prototype.start=function(...args){window.sounds++;return start.apply(this,args);};
   let pos=chess.posFromFen(chess.INITIAL_FEN);
   const paint=()=>window.board.setPosition({fen:chess.fenOf(pos),orientation:'white',turnColor:pos.turn,movableColor:pos.turn,dests:chess.dests(pos)});
   window.board=new Board(host,{size:480,orientation:'white',coordinates:true,inputMode:'select',onMove:(from,to)=>{const mv=chess.moveFromKeys(pos,from,to);if(mv){pos.play(mv);window.moves++;paint();}}});window.paint=paint;paint();
  });
  const tapSquare=async square=>{const b=await page.locator('cg-board').boundingBox();const x=b.x+(square.charCodeAt(0)-97+.5)*b.width/8,y=b.y+(8-Number(square[1])+.5)*b.height/8;if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);};
  assert.equal(await page.evaluate(()=>sounds),0,'initial position silent');
  await tapSquare('e2');await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>sounds),0,'selection silent');
  await tapSquare('e4');await page.waitForFunction(()=>moves===1);assert.equal(await page.evaluate(()=>sounds),1,'one sound per real move');
  await page.evaluate(()=>{paint();paint();});assert.equal(await page.evaluate(()=>sounds),1,'redraw silent');
  await page.evaluate(async()=>{(await import('/src/core/move-sound.ts')).setMoveSoundEnabled(false);});
  await tapSquare('e7');await tapSquare('e5');await page.waitForFunction(()=>moves===2);assert.equal(await page.evaluate(()=>sounds),1,'muted move silent');
  await page.reload();assert.equal(await page.evaluate(async()=>(await import('/src/core/move-sound.ts')).moveSoundEnabled()),false,'mute persisted');
  console.log(`Sound: ${touch?'touch':'mouse'} — gesture unlock, one click, silent selection/redraw and persisted mute passed`);await context.close();
 }
}finally{await browser?.close();server.kill('SIGTERM');}
