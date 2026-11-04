import {it,expect,vi} from 'vitest';
import {AdditionDeck,additionTotal,validFlow,mountAdditionFlow} from '../src/modules/mathlab/addition-flow';
import type {AppContext} from '../src/main';
it('streams small additions forever without immediate reversals or repeating within a deck',()=>{
 for(const limit of [10,20] as const){let seed=7;const deck=new AdditionDeck(limit,()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296));let previous;const seen=new Set();const count=limit===10?25:100;
  for(let i=0;i<3000;i++){const task=deck.next(previous);const canonical=[task.a,task.b].sort((a,b)=>a-b).join(':');expect(additionTotal(task)).toBeLessThanOrEqual(limit);expect(task.a).toBeGreaterThan(0);expect(task.b).toBeGreaterThan(0);if(previous)expect(canonical).not.toBe([previous.a,previous.b].sort((a,b)=>a-b).join(':'));if(i<count){expect(seen.has(canonical)).toBe(false);seen.add(canonical);}previous=task;}
 }
});
it('rejects malformed progress without touching other exercise data',()=>{
 const good={version:1,limit:10,task:{a:5,b:3},hadError:false,solved:10,correct:9,errors:1};expect(validFlow(good)).toBe(true);
 for(const bad of [null,{}, {...good,limit:100},{...good,task:{a:9,b:9}},{...good,correct:11},{...good,solved:-1},{...good,hadError:'no'}])expect(validFlow(bad)).toBe(false);
});
it('counts first-try accuracy, locks duplicate answers, resumes progress and cancels old transitions',async()=>{
 vi.useFakeTimers();const root=document.createElement('main');document.body.append(root);const ctx={profile:{id:'addition-unit'}} as AppContext;let dispose=mountAdditionFlow(root,ctx);
 const choose=(n:number)=>root.querySelector<HTMLButtonElement>(`[data-value="${n}"]`)!.click();const sum=()=>[...root.querySelector('.ml-equation')!.textContent!.matchAll(/\d+/g)].reduce((n,m)=>n+Number(m[0]),0);
 try{
  choose(0);expect(root.textContent).toContain('Попробуй ещё раз');const expected=sum();choose(expected);choose(expected);expect(root.querySelector('.ml-stats')!.textContent).toContain('Решено1');expect(root.querySelector('.ml-stats')!.textContent).toContain('Точность0%');
  await vi.advanceTimersByTimeAsync(350);choose(sum());await vi.advanceTimersByTimeAsync(350);expect(root.querySelector('.ml-stats')!.textContent).toContain('Точность50%');
  dispose();root.replaceChildren();dispose=mountAdditionFlow(root,ctx);expect(root.querySelector('.ml-stats')!.textContent).toContain('Решено2');
  choose(sum());const prior=root.textContent;dispose();await vi.advanceTimersByTimeAsync(1000);expect(root.textContent).toBe(prior);
 }finally{dispose();root.remove();vi.useRealTimers();}
});
it('works when local storage is blocked and resets safely while transitioning',async()=>{
 vi.useFakeTimers();const storage=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('blocked');});const root=document.createElement('main');document.body.append(root);const dispose=mountAdditionFlow(root,{profile:{id:'addition-blocked'}} as AppContext);
 try{
  root.querySelector<HTMLButtonElement>('[data-value="0"]')!.click();expect(root.textContent).toContain('только в этой вкладке');
  const n=[...root.querySelector('.ml-equation')!.textContent!.matchAll(/\d+/g)].reduce((n,m)=>n+Number(m[0]),0);root.querySelector<HTMLButtonElement>(`[data-value="${n}"]`)!.click();
  const select=root.querySelector('select')!;select.value='20';select.dispatchEvent(new Event('change'));const text=root.querySelector('.ml-equation')!.textContent;
  await vi.advanceTimersByTimeAsync(1000);expect(root.querySelector('.ml-equation')!.textContent).toBe(text);expect(root.querySelectorAll('.ml-keypad button')).toHaveLength(21);expect(root.querySelector('.ml-stats')!.textContent).toContain('Решено0');
 }finally{dispose();root.remove();storage.mockRestore();vi.useRealTimers();}
});
