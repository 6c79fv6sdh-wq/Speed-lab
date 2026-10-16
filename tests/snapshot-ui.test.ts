import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ allSessions:vi.fn(async()=>[]), activeProfileId:vi.fn(async()=>'p'), putSession:vi.fn(async()=>{}), putMeasurement:vi.fn(async()=>{}), uid:vi.fn(()=>crypto.randomUUID()) }));
vi.mock('../src/core/db',()=>db);
import { mountReaction } from '../src/modules/reaction';
import { DEFAULT_CALIBRATION } from '../src/core/settings';
import { mockBounds } from './helpers/dom';
import type { AppContext } from '../src/main';

let root:HTMLElement;
let unmount:()=>void;
const button=(text:string)=>[...root.querySelectorAll<HTMLButtonElement>('.sn-area button')].find(button=>button.textContent===text)!;
beforeEach(()=>{
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver',class { observe(){} disconnect(){} });
  mockBounds();
  root=document.createElement('div');document.body.append(root);
  const ctx={calibration:{...DEFAULT_CALIBRATION},profile:{id:'p',name:'Test'},setCalibration:vi.fn(),setProfileName:vi.fn(),signOut:vi.fn()} as unknown as AppContext;
  unmount=mountReaction(root,ctx);
  [...root.querySelectorAll<HTMLButtonElement>('.seg-btn')].find(button=>button.textContent==='Snapshot')!.click();
});
afterEach(async()=>{unmount();await Promise.resolve();vi.clearAllTimers();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();document.body.replaceChildren();});
function start(level:number){root.querySelector<HTMLButtonElement>(`[aria-label="Уровень ${level}"]`)!.click();button('Старт').click();}
async function expose(){await vi.advanceTimersByTimeAsync(500);vi.advanceTimersToNextFrame();}
async function recall(){await expose();await vi.advanceTimersByTimeAsync(3350);}
function pieces(){return [...root.querySelectorAll<HTMLElement>('.sn-board .sn-sq')].map(square=>square.querySelector<HTMLElement>('.sn-piece')?.dataset.piece??'');}
function place(original:string[],wrongLast=false){
  const squares=[...root.querySelectorAll<HTMLButtonElement>('.sn-board .sn-sq')];
  const missing=squares.map((square,i)=>original[i]&&!square.querySelector('.sn-piece')?i:-1).filter(i=>i>=0);
  for(const [i,index] of missing.entries()){
    const choice=[...root.querySelectorAll<HTMLButtonElement>('.sn-panel-piece')].find(button=>(button.firstElementChild as HTMLElement).dataset.piece===original[index]);
    if(!choice)throw Error('Missing matching panel piece');choice.click();
    const target=wrongLast&&i===missing.length-1?original.findIndex(value=>!value):index;
    squares[target].click();
  }
  return missing.length;
}

describe('Snapshot UI timing and manual progression',()=>{
  it.each([1,2,3,4,5])('level %i removes exactly N pieces after three seconds and leaves unlimited recall',async level=>{
    start(level);await expose();const original=pieces();const full=original.filter(Boolean).length;
    expect(root.querySelector('.sn-exposure-progress')?.getAttribute('hidden')).toBeNull();
    expect(root.querySelector<HTMLButtonElement>('[aria-label="Уровень 5"]')!.disabled).toBe(true);
    await vi.advanceTimersByTimeAsync(2999);expect(pieces().filter(Boolean)).toHaveLength(full);
    await vi.advanceTimersByTimeAsync(1);expect(pieces().filter(Boolean)).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(350);expect(pieces().filter(Boolean)).toHaveLength(full-level);
    expect(root.querySelectorAll('.sn-panel-piece')).toHaveLength(level);
    await vi.advanceTimersByTimeAsync(60000);expect(root.querySelectorAll('.sn-panel-piece')).toHaveLength(level);
    const counter=root.querySelector('.sn-counter')?.textContent??root.querySelector('.sn-area .ks-counter')!.textContent;
    expect(place(original,true)).toBe(level);button('Готово').click();
    expect(root.querySelector('.sn-area [aria-live="polite"].prompt')!.textContent).toBe(`Верно: ${level-1} из ${level}`);
    expect(root.querySelectorAll('.sn-result-mark--bad').length).toBeGreaterThan(0);
    expect(root.querySelectorAll('.sn-result-mark--ok')).toHaveLength(level-1);
    await vi.advanceTimersByTimeAsync(20000);
    expect(root.querySelector('.sn-area .ks-counter')!.textContent).toBe(counter);
    expect(button('Дальше').style.display).not.toBe('none');
    button('Дальше').click();expect(root.querySelector('.sn-area .ks-counter')!.textContent).not.toBe(counter);
  });
  it('clears exposure timers on exit and on a fresh run',async()=>{
    start(3);await expose();
    [...root.querySelectorAll<HTMLButtonElement>('.seg-btn')].find(button=>button.textContent==='Что висит?')!.click();
    await vi.advanceTimersByTimeAsync(10000);
    expect(root.querySelectorAll('.sn-panel-piece')).toHaveLength(0);
    [...root.querySelectorAll<HTMLButtonElement>('.seg-btn')].find(button=>button.textContent==='Snapshot')!.click();
    await vi.advanceTimersByTimeAsync(0);start(1);await recall();expect(root.querySelectorAll('.sn-panel-piece')).toHaveLength(1);
    unmount();unmount=()=>{};const content=root.innerHTML;await vi.advanceTimersByTimeAsync(10000);expect(root.innerHTML).toBe(content);
  });
  it('does not run exposure timers in a hidden tab and restarts the same task on return',async()=>{
    start(2);await expose();
    const hidden=vi.spyOn(document,'hidden','get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(10000);
    expect(root.querySelectorAll('.sn-panel-piece')).toHaveLength(0);
    hidden.mockReturnValue(false);document.dispatchEvent(new Event('visibilitychange'));
    await recall();expect(root.querySelectorAll('.sn-panel-piece')).toHaveLength(2);
  });
  it('records the chosen level with a fully completed 16-attempt session',async()=>{
    start(4);
    for(let i=0;i<18;i++){
      await expose();const original=pieces();await vi.advanceTimersByTimeAsync(3350);
      place(original);button('Готово').click();button('Дальше').click();
    }
    await vi.advanceTimersByTimeAsync(0);
    expect(db.putMeasurement).toHaveBeenCalledTimes(16);
    expect(db.putMeasurement.mock.calls.every(args=>(args as unknown as [{mode:string;data:{level:number;exposureMs:number}}])[0].mode==='snapshot:level-4'&&(args as unknown as [{data:{level:number}}])[0].data.level===4)).toBe(true);
    expect(db.putSession).toHaveBeenCalledWith(expect.objectContaining({mode:'snapshot:level-4',summary:expect.objectContaining({level:4,attempts:16})}));
  });
});
