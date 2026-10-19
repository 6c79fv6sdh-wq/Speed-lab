import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Board } from '../src/board/board';
import { INITIAL_FEN, dests, posFromFen } from '../src/core/chess';
import { mockBounds } from './helpers/dom';
let board:Board;let host:HTMLElement;
const onMove=vi.fn();const onTap=vi.fn();
function mount(mode:'select'|'both'|'drag'='select',color:'white'|'black'='white'){
 board=new Board(host,{orientation:color,size:800,coordinates:false,inputMode:mode,animation:false,premovable:true,onMove,onTouchTap:onTap});
 board.setPosition({fen:INITIAL_FEN,orientation:color,turnColor:color,movableColor:color,dests:dests(posFromFen(INITIAL_FEN))});
}
function touch(type:string,x:number,y:number,extra:Record<string,unknown>={}){
 const event=new Event(type,{bubbles:true,cancelable:true});
 const point={identifier:1,clientX:x,clientY:y};
 Object.defineProperties(event,Object.fromEntries(Object.entries({touches:type==='touchend'?[]:[point],changedTouches:[point],...extra}).map(([key,value])=>[key,{value}])));
 host.querySelector('cg-board')!.dispatchEvent(event);return event;
}
function tap(x:number,y:number){touch('touchstart',x,y);touch('touchend',x,y);}
beforeEach(()=>{vi.useFakeTimers();vi.clearAllMocks();mockBounds();vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});host=document.createElement('div');document.body.append(host);});
afterEach(()=>{board.destroy();vi.clearAllTimers();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();document.body.replaceChildren();});
describe('board touch gesture arbitration',()=>{
 it('select mode waits for a tap release and submits a move exactly once',async()=>{
  mount();touch('touchstart',450,650);expect(board.api.state.selected).toBeUndefined();touch('touchend',450,650);
  expect(board.api.state.selected).toBe('e2');tap(450,450);await vi.advanceTimersByTimeAsync(5);
  expect(onMove).toHaveBeenCalledExactlyOnceWith('e2','e4');
 });
 it('a swipe neither selects nor submits a square or answer',async()=>{
  mount();const start=touch('touchstart',450,650);touch('touchmove',450,550);touch('touchend',450,450);await vi.advanceTimersByTimeAsync(5);
  expect(start.defaultPrevented).toBe(false);expect(board.api.state.selected).toBeUndefined();expect(onMove).not.toHaveBeenCalled();expect(onTap).not.toHaveBeenCalled();
 });
 it('swiping with a selected piece does not make a move and keeps its selection',async()=>{
  mount();tap(450,650);touch('touchstart',450,450);touch('touchmove',450,350);touch('touchend',450,450);await vi.advanceTimersByTimeAsync(5);
  expect(board.api.state.selected).toBe('e2');expect(onMove).not.toHaveBeenCalled();
 });
 it('cancelled and multi-touch gestures do not submit taps',()=>{
  mount();touch('touchstart',450,650);touch('touchcancel',450,650);touch('touchend',450,650);
  touch('touchstart',450,650);touch('touchmove',450,650,{touches:[{identifier:1,clientX:450,clientY:650},{identifier:2,clientX:500,clientY:650}]});touch('touchend',450,650);
  expect(onTap).not.toHaveBeenCalled();
 });
 it('does not apply a tap to a position that changed during the gesture',()=>{
  mount();touch('touchstart',450,650);board.setOrientation('black');touch('touchend',450,650);expect(onTap).not.toHaveBeenCalled();
 });
 it('allows touch selection and premoves from the black side',async()=>{
  mount('select','black');board.setPosition({fen:INITIAL_FEN,orientation:'black',turnColor:'white',movableColor:'black'});
  tap(150,750);tap(250,550);await vi.advanceTimersByTimeAsync(5);
  expect(board.api.state.premovable.current).toEqual(['g8','f6']);expect(onMove).not.toHaveBeenCalled();
 });
 it('switches the native gesture policy when mode or exercise changes',()=>{
  mount('both');expect(board.wrap.dataset.touchDragColor).toBe('white');
  board.setOptions({inputMode:'select'});expect(board.wrap.dataset.touchDragColor).toBe('');
  board.setOptions({touchScroll:false});expect(board.wrap.dataset.touchScroll).toBe('false');
  const handler=vi.fn();board.wrap.addEventListener('pointerdown',handler);
  const event=new Event('pointerdown',{bubbles:true});Object.defineProperty(event,'pointerType',{value:'touch'});host.querySelector('cg-board')!.dispatchEvent(event);expect(handler).toHaveBeenCalledTimes(1);
 });
 it('read-only boards scroll and never select a piece',()=>{
  mount('both');board.setPosition({fen:INITIAL_FEN,orientation:'white',turnColor:'white',viewOnly:true});
  expect(board.wrap.dataset.touchDragColor).toBe('');tap(450,650);expect(board.api.state.selected).toBeUndefined();
 });
});
