import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Board } from '../src/board/board';
import { mockBounds } from './helpers/dom';
let board:Board;let host:HTMLElement;
beforeEach(()=>{vi.useFakeTimers();mockBounds();vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});host=document.createElement('div');document.body.append(host);});
afterEach(()=>{board.destroy();vi.clearAllTimers();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();document.body.replaceChildren();});
describe('shape rendering when a view-only board becomes interactive',()=>{
 it.each([true,false])('paints the first target despite an old pending redraw (animation=%s)',async animation=>{
  board=new Board(host,{orientation:'white',size:480,coordinates:true,inputMode:'both',viewOnly:true,animation});
  board.setPosition({fen:'8/8/8/8/8/8/8/8 w - - 0 1',orientation:'white',turnColor:'white',viewOnly:true});
  await vi.advanceTimersByTimeAsync(32);
  // Starting Route queues an options redraw before remounting the board.
  board.setOptions({touchScroll:false});
  board.setPosition({fen:'8/8/8/8/8/8/8/R7 w - - 0 1',orientation:'white',turnColor:'white',movableColor:'white',dests:new Map([['a1',['a5']]]),viewOnly:false});
  board.api.setAutoShapes([{orig:'a5',brush:'green'}]);
  await vi.advanceTimersByTimeAsync(250);
  expect(board.api.state.drawable.autoShapes).toEqual([{orig:'a5',brush:'green'}]);
  expect(host.querySelectorAll('.cg-shapes circle[stroke="#00b85a"]')).toHaveLength(1);
  // The same target must survive an options-triggered remount as well.
  board.setOptions({coordinates:false});await vi.advanceTimersByTimeAsync(32);
  expect(host.querySelectorAll('.cg-shapes circle[stroke="#00b85a"]')).toHaveLength(1);
 });
 it('cancels its repair frame when destroyed',()=>{
  board=new Board(host,{orientation:'white',size:480,coordinates:true,inputMode:'both'});
  board.setOptions({coordinates:false});board.destroy();
  expect(()=>vi.advanceTimersToNextFrame()).not.toThrow();
 });
});
