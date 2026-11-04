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
it('survival ends on the first error, restores the ended state, and restarts cleanly',async()=>{
 vi.useFakeTimers();const root=document.createElement('main');document.body.append(root);const ctx={profile:{id:'flow-survival-unit'}} as AppContext;let dispose=mountAdditionFlow(root,ctx);
 const choose=(n:number)=>root.querySelector<HTMLButtonElement>(`[data-value="${n}"]`)!.click();
 try{
  const mode=root.querySelector<HTMLSelectElement>('[aria-label="Режим"]')!;mode.value='survival';mode.dispatchEvent(new Event('change'));
  expect(root.querySelectorAll('.ml-flow-heart')).toHaveLength(1);
  const sum=()=>[...root.querySelector('.ml-equation')!.textContent!.matchAll(/\d+/g)].reduce((n,m)=>n+Number(m[0]),0);
  choose(sum());await vi.advanceTimersByTimeAsync(350);choose(0);choose(0);
  expect(root.textContent).toContain('Попытка завершена');expect(root.querySelectorAll('.ml-flow-heart')).toHaveLength(0);expect(root.querySelector('.ml-stats')!.textContent).toContain('Точность50%');
  expect([...root.querySelectorAll<HTMLButtonElement>('.ml-keypad button')].every(b=>b.disabled)).toBe(true);
  dispose();root.replaceChildren();dispose=mountAdditionFlow(root,ctx);expect(root.textContent).toContain('Попытка завершена');
  [...root.querySelectorAll('button')].find(b=>b.textContent==='Новая попытка')!.click();expect(root.querySelectorAll('.ml-flow-heart')).toHaveLength(1);expect(root.querySelector('.ml-stats')!.textContent).toContain('Решено0');
 }finally{dispose();root.remove();vi.useRealTimers();}
});
it('three lives disappear once per separate error and mode changes cancel pending cooldowns',async()=>{
 vi.useFakeTimers();const root=document.createElement('main');document.body.append(root);const dispose=mountAdditionFlow(root,{profile:{id:'flow-three-unit'}} as AppContext);
 try{
  const mode=root.querySelector<HTMLSelectElement>('[aria-label="Режим"]')!;mode.value='lives';mode.dispatchEvent(new Event('change'));
  const wrong=()=>root.querySelector<HTMLButtonElement>('[data-value="0"]')!.click();
  expect(root.querySelectorAll('.ml-flow-heart')).toHaveLength(3);wrong();wrong();expect(root.querySelectorAll('.ml-flow-heart')).toHaveLength(2);
  await vi.advanceTimersByTimeAsync(350);wrong();expect(root.querySelectorAll('.ml-flow-heart')).toHaveLength(1);
  await vi.advanceTimersByTimeAsync(350);wrong();expect(root.querySelectorAll('.ml-flow-heart')).toHaveLength(0);expect(root.textContent).toContain('Попытка завершена');
  mode.value='lives';mode.dispatchEvent(new Event('change'));wrong();mode.value='endless';mode.dispatchEvent(new Event('change'));await vi.advanceTimersByTimeAsync(1000);
  expect(root.querySelector<HTMLElement>('.ml-flow-lives')!.hidden).toBe(true);expect(root.querySelector('.ml-stats')!.textContent).toContain('Ошибок0');wrong();expect(root.textContent).toContain('Попробуй ещё раз');expect(root.querySelector('.ml-flow-result')!.hasAttribute('hidden')).toBe(true);
 }finally{dispose();root.remove();vi.useRealTimers();}
});
it('preserves legacy endless progress and rejects inconsistent life snapshots',()=>{
 const old={version:1,limit:10,task:{a:3,b:4},hadError:false,solved:7,correct:6,errors:1};const id='flow-legacy';localStorage.setItem(`sciencechess-mathlab:v1:${id}:addition-flow`,JSON.stringify(old));
 const root=document.createElement('main');const dispose=mountAdditionFlow(root,{profile:{id}} as AppContext);
 try{expect(root.querySelector('.ml-stats')!.textContent).toContain('Решено7');expect(root.querySelector<HTMLSelectElement>('[aria-label="Режим"]')!.value).toBe('endless');}finally{dispose();}
 expect(validFlow({...old,mode:'lives',lives:0,ended:false})).toBe(false);expect(validFlow({...old,mode:'lives',lives:-1,ended:true})).toBe(false);expect(validFlow({...old,mode:'survival',lives:3,ended:false})).toBe(false);expect(validFlow({...old,mode:'lives',lives:0,ended:true})).toBe(true);
});
