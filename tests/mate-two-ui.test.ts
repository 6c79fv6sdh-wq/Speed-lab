import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Board as BoardType } from '../src/board/board';
const state=vi.hoisted(()=>({board:null as unknown}));
const db=vi.hoisted(()=>({allSessions:vi.fn(async()=>[]),activeProfileId:vi.fn(async()=>'p'),putSession:vi.fn(async()=>{}),putMeasurement:vi.fn(async()=>{}),uid:vi.fn(()=>crypto.randomUUID())}));
vi.mock('../src/core/db',()=>db);
vi.mock('../src/board/board',async original=>{const {Board}=await original<typeof import('../src/board/board')>();return {Board:class extends Board{constructor(...args:ConstructorParameters<typeof Board>){super(...args);state.board=this;}}};});
import { mountReaction } from '../src/modules/reaction';
import { MATE_TWO_PUZZLES } from '../src/data/puzzles-mate-two';
import { allLegalMoves, posFromFen, uciOf } from '../src/core/chess';
import { DEFAULT_CALIBRATION } from '../src/core/settings';
import { mockBounds } from './helpers/dom';
import type { AppContext } from '../src/main';
import type {Key} from 'chessground/types';
let root:HTMLElement;let unmount:(()=>void)|undefined;
const board=()=>state.board as BoardType;
const click=(name:string)=>[...root.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===name)!.click();
async function flush(){for(let i=0;i<20;i++)await Promise.resolve();}
async function move(uci:string){board().api.selectSquare(uci.slice(0,2) as Key);board().api.selectSquare(uci.slice(2,4) as Key);await vi.advanceTimersByTimeAsync(5);}
async function start(){click('Мат в 2');await flush();click('Старт');}
const puzzle=()=>MATE_TWO_PUZZLES.find(p=>p.fen.split(' ')[0]===board().api.getFen())!;
beforeEach(()=>{vi.useFakeTimers();vi.clearAllMocks();vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});mockBounds();root=document.createElement('div');document.body.append(root);unmount=mountReaction(root,{calibration:DEFAULT_CALIBRATION,profile:{id:'p',name:'Test'},setCalibration:vi.fn()} as unknown as AppContext);});
afterEach(async()=>{unmount?.();await flush();vi.clearAllTimers();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();document.body.replaceChildren();});
it('records one result only after both own moves, accepts every final alternative',async()=>{
 await start(); const p=puzzle();
 await move(p.solution.firstUci);expect(db.putMeasurement).not.toHaveBeenCalled();
 expect(root.textContent).toContain('Ход соперника.');
 await vi.advanceTimersByTimeAsync(410);
 const last=board().api.state.lastMove!.join('');
 const branch=p.solution.branches.find(b=>b.replyUci===last)!;
 await move(branch.winningUcis.at(-1)!);
 expect(db.putMeasurement).toHaveBeenCalledTimes(1);
 expect(root.textContent).toContain('Верно,');
 const saved=db.putMeasurement.mock.calls[0] as unknown as [{data:Record<string,unknown>}];
 expect(saved[0].data.correct).toBe(true);
 expect(saved[0].data.puzzleId).toBe(p.id);
 expect(saved[0].data.fen).toBe(p.fen);
});
it.each(['Прервать','Мат в 1'])('cancels the delayed defence on %s',async action=>{
 await start();await move(puzzle().solution.firstUci);
 click(action);await flush();const fen=board().api.getFen();
 await vi.advanceTimersByTimeAsync(2000);
 expect(board().api.getFen()).toBe(fen);expect(db.putMeasurement).not.toHaveBeenCalled();
});
it('cancels the delayed defence when unmounted',async()=>{
 await start();await move(puzzle().solution.firstUci);unmount!();unmount=undefined;
 await vi.advanceTimersByTimeAsync(2000);expect(db.putMeasurement).not.toHaveBeenCalled();
});

it('marks a wrong first move as one failed task',async()=>{
 await start();const p=puzzle();const wrong=allLegalMoves(posFromFen(p.fen)).map(uciOf).find(m=>m!==p.solution.firstUci)!;
 await move(wrong);expect(db.putMeasurement).toHaveBeenCalledTimes(1);expect(root.textContent).toContain('Мимо.');
 await vi.advanceTimersByTimeAsync(500);expect(db.putMeasurement).toHaveBeenCalledTimes(1);
});
it('times out the final move without recording the correct key separately',async()=>{
 await start();const p=puzzle();await move(p.solution.firstUci);click('0,5 с');
 await vi.advanceTimersByTimeAsync(410);expect(db.putMeasurement).not.toHaveBeenCalled();
 await vi.advanceTimersByTimeAsync(500);expect(db.putMeasurement).toHaveBeenCalledTimes(1);expect(root.textContent).toContain('Время вышло.');
});

async function startFor(color:'white'|'black') {
 const index=MATE_TWO_PUZZLES.findIndex(p=>p.sideToMove===color);
 let i=MATE_TWO_PUZZLES.length-1;
 vi.spyOn(Math,'random').mockImplementation(()=>{
  if(i<1)return 0; // Pick the first defence reproducibly.
  const j=i===index?0:i;
  return (j+0.1)/(i--+1);
 });
 await start();expect(puzzle().sideToMove).toBe(color);
}
it.each(['white','black'] as const)('executes a legal queued mate exactly once for %s',async color=>{
 await startFor(color);const p=puzzle();await move(p.solution.firstUci);
 await move(p.solution.branches[0].winningUcis[0]);expect(board().hasPremove()).toBe(true);
 expect(db.putMeasurement).not.toHaveBeenCalled();
 await vi.advanceTimersByTimeAsync(420);
 expect(board().hasPremove()).toBe(false);expect(db.putMeasurement).toHaveBeenCalledTimes(1);
 expect(root.textContent).toContain('Верно,');
});
it('allows cancellation of the queued mate without submitting an answer',async()=>{
 await startFor('white');const p=puzzle();await move(p.solution.firstUci);
 await move(p.solution.branches[0].winningUcis[0]);expect(board().hasPremove()).toBe(true);
 click('Отменить премув');expect(board().hasPremove()).toBe(false);
 await vi.advanceTimersByTimeAsync(420);expect(db.putMeasurement).not.toHaveBeenCalled();
 await move(p.solution.branches[0].winningUcis[0]);expect(root.textContent).toContain('Верно,');
});
it('drops an illegal premove and leaves the final move available',async()=>{
 await startFor('white');const p=puzzle();await move(p.solution.firstUci);
 const after=posFromFen(p.fen);after.play((await import('../src/core/chess')).moveFromUci(p.solution.firstUci));after.play((await import('../src/core/chess')).moveFromUci(p.solution.branches[0].replyUci));
 const legal=new Set(allLegalMoves(after).map(m=>uciOf(m).slice(0,4)));
 let queued=false;
 for(const [key,piece] of board().api.state.pieces){
  if(piece.color!==p.sideToMove)continue;
  board().api.cancelMove();board().api.selectSquare(key);
  const to=board().api.state.premovable.dests?.find(to=>!legal.has(key+to));
  if(to){board().api.selectSquare(to);queued=true;break;}
 }
 expect(queued).toBe(true);expect(board().hasPremove()).toBe(true);
 await vi.advanceTimersByTimeAsync(420);expect(board().hasPremove()).toBe(false);expect(db.putMeasurement).not.toHaveBeenCalled();
 await move(p.solution.branches[0].winningUcis[0]);expect(root.textContent).toContain('Верно,');
});
