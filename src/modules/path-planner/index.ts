import type {MountFn} from '../../main';
import {el,button} from '../../core/ui';
import {initializeMoveSound,playInteractionSound} from '../../core/move-sound';
import {plannerDefaults,validPlannerSettings,generatePuzzle,checkpointProgress,obstacles,legalMoves,move,reached,remainingRoute,type PlannerSettings} from './logic';
import '../mathlab/styles.css';
import './styles.css';
interface Saved{version:1;solved:number;settings:PlannerSettings;results:{id:string;moves:number;best:number;hints:number;date:string}[]}
export const mountPathPlanner:MountFn=(root,ctx)=>{
 initializeMoveSound();const key=`sciencechess-planner:v1:${ctx.profile.id}`;
 let saved:Saved={version:1,solved:0,settings:{...plannerDefaults},results:[]};
 try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(raw?.version===1&&validPlannerSettings(raw.settings)){saved.settings={...raw.settings};if(Array.isArray(raw.results))saved.results=raw.results.filter((r:Saved['results'][number])=>r&&typeof r.id==='string'&&Number.isSafeInteger(r.moves)&&r.moves>=0&&Number.isSafeInteger(r.best)&&r.best>=0&&Number.isSafeInteger(r.hints)&&r.hints>=0&&typeof r.date==='string').slice(-100);saved.solved=Number.isSafeInteger(raw.solved)&&raw.solved>=saved.results.length?raw.solved:saved.results.length;}}catch{}
 let puzzle=generatePuzzle(saved.settings),path=[puzzle.start],phase:'ready'|'running'|'complete'|'expired'='ready',hints=0,hintCell:number|null=null,disposed=false;
 let left:number=saved.settings.seconds*1000,deadline=0,interval:number|undefined;
 const page=el('div',{class:'mathlab','data-exercise':'path-planner'}),settings=el('section',{class:'ml-panel pp-settings'});
 const grid=el('div',{class:'pp-grid',role:'group','aria-label':'Поле маршрута'});
 const info=el('p',{class:'pp-rule'}),message=el('p',{class:'pp-message',role:'status','aria-live':'polite'}),stats=el('div',{class:'ml-stats'}),notice=el('p',{class:'ml-muted'});
 const select=(label:string,values:[string,string][],value:string,change:(v:string)=>void)=>{const field=el('select',{'aria-label':label});for(const [v,title] of values){const option=el('option',{value:v},[title]);option.selected=v===value;field.append(option);}field.addEventListener('change',()=>{change(field.value);newPuzzle();});settings.append(el('label',{class:'ml-field'},[el('span',{},[label]),field]));};
 select('Размер поля',[['5','Простой · 5 × 5'],['6','Сложный · 6 × 6']],String(saved.settings.size),v=>saved.settings.size=Number(v) as 5|6);
 select('Правило движения',[['walk','Соседняя клетка ↔ ↕'],['knight','Шахматный конь']],saved.settings.movement,v=>saved.settings.movement=v as PlannerSettings['movement']);
 select('Промежуточные цели',[['0','Без промежуточных целей'],['1','Через точку 1'],['2','Через 1, затем 2']],String(saved.settings.checkpoints),v=>saved.settings.checkpoints=Number(v) as 0|1|2);
 select('Изменение поля',[['yes','После первого хода'],['no','Препятствия постоянны']],saved.settings.changing?'yes':'no',v=>saved.settings.changing=v==='yes');
 select('Время на маршрут',[['0','Без ограничения'],['60','1 минута'],['120','2 минуты']],String(saved.settings.seconds),v=>saved.settings.seconds=Number(v) as 0|60|120);
 function persist(){try{localStorage.setItem(key,JSON.stringify(saved));}catch{notice.textContent='Сохранение недоступно. Упражнение продолжает работать.';}}
 function stopClock(){if(interval!==undefined)clearInterval(interval);interval=undefined;}
 function tick(){if(phase!=='running'||!saved.settings.seconds||document.hidden)return;left=Math.max(0,deadline-performance.now());if(!left){phase='expired';stopClock();message.textContent='Время вышло. Попробуй тот же маршрут ещё раз.';render();}else renderStats();}
 function startClock(){stopClock();if(saved.settings.seconds&&!document.hidden){deadline=performance.now()+left;interval=window.setInterval(tick,100);}}
 function visibility(){if(phase!=='running'||!saved.settings.seconds)return;if(document.hidden){left=Math.max(0,deadline-performance.now());stopClock();}else startClock();renderStats();}
 document.addEventListener('visibilitychange',visibility);
 function renderStats(){stats.replaceChildren(...[['Ходов',String(path.length-1)],['Решено',String(saved.solved)],saved.settings.seconds?['Время',`${Math.ceil(left/1000)} с`]:['Подсказки',String(hints)]].map(([title,value])=>el('div',{class:'ml-stat'},[el('span',{},[title]),el('strong',{},[value])])));}
 const undo=button('← Назад',()=>{if(phase!=='running'||path.length<2)return;path=path.slice(0,-1);hintCell=null;message.textContent=path.length===1?'Первый ход отменён. Поле восстановлено.':'Ход отменён.';render();});
 const reset=button('Сбросить',()=>resetPuzzle());
 const hint=button('Подсказка',()=>{if(phase!=='running'||hintCell!==null)return;const route=remainingRoute(puzzle,path);if(route&&route.length>1){hints++;hintCell=route[1];message.textContent=`Подсказка: строка ${Math.floor(hintCell/puzzle.size)+1}, столбец ${hintCell%puzzle.size+1}.`;render();}});
 const primary=button('Начать маршрут',()=>{if(phase==='running')return;if(phase==='complete'||phase==='expired'){newPuzzle();return;}phase='running';message.textContent='Выбирай следующую клетку.';startClock();render();grid.querySelector<HTMLButtonElement>(`[data-cell="${path.at(-1)}"]`)?.focus({preventScroll:true});},'ml-primary');
 function resetPuzzle(){stopClock();path=[puzzle.start];phase='ready';hints=0;hintCell=null;left=saved.settings.seconds*1000;message.textContent='Продумай путь. Нажми «Начать маршрут».';render();}
 function newPuzzle(){if(disposed)return;puzzle=generatePuzzle(saved.settings);persist();resetPuzzle();}
 function choose(cell:number){
  if(disposed||phase!=='running')return;tick();if(phase!=='running')return;
  const next=move(puzzle,path,cell);if(!next){message.textContent=obstacles(puzzle,path).includes(cell)?'Здесь препятствие. Выбери другую клетку.':saved.settings.movement==='knight'?'Конь ходит буквой Г: две клетки и одна в сторону.':'Можно на соседнюю клетку по горизонтали или вертикали.';return;}
  const previous=checkpointProgress(puzzle,path);path=next;hintCell=null;playInteractionSound('answer',false);
  const progress=checkpointProgress(puzzle,path);
  message.textContent=puzzle.changing&&path.length===2?'Поле изменилось. Пересмотри свой план.':progress>previous?'Промежуточная цель пройдена!':'Продолжай маршрут.';
  if(reached(puzzle,path)){
   phase='complete';stopClock();
   const benchmark=remainingRoute(puzzle,puzzle.changing?path.slice(0,2):[puzzle.start])!;
   const best=benchmark.length-1+(puzzle.changing?1:0),moves=path.length-1;
   message.textContent=`Цель достигнута! ${moves===best?'Кратчайший маршрут!':`Ходов: ${moves}. Можно за ${best}.`}${hints?' С подсказкой.':''}`;
   const id=JSON.stringify(puzzle);if(!saved.results.some(r=>r.id===id)){saved.solved++;saved.results.push({id,moves,best,hints,date:new Date().toISOString()});saved.results=saved.results.slice(-100);persist();}
  }else if(cell===puzzle.goal)message.textContent='Сначала пройди промежуточные цели по порядку.';
  render();grid.querySelector<HTMLButtonElement>(`[data-cell="${cell}"]`)?.focus({preventScroll:true});
 }
 function render(){
  const blocked=obstacles(puzzle,path),position=path.at(-1)!,progress=checkpointProgress(puzzle,path),legal=legalMoves(puzzle,path);
  info.textContent=`${puzzle.movement==='knight'?'Ходы конём':'Шаги ↔ ↕'} · ${progress<puzzle.checkpoints.length?`Сначала точка ${progress+1}, затем ★`:'К цели ★'}${puzzle.changing&&path.length===1?' · Поле изменится':''}`;
  grid.style.setProperty('--pp-size',String(puzzle.size));grid.replaceChildren();
  for(let cell=0;cell<puzzle.size*puzzle.size;cell++){
   const waypoint=puzzle.checkpoints.indexOf(cell),wall=blocked.includes(cell),current=cell===position;
   const state=current?'Здесь ты':wall?'Препятствие':cell===puzzle.goal?'Цель':waypoint>=0?`Точка ${waypoint+1}${waypoint<progress?' пройдена':''}`:legal.includes(cell)?'Можно пойти сюда':'Клетка';
   const b=button('',()=>choose(cell),'pp-cell');b.dataset.cell=String(cell);b.setAttribute('aria-label',`${cell===hintCell?'Подсказка. ':''}Строка ${Math.floor(cell/puzzle.size)+1}, столбец ${cell%puzzle.size+1}. ${state}`);b.setAttribute('data-action-sound','manual');
   b.classList.toggle('pp-changed',puzzle.changing&&path.length===2&&(blocked.includes(cell)!==puzzle.blocked.includes(cell)));b.classList.toggle('pp-wall',wall);b.classList.toggle('pp-current',current);b.classList.toggle('pp-legal',phase==='running'&&legal.includes(cell));b.classList.toggle('pp-hint',cell===hintCell);b.classList.toggle('pp-trail',path.includes(cell));
   if(current){if(puzzle.movement==='knight')b.append(el('img',{src:`${import.meta.env.BASE_URL}piece/ivory/wN.svg`,alt:'Конь',draggable:'false'}));else b.append(el('span',{'aria-hidden':'true',class:'pp-person'},['●']));}
   else if(wall)b.append(el('span',{'aria-hidden':'true'},['×']));
   else if(cell===puzzle.goal)b.append(el('span',{'aria-hidden':'true',class:'pp-goal'},['★']));
   else if(waypoint>=0)b.append(el('span',{'aria-hidden':'true',class:waypoint<progress?'pp-passed':'pp-waypoint'},[waypoint<progress?'✓':String(waypoint+1)]));
   else if(path.includes(cell))b.append(el('span',{'aria-hidden':'true',class:'pp-dot'},['·']));
   if(current&&cell===puzzle.goal)b.append(el('span',{'aria-hidden':'true',class:'pp-finish-star'},['★']));
   b.addEventListener('keydown',event=>{const delta=({ArrowLeft:-1,ArrowRight:1,ArrowUp:-puzzle.size,ArrowDown:puzzle.size} as Record<string,number>)[event.key];if(delta!==undefined){event.preventDefault();const target=cell+delta;if(target>=0&&target<puzzle.size*puzzle.size&&(Math.abs(delta)!==1||Math.floor(target/puzzle.size)===Math.floor(cell/puzzle.size)))grid.querySelector<HTMLButtonElement>(`[data-cell="${target}"]`)?.focus();}});grid.append(b);
  }
  undo.disabled=phase!=='running'||path.length<2;hint.disabled=phase!=='running'||hintCell!==null;primary.disabled=phase==='running';primary.textContent=phase==='ready'?'Начать маршрут':phase==='running'?'В пути': 'Следующее поле';renderStats();
 }
 const stage=el('section',{class:'ml-panel ml-stage pp-stage'},[el('div',{class:'pp-layout'},[grid,el('div',{class:'pp-side'},[info,message,el('div',{class:'pp-actions'},[undo,reset,hint,primary])])])]);
 page.append(el('h1',{},['План маршрута']),el('p',{class:'ml-intro'},['Доберись до звезды, соблюдая правила. Цифры нужно пройти по порядку. При изменении поля путь всегда остаётся возможным.']),settings,stage,stats,notice);root.append(page);resetPuzzle();
 return()=>{disposed=true;stopClock();document.removeEventListener('visibilitychange',visibility);};
};
