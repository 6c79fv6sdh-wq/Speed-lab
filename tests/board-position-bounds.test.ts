import {it,expect,vi} from 'vitest';
import {Board} from '../src/board/board';
import {INITIAL_FEN} from '../src/core/chess';
import {flushRender} from './helpers/dom';

it.each(['badge','viewport'] as const)('refreshes mouse hit coordinates after %s moves the board without resizing it',async reason=>{
 let top=0;const size=400;
 const rect=vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(()=>({x:0,y:top,left:0,top,right:size,bottom:top+size,width:size,height:size,toJSON:()=>({})} as DOMRect));
 const scroll=vi.spyOn(window,'scrollBy').mockImplementation(()=>{});
 const host=document.createElement('div');document.body.append(host);
 const board=new Board(host,{orientation:'white',size,coordinates:true,inputMode:'both',animation:false});
 try{
  board.setPosition({fen:INITIAL_FEN,orientation:'white',turnColor:'white',movableColor:'white'});await flushRender();
  expect(board.api.state.dom.bounds().top).toBe(0);const originalSize=board.size;
  top=reason==='badge'?36:60;
  if(reason==='badge')board.setPosition({fen:INITIAL_FEN,orientation:'white',turnColor:'white',movableColor:'white',playerColor:'white'});
  else window.dispatchEvent(new Event('practice-layout-change'));
  expect(board.size).toBe(originalSize);expect(board.api.state.dom.bounds().top).toBe(top);
  expect(board.api.getKeyAtDomPos([size/8*.5,top+size/8*7.5])).toBe('a1');
 }finally{board.destroy();host.remove();rect.mockRestore();scroll.mockRestore();}
});
