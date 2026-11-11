import {it,expect,vi} from 'vitest';
import {generatePuzzle,neighbors,legalMoves,move,reached,remainingRoute,obstacles,checkpointProgress,plannerDefaults,validPlannerSettings,type Puzzle} from '../src/modules/path-planner/logic';
import {mountPathPlanner} from '../src/modules/path-planner';
import type {AppContext} from '../src/main';
const rng=(initial:number)=>{let seed=initial;return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);};
it('generates solvable static and changing puzzles for every first step and settings combination',()=>{
 for(const size of [5,6] as const)for(const movement of ['walk','knight'] as const)for(const checkpoints of [0,1,2] as const)for(const changing of [false,true])for(let seed=0;seed<20;seed++){
  const settings={...plannerDefaults,size,movement,checkpoints,changing};const p=generatePuzzle(settings,rng(seed));expect(p).toEqual(generatePuzzle(settings,rng(seed)));expect(p.checkpoints).toHaveLength(checkpoints);
  const route=remainingRoute(p,[p.start]);expect(route).not.toBeNull();let path=[p.start];for(const cell of route!.slice(1)){expect(legalMoves(p,path)).toContain(cell);path=move(p,path,cell)!;}expect(reached(p,path)).toBe(true);
  for(const first of legalMoves(p,[p.start])){const prefix=[p.start,first],walls=obstacles(p,prefix);expect(remainingRoute(p,prefix)).not.toBeNull();expect(walls).not.toContain(first);for(const cell of [p.start,p.goal,...p.checkpoints])expect(walls).not.toContain(cell);if(changing)expect(walls).not.toEqual(p.blocked);}
 }
});
it('finds exact shortest paths, requires ordered waypoints, rejects walls and non-neighbors',()=>{
 const p:Puzzle={size:5,movement:'walk',start:0,goal:4,checkpoints:[],blocked:[1],after:{},changing:false};expect(remainingRoute(p,[0])).toEqual([0,5,6,7,8,9,4]);expect(move(p,[0],1)).toBeNull();expect(move(p,[0],6)).toBeNull();expect(move(p,[0],5)).toEqual([0,5]);
 p.checkpoints=[3,2];expect(checkpointProgress(p,[0,1,2])).toBe(0);expect(reached(p,[0,1,2,3,4])).toBe(false);expect(reached(p,[0,1,2,3,2,3,4])).toBe(true);
 expect(neighbors(5,'knight',0).sort((a,b)=>a-b)).toEqual([7,11]);expect(neighbors(5,'walk',4).sort((a,b)=>a-b)).toEqual([3,9]);
});
it('undoing the first move restores the original map and replay produces exactly the same change',()=>{
 const p=generatePuzzle({...plannerDefaults},rng(8)),path=[p.start],next=move(p,path,legalMoves(p,path)[0])!;const original=obstacles(p,path),changed=obstacles(p,next);expect(changed).not.toEqual(original);expect(obstacles(p,next.slice(0,-1))).toEqual(original);expect(obstacles(p,move(p,path,next[1])!)).toEqual(changed);
});
it('validates settings without accepting unsupported sizes, rules or clocks',()=>{
 expect(validPlannerSettings(plannerDefaults)).toBe(true);for(const bad of [null,{}, {...plannerDefaults,size:20},{...plannerDefaults,movement:'queen'},{...plannerDefaults,checkpoints:3},{...plannerDefaults,seconds:-1}])expect(validPlannerSettings(bad)).toBe(false);
});
function mount(id:string){const root=document.createElement('main');document.body.append(root);const dispose=mountPathPlanner(root,{profile:{id}} as AppContext);return {root,dispose};}
const click=(root:HTMLElement,text:string)=>[...root.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===text)!.click();
function solve(root:HTMLElement){for(let i=0;i<150;i++){if(root.textContent!.includes('Цель достигнута!'))return;click(root,'Подсказка');const cell=root.querySelector<HTMLButtonElement>('.pp-hint');expect(cell).not.toBeNull();cell!.click();}throw Error('not solved');}
it('runs, hints, changes obstacles, undoes, solves once and stores results independently',()=>{
 const {root,dispose}=mount('planner-ui');try{
  root.querySelector<HTMLButtonElement>('[data-cell="1"]')!.click();expect(root.querySelector('.ml-stats')!.textContent).toContain('Ходов0');click(root,'Начать маршрут');click(root,'Подсказка');const next=root.querySelector<HTMLButtonElement>('.pp-hint')!;next.click();expect(root.querySelector('.pp-message')!.textContent).toContain('Поле изменилось');click(root,'← Назад');expect(root.querySelector('.ml-stats')!.textContent).toContain('Ходов0');solve(root);expect(root.querySelector('.ml-stats')!.textContent).toContain('Решено1');click(root,'Сбросить');click(root,'Начать маршрут');solve(root);expect(root.querySelector('.ml-stats')!.textContent).toContain('Решено1');const saved=JSON.parse(localStorage.getItem('sciencechess-planner:v1:planner-ui')!);expect(saved.results).toHaveLength(1);expect(saved.results[0].hints).toBeGreaterThan(0);
 }finally{dispose();root.remove();}
});
it('expires at its deadline, restarts the same board, and cancels timers on unmount',async()=>{
 vi.useFakeTimers();const id='planner-clock';localStorage.setItem(`sciencechess-planner:v1:${id}`,JSON.stringify({version:1,settings:{...plannerDefaults,seconds:60},results:[]}));const {root,dispose}=mount(id);
 try{const original=root.querySelector('.pp-grid')!.innerHTML;click(root,'Начать маршрут');await vi.advanceTimersByTimeAsync(60000);expect(root.querySelector('.pp-message')!.textContent).toContain('Время вышло');click(root,'Сбросить');expect(root.querySelector('.pp-grid')!.innerHTML).toBe(original);click(root,'Начать маршрут');dispose();const text=root.textContent;await vi.advanceTimersByTimeAsync(70000);expect(root.textContent).toBe(text);}finally{dispose();root.remove();vi.useRealTimers();}
});
it('pauses the optional clock while hidden without charging background time',async()=>{
 vi.useFakeTimers();const descriptor=Object.getOwnPropertyDescriptor(document,'hidden');Object.defineProperty(document,'hidden',{configurable:true,value:false});const id='planner-pause';localStorage.setItem(`sciencechess-planner:v1:${id}`,JSON.stringify({version:1,settings:{...plannerDefaults,seconds:60},results:[]}));const {root,dispose}=mount(id);
 try{click(root,'Начать маршрут');await vi.advanceTimersByTimeAsync(20000);Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));await vi.advanceTimersByTimeAsync(120000);expect(root.querySelector('.pp-message')!.textContent).not.toContain('Время вышло');Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));await vi.advanceTimersByTimeAsync(39900);expect(root.querySelector('.pp-message')!.textContent).not.toContain('Время вышло');await vi.advanceTimersByTimeAsync(100);expect(root.querySelector('.pp-message')!.textContent).toContain('Время вышло');}finally{dispose();root.remove();if(descriptor)Object.defineProperty(document,'hidden',descriptor);else delete (document as unknown as Record<string,unknown>).hidden;vi.useRealTimers();}
});
it('remains playable without storage and supports arrow-key focus without making a move',()=>{
 const blocked=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('blocked');});const {root,dispose}=mount('planner-no-storage');
 try{const first=root.querySelector<HTMLButtonElement>('[data-cell="0"]')!;first.focus();first.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));expect((document.activeElement as HTMLElement).dataset.cell).toBe('1');expect(root.querySelector('.ml-stats')!.textContent).toContain('Ходов0');click(root,'Начать маршрут');solve(root);expect(root.querySelector('.ml-stats')!.textContent).toContain('Решено1');expect(root.textContent).toContain('Сохранение недоступно');}finally{dispose();root.remove();blocked.mockRestore();}
});
