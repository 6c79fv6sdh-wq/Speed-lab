import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {mathExercise} from '../src/modules/mathlab';
import {defaults,generate} from '../src/modules/mathlab/logic';
import type {AppContext} from '../src/main';
let root:HTMLElement;let unmount:(()=>void)|undefined;let profile=0;
const ctx=()=>({profile:{id:`math-test-${profile++}`}} as AppContext);
const button=(name:string)=>[...root.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===name)!;
const select=(label:string,value:string)=>{const control=root.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;control.value=value;control.dispatchEvent(new Event('change',{bubbles:true}));};
const input=(label:string,value:string)=>{const control=root.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;control.value=value;control.dispatchEvent(new Event('change',{bubbles:true}));return control;};
function answer(value:string){input('Ответ',value);root.querySelector('form')!.dispatchEvent(new Event('submit',{cancelable:true}));}
beforeEach(()=>{vi.useFakeTimers();root=document.createElement('div');document.body.append(root);});
afterEach(()=>{unmount?.();vi.clearAllTimers();vi.useRealTimers();vi.restoreAllMocks();document.body.replaceChildren();});
it('updates the builder live, persists the selected whole and never leaks the unknown',()=>{
 unmount=mathExercise('builder')(root,ctx());input('Целое число','5');const range=root.querySelector<HTMLInputElement>('input[type=range]')!;range.value='2';range.dispatchEvent(new Event('input'));expect(root.textContent).toContain('5 = 2 + 3');button('Поменять местами').click();expect(root.textContent).toContain('5 = 3 + 2');
 select('Режим','train');button('Начать').click();expect(root.querySelector('input[type=range]')).toBeNull();expect(root.querySelector('.ml-parts')).toBeNull();expect(root.textContent).toContain('?');
});
it('hides dots at the selected deadline and ignores duplicate submissions',async()=>{
 unmount=mathExercise('glance')(root,ctx());select('Время показа','500');button('Начать').click();expect(root.querySelector('form')).toBeNull();
 await vi.advanceTimersByTimeAsync(600);expect(root.querySelectorAll('.ml-dot').length).toBeGreaterThan(0);
 await vi.advanceTimersByTimeAsync(499);expect(root.querySelectorAll('.ml-dot').length).toBeGreaterThan(0);
 await vi.advanceTimersByTimeAsync(1);expect(root.querySelectorAll('.ml-dot')).toHaveLength(0);answer('0');expect(root.textContent).toContain('Правильный ответ');
 answer('0');button('Далее').click();expect(root.textContent).toContain('Задание 2 из 10');
});
it('cancels an interrupted exposure without scoring and cleans timers on exit',async()=>{
 unmount=mathExercise('glance')(root,ctx());button('Начать').click();await vi.advanceTimersByTimeAsync(600);
 vi.spyOn(document,'hidden','get').mockReturnValue(true);document.dispatchEvent(new Event('visibilitychange'));
 expect(root.querySelector('.ml-dot')).toBeNull();expect(root.textContent).toContain('без штрафа');await vi.advanceTimersByTimeAsync(6000);expect(root.querySelector('form')).toBeNull();
 button('Повторить показ').click();unmount();unmount=undefined;const text=root.textContent;await vi.advanceTimersByTimeAsync(10000);expect(root.textContent).toBe(text);
});
it('keeps first-answer accuracy when retrying a friends task and saves a completed series',()=>{
 const context=ctx();unmount=mathExercise('friends')(root,context);select('Заданий в серии','5');
 vi.spyOn(Math,'random').mockReturnValue(0);button('Начать').click();answer('0');expect(root.textContent).toContain('Правильный ответ: 9');button('Попробовать ещё раз').click();answer('9');button('Далее').click();
 for(let i=0;i<4;i++){answer('9');button(i===3?'Результат':'Далее').click();}
 expect(root.textContent).toContain('4 из 5');expect(root.textContent).toContain('80%');expect(localStorage.getItem(`sciencechess-mathlab:v1:${context.profile.id}:results`)).toContain('"errors":1');
});
it('moves balls by keyboard-compatible clicks, preserves colors and supports undo/reset',()=>{
 unmount=mathExercise('bridge')(root,ctx());expect(root.querySelectorAll('.ml-boxes .ml-ball')).toHaveLength(13);
 const clickCell=(side:string,index:number)=>root.querySelector<HTMLButtonElement>(`[data-side=${side}][data-index="${index}"]`)!.click();
 clickCell('right',0);clickCell('left',8);expect(root.querySelectorAll('.ml-boxes .ml-ball')).toHaveLength(13);expect(root.querySelector('[data-side=left][data-index="8"]')!.classList.contains('ml-amber')).toBe(true);
 button('Отменить перемещение').click();expect(root.querySelector('[data-side=right][data-index="0"] .ml-ball')).not.toBeNull();
 clickCell('right',0);clickCell('left',8);clickCell('right',1);clickCell('left',9);expect(root.textContent).toContain('8 + 5 = 10 + 3');expect(root.querySelector<HTMLInputElement>('input[aria-label="Сумма"]')!.disabled).toBe(false);
 button('Сначала').click();expect(root.querySelector<HTMLInputElement>('input[aria-label="Сумма"]')!.disabled).toBe(true);
});
it('mental bridge asks for the missing part, remainder and sum without hidden dragging',()=>{
 unmount=mathExercise('bridge')(root,ctx());select('Режим','train');select('Помощь','3');vi.spyOn(Math,'random').mockReturnValue(.5);button('Начать').click();expect(root.querySelector('.ml-boxes')).toBeNull();
 const t=generate('bridge',{...defaults('bridge'),mode:'train',level:3},()=>.5);
 input('До десятки не хватает',String(10-t.a));input('Останется во второй части',String(t.whole-10));input('Сумма',String(t.whole));root.querySelector('form')!.dispatchEvent(new Event('submit',{cancelable:true}));expect(root.textContent).toContain('Верно!');
});
it('restarting a glance series cancels the previous exposure and preserves the new deadline',async()=>{
 unmount=mathExercise('glance')(root,ctx());select('Время показа','500');button('Начать').click();await vi.advanceTimersByTimeAsync(900);button('Начать заново').click();await vi.advanceTimersByTimeAsync(200);expect(root.querySelector('form')).toBeNull();expect(root.textContent).toContain('Приготовься');await vi.advanceTimersByTimeAsync(400);expect(root.querySelector('.ml-dot')).not.toBeNull();await vi.advanceTimersByTimeAsync(500);expect(root.querySelector('form')).not.toBeNull();
});
it('rejects free examples without crossing ten and resets safely when numbers change',()=>{
 unmount=mathExercise('bridge')(root,ctx());input('Первое число','4');input('Второе число','3');expect(root.textContent).toContain('с суммой больше 10');expect(root.querySelector('.ml-boxes')).toBeNull();input('Первое число','9');expect(root.querySelectorAll('.ml-boxes .ml-ball')).toHaveLength(12);
});
it('mental feedback identifies a wrong transfer even when the final sum is correct',()=>{
 unmount=mathExercise('bridge')(root,ctx());select('Режим','train');select('Помощь','3');vi.spyOn(Math,'random').mockReturnValue(.5);button('Начать').click();const t=generate('bridge',{...defaults('bridge'),mode:'train',level:3},()=>.5);
 input('До десятки не хватает','0');input('Останется во второй части','0');input('Сумма',String(t.whole));root.querySelector('form')!.dispatchEvent(new Event('submit',{cancelable:true}));expect(root.querySelector('.ml-retry')).not.toBeNull();button('Показать на шариках').click();expect(root.querySelectorAll('.ml-feedback .ml-ball')).toHaveLength(t.whole);
});
it('does not start a new exposure while the page is already in the background',async()=>{
 unmount=mathExercise('glance')(root,ctx());vi.spyOn(document,'hidden','get').mockReturnValue(true);button('Начать').click();await vi.advanceTimersByTimeAsync(10000);expect(root.querySelector('.ml-dot')).toBeNull();expect(root.querySelector('form')).toBeNull();expect(root.textContent).toContain('без штрафа');
});
it('keeps moving dots optional, hides them on deadline and replays a still image',async()=>{
 unmount=mathExercise('glance')(root,ctx());
 const toggle=[...root.querySelectorAll<HTMLInputElement>('input[type=checkbox]')][0];
 expect(toggle.checked).toBe(false);toggle.checked=true;toggle.dispatchEvent(new Event('change'));
 select('Время показа','500');button('Начать').click();await vi.advanceTimersByTimeAsync(600);
 expect(root.querySelector('.ml-moving .ml-dot')).not.toBeNull();
 const count=root.querySelectorAll('.ml-dot').length;expect(count).toBeGreaterThan(0);
 await vi.advanceTimersByTimeAsync(500);expect(root.querySelector('.ml-moving')).toBeNull();answer('0');
 button('Посмотреть расположение').click();expect(root.querySelector('.ml-moving')).toBeNull();expect(root.querySelectorAll('.ml-dot').length).toBe(count);
});

it('handles a touch-style zero-detail compatibility click exactly once',()=>{
 unmount=mathExercise('bridge')(root,ctx());
 const source=root.querySelector<HTMLButtonElement>('[data-side=right][data-index="0"]')!;
 source.setPointerCapture=()=>{};source.hasPointerCapture=()=>false;
 const pointer=(type:string)=>{const e=new MouseEvent(type,{bubbles:true,button:0,clientX:10,clientY:10});Object.defineProperties(e,{isPrimary:{value:true},pointerId:{value:1}});source.dispatchEvent(e);};
 Object.defineProperty(document,'elementFromPoint',{configurable:true,value:()=>source});
 pointer('pointerdown');pointer('pointerup');source.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:0}));
 expect(source.getAttribute('aria-pressed')).toBe('true');
 root.querySelector<HTMLButtonElement>('[data-side=left][data-index="8"]')!.click();
 expect(root.querySelector('[data-side=left][data-index="8"] .ml-ball')).not.toBeNull();
 expect(root.querySelectorAll('.ml-boxes .ml-ball')).toHaveLength(13);
});
