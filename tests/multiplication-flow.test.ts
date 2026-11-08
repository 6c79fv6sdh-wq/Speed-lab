import {it,expect,vi} from 'vitest';
import {AdditionDeck,MultiplicationDeck,arithmeticChoices,multiplicationTotal,validFlow,mountAdditionFlow,mountMultiplicationFlow} from '../src/modules/mathlab/addition-flow';
import type {AppContext} from '../src/main';
const rng=(initial:number)=>{let seed=initial;return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);};
const canonical=(task:{a:number;b:number})=>[task.a,task.b].sort((a,b)=>a-b).join(':');
it('covers every table fact and hard multiplication without immediate reversed repeats',()=>{
 for(const limit of [10,100] as const){const deck=new MultiplicationDeck(limit,rng(3)),same=new MultiplicationDeck(limit,rng(3));const seen=new Set();let previous;
  const length=limit===10?55:89*8;
  for(let i=0;i<length*3;i++){
   const task=deck.next(previous);expect(task).toEqual(same.next(previous));expect(Number.isInteger(multiplicationTotal(task))).toBe(true);
   const [small,big]=[task.a,task.b].sort((a,b)=>a-b);
   expect(small).toBeGreaterThanOrEqual(limit===10?1:2);expect(small).toBeLessThanOrEqual(limit===10?10:9);expect(big).toBeGreaterThanOrEqual(limit===10?1:11);expect(big).toBeLessThanOrEqual(limit===10?10:99);
   if(previous)expect(canonical(task)).not.toBe(canonical(previous));if(i<length){expect(seen.has(canonical(task))).toBe(false);seen.add(canonical(task));}previous=task;
  }expect(seen.size).toBe(length);
 }
});
it('hard addition always has two two-digit operands and a sum at most 100',()=>{
 const deck=new AdditionDeck(100,rng(4));let previous;
 for(let i=0;i<3000;i++){const task=deck.next(previous);expect(task.a).toBeGreaterThanOrEqual(10);expect(task.b).toBeGreaterThanOrEqual(10);expect(task.a+task.b).toBeLessThanOrEqual(100);if(previous)expect(canonical(task)).not.toBe(canonical(previous));previous=task;}
});
it('four choices always include exactly one correct nonnegative result in varied positions',()=>{
 for(const operation of ['addition','multiplication'] as const){const random=rng(5),positions=new Set();
  for(let a=1;a<=99;a++)for(const b of [1,2,5,9,10]){const choices=arithmeticChoices({a,b},operation,random),correct=operation==='addition'?a+b:a*b;expect(choices).toHaveLength(4);expect(new Set(choices).size).toBe(4);expect(choices.every(n=>Number.isInteger(n)&&n>=0)).toBe(true);expect(choices.filter(n=>n===correct)).toHaveLength(1);positions.add(choices.indexOf(correct));}expect(positions.size).toBe(4);
 }
});
it('keeps table-boundary distractors close to the result and within the table range',()=>{
 const values=arithmeticChoices({a:10,b:10},'multiplication',rng(7));expect(values).toHaveLength(4);expect(values.every(n=>n>=90&&n<=100)).toBe(true);
});
it('validates operation-specific ranges and preserves old addition snapshots',()=>{
 const base={version:1,limit:10,task:{a:8,b:5},hadError:false,solved:4,correct:3,errors:1};
 expect(validFlow({...base,task:{a:3,b:5}})).toBe(true);expect(validFlow(base,'multiplication')).toBe(true);expect(validFlow(base)).toBe(false);
 for(const task of [{a:11,b:9},{a:9,b:99}])expect(validFlow({...base,limit:100,task},'multiplication')).toBe(true);
 for(const task of [{a:10,b:9},{a:100,b:9},{a:11,b:10},{a:12,b:12}])expect(validFlow({...base,limit:100,task},'multiplication')).toBe(false);
 expect(validFlow({...base,limit:20},'multiplication')).toBe(false);expect(validFlow({...base,limit:100,task:{a:44,b:56}})).toBe(true);expect(validFlow({...base,limit:100,task:{a:44,b:57}})).toBe(false);
});
for(const operation of ['addition','multiplication'] as const)for(const difficulty of ['easy','hard'])it(`${operation} ${difficulty}: scores once, survives, saves, restarts and cancels old timers`,async()=>{
 vi.useFakeTimers();const id=`arithmetic-${operation}-${difficulty}`,root=document.createElement('main');document.body.append(root);const ctx={profile:{id}} as AppContext;const mount=operation==='addition'?mountAdditionFlow:mountMultiplicationFlow;let dispose=mount(root,ctx);
 const set=(label:string,value:string)=>{const select=root.querySelector<HTMLSelectElement>(`[aria-label="${label}"]`)!;select.value=value;select.dispatchEvent(new Event('change'));};
 const task=()=>{const nums=root.querySelector('.ml-equation')!.textContent!.match(/\d+/g)!.map(Number);return operation==='addition'?nums[0]+nums[1]:nums[0]*nums[1];};
 const choose=(n:number)=>root.querySelector<HTMLButtonElement>(`[data-value="${n}"]`)!.click();
 const wrong=()=>[...root.querySelectorAll<HTMLButtonElement>('.ml-keypad button')].find(b=>Number(b.dataset.value)!==task())!.click();
 try{
  set('Сложность',difficulty);set('Режим','lives');expect(root.querySelectorAll('.ml-flow-heart')).toHaveLength(3);
  if(operation==='multiplication'||difficulty==='hard')expect(root.querySelectorAll('.ml-keypad button')).toHaveLength(4);
  choose(task());choose(task());expect(root.querySelector('.ml-stats')!.textContent).toContain('Решено1');await vi.advanceTimersByTimeAsync(350);
  wrong();wrong();expect(root.querySelectorAll('.ml-flow-heart')).toHaveLength(2);await vi.advanceTimersByTimeAsync(350);choose(task());await vi.advanceTimersByTimeAsync(350);expect(root.querySelector('.ml-stats')!.textContent).toContain('Точность50%');
  dispose();root.replaceChildren();dispose=mount(root,ctx);expect(root.querySelector<HTMLSelectElement>('[aria-label="Сложность"]')!.value).toBe(difficulty);expect(root.querySelector('.ml-stats')!.textContent).toContain('Решено2');expect(root.querySelectorAll('.ml-flow-heart')).toHaveLength(2);
  set('Режим','survival');wrong();expect(root.textContent).toContain('Попытка завершена');expect(root.querySelectorAll('.ml-flow-heart')).toHaveLength(0);
  [...root.querySelectorAll('button')].find(b=>b.textContent==='Новая попытка')!.click();expect(root.querySelectorAll('.ml-flow-heart')).toHaveLength(1);choose(task());set('Сложность',difficulty==='easy'?'hard':'easy');const current=root.querySelector('.ml-equation')!.textContent;await vi.advanceTimersByTimeAsync(500);expect(root.querySelector('.ml-equation')!.textContent).toBe(current);expect(root.querySelector('.ml-stats')!.textContent).toContain('Решено0');
  choose(task());dispose();const prior=root.textContent;await vi.advanceTimersByTimeAsync(500);expect(root.textContent).toBe(prior);
 }finally{dispose();root.remove();vi.useRealTimers();}
});
it('keeps addition and multiplication progress independent for the same profile',()=>{
 const id='separate-arithmetic';localStorage.setItem(`sciencechess-mathlab:v1:${id}:addition-flow`,JSON.stringify({version:1,limit:20,task:{a:8,b:9},hadError:false,solved:79,correct:78,errors:1}));const ctx={profile:{id}} as AppContext;
 const root=document.createElement('main');let dispose=mountMultiplicationFlow(root,ctx);expect(root.querySelector('.ml-stats')!.textContent).toContain('Решено0');dispose();root.replaceChildren();dispose=mountAdditionFlow(root,ctx);expect(root.querySelector('.ml-stats')!.textContent).toContain('Решено79');dispose();
});
