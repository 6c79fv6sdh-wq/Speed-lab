import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Board as BoardType } from '../src/board/board';
const state = vi.hoisted(() => ({ board: null as unknown, reply: null as null | ((moves: {move:string;score:number}[]) => void) }));
const db = vi.hoisted(() => ({ getGame:vi.fn(), putGame:vi.fn(async()=>{}), activeProfileId:vi.fn(async()=>'p'), putSession:vi.fn(async()=>{}), putMeasurement:vi.fn(async()=>{}), uid:vi.fn(()=>crypto.randomUUID()) }));
vi.mock('../src/core/db',()=>db);
vi.mock('../src/core/maia',()=>({maiaAvailable:()=>true,warmUpMaia:async()=>{},maiaCandidates:vi.fn(()=>new Promise(resolve=>{state.reply=resolve;}))}));
vi.mock('../src/core/engine',()=>({engineSupported:()=>false}));
vi.mock('../src/board/board',async original=>{
 const {Board}=await original<typeof import('../src/board/board')>();
 return {Board:class extends Board {constructor(...args:ConstructorParameters<typeof Board>){super(...args);state.board=this;}}};
});
import { mountScramble } from '../src/modules/scramble';
import { DEFAULT_CALIBRATION } from '../src/core/settings';
import { mockBounds } from './helpers/dom';
import type { AppContext } from '../src/main';
import type { Key } from 'chessground/types';
let root:HTMLElement;let unmount:()=>void;
const board=()=>state.board as BoardType;
const click=(name:string)=>[...root.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===name)!.click();
async function flush(){for(let i=0;i<15;i++)await Promise.resolve();}
async function start(black=false){if(black)click('Чёрными');click('Старт');await flush();}
function move(from:Key,to:Key){board().api.selectSquare(from);board().api.selectSquare(to);}
async function waitBot(){await vi.advanceTimersByTimeAsync(1000);expect(state.reply).toBeTypeOf('function');}
async function reply(uci:string){state.reply!([{move:uci,score:0}]);state.reply=null;await flush();await vi.advanceTimersByTimeAsync(5);}
beforeEach(()=>{
 vi.useFakeTimers();vi.clearAllMocks();state.reply=null;
 vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});mockBounds();
 root=document.createElement('div');document.body.append(root);
 unmount=mountScramble(root,{calibration:DEFAULT_CALIBRATION,profile:{id:'p',name:'Test'},setCalibration:vi.fn(),setProfileName:vi.fn(),signOut:vi.fn()} as unknown as AppContext);
});
afterEach(async()=>{unmount();await flush();vi.clearAllTimers();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();document.body.replaceChildren();});
describe('sparring clocks and premoves',()=>{
 it.each([false,true])('shows own clock first regardless of playing color (black=%s)',async black=>{
  await start(black);
  expect([...root.querySelectorAll('.clock-label')].map(e=>e.textContent)).toEqual(['Ты','Соперник']);
 });
 it.each([false,true])('executes a queued legal premove once for either side (black=%s)',async black=>{
  await start(black);
  if(!black){move('e2','e4');await vi.advanceTimersByTimeAsync(5);}
  await waitBot();move(black?'g8':'g1',black?'f6':'f3');expect(board().hasPremove()).toBe(true);
  await reply(black?'e2e4':'e7e5');
  expect(board().api.state.pieces.get(black?'f6':'f3')?.role).toBe('knight');
  expect(board().hasPremove()).toBe(false);
  expect(db.putMeasurement).toHaveBeenCalledTimes(black?1:2);
 });
 it('accepts the next premove immediately after a move, before the delayed callback',async()=>{
  await start();move('e2','e4');move('g1','f3');
  expect(board().hasPremove()).toBe(true);
  await waitBot();await reply('e7e5');
  expect(board().api.state.pieces.get('f3')?.role).toBe('knight');
 });
 it('keeps a first tap selected across the bot reply so the second tap can finish the move',async()=>{
  await start();move('e2','e4');await waitBot();board().api.selectSquare('g1');
  await reply('e7e5');expect(board().api.state.selected).toBe('g1');
  board().api.selectSquare('f3');await vi.advanceTimersByTimeAsync(5);
  expect(board().api.state.pieces.get('f3')?.role).toBe('knight');
  expect(db.putMeasurement).toHaveBeenCalledTimes(2);
 });
 it('cancels an illegal premove after the reply without making an illegal move',async()=>{
  await start();move('e2','e4');await waitBot();move('e4','d5');expect(board().hasPremove()).toBe(true);
  await reply('e7e6');expect(board().hasPremove()).toBe(false);
  expect(board().api.state.pieces.get('e4')?.role).toBe('pawn');
  expect(db.putMeasurement).toHaveBeenCalledTimes(1);
 });
 it('respects explicit cancellation',async()=>{
  await start();move('e2','e4');await waitBot();move('g1','f3');board().cancelPremove();await reply('e7e5');
  expect(board().api.state.pieces.get('g1')?.role).toBe('knight');expect(db.putMeasurement).toHaveBeenCalledTimes(1);
 });
});
