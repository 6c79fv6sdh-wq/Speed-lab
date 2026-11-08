import type {MountFn} from '../../main';
import {el,button} from '../../core/ui';
import {initializeMoveSound,playInteractionSound,moveSoundEnabled,setMoveSoundEnabled} from '../../core/move-sound';
import './styles.css';
export interface Addition {a:number;b:number}
export const additionTotal=(task:Addition)=>task.a+task.b;
export const multiplicationTotal=(task:Addition)=>task.a*task.b;
export type FlowOperation='addition'|'multiplication';
export type FlowLimit=10|20|100;
const key=(task:Addition)=>[task.a,task.b].sort((a,b)=>a-b).join(':');
/** A shuffled, finite deck is reused indefinitely; memory never grows with play. */
export class AdditionDeck {
 private deck:Addition[]=[];
 constructor(readonly limit:FlowLimit=10,private random:()=>number=Math.random){}
 next(previous?:Addition):Addition{
  if(!this.deck.length){
   for(let a=this.limit===100?10:1;a<this.limit;a++)for(let b=a;a+b<=this.limit;b++)this.deck.push({a,b});
   for(let i=this.deck.length-1;i>0;i--){const j=Math.min(i,Math.floor(this.random()*(i+1)));[this.deck[i],this.deck[j]]=[this.deck[j],this.deck[i]];}
  }
  if(previous&&key(this.deck.at(-1)!)===key(previous)&&this.deck.length>1){const last=this.deck.length-1;[this.deck[0],this.deck[last]]=[this.deck[last],this.deck[0]];}
  const task=this.deck.pop()!;return this.random()<.5?task:{a:task.b,b:task.a};
 }
}
/** Table facts in easy mode; a two-digit number times 2–9 in hard mode. */
export class MultiplicationDeck {
 private deck:Addition[]=[];
 constructor(readonly limit:10|100=10,private random:()=>number=Math.random){}
 next(previous?:Addition):Addition{
  if(!this.deck.length){
   if(this.limit===10){for(let a=1;a<=10;a++)for(let b=a;b<=10;b++)this.deck.push({a,b});}
   else{for(let a=11;a<=99;a++)for(let b=2;b<=9;b++)this.deck.push({a,b});}
   for(let i=this.deck.length-1;i>0;i--){const j=Math.min(i,Math.floor(this.random()*(i+1)));[this.deck[i],this.deck[j]]=[this.deck[j],this.deck[i]];}
  }
  if(previous&&key(this.deck.at(-1)!)===key(previous)&&this.deck.length>1){const last=this.deck.length-1;[this.deck[0],this.deck[last]]=[this.deck[last],this.deck[0]];}
  const task=this.deck.pop()!;return this.random()<.5?task:{a:task.b,b:task.a};
 }
}
/** Plausible, distinct choices; the correct result occurs exactly once. */
export function arithmeticChoices(task:Addition,operation:FlowOperation,random:()=>number=Math.random):number[]{
 const result=operation==='addition'?additionTotal(task):multiplicationTotal(task);
 const choices=new Set([result]);
 const maximum=operation==='addition'||Math.max(task.a,task.b)<=10?100:891;
 const offsets=operation==='multiplication'?[task.a,-task.a,task.b,-task.b,1,-1,2,-2,10,-10]:[1,-1,10,-10,2,-2];
 for(let i=offsets.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[offsets[i],offsets[j]]=[offsets[j],offsets[i]];}
 for(const offset of offsets){if(result+offset>=0&&result+offset<=maximum)choices.add(result+offset);if(choices.size===4)break;}
 for(let n=0;choices.size<4;n++)choices.add(n);
 const values=[...choices];for(let i=values.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[values[i],values[j]]=[values[j],values[i]];}return values;
}
export type FlowMode='endless'|'survival'|'lives';
export interface FlowProgress {mode:FlowMode;lives:number;ended:boolean;version:1;limit:FlowLimit;task:Addition;hadError:boolean;solved:number;correct:number;errors:number}
type StoredFlow=Omit<FlowProgress,'mode'|'lives'|'ended'> & Partial<Pick<FlowProgress,'mode'|'lives'|'ended'>>;
export function validFlow(value:unknown,operation:FlowOperation='addition'):value is StoredFlow{
 const p=value as StoredFlow|undefined;
 if(!p||p.version!==1||![10,20,100].includes(p.limit)||!p.task||!Number.isInteger(p.task.a)||!Number.isInteger(p.task.b)||p.task.a<1||p.task.b<1||typeof p.hadError!=='boolean'||![p.solved,p.correct,p.errors].every(n=>Number.isSafeInteger(n)&&n>=0)||p.correct>p.solved)return false;
 if(operation==='addition'){
  if(additionTotal(p.task)>p.limit||(p.limit===100&&(p.task.a<10||p.task.b<10)))return false;
 }else{
  if(p.limit===20)return false;
  const {a,b}=p.task;
  if(p.limit===10?(a>10||b>10):!((a>=11&&a<=99&&b>=2&&b<=9)||(b>=11&&b<=99&&a>=2&&a<=9)))return false;
 }
 // Old snapshots had no mode fields. They resume as endless, keeping all progress.
 if(p.mode===undefined&&p.lives===undefined&&p.ended===undefined)return true;
 if(!p.mode||!['endless','survival','lives'].includes(p.mode)||typeof p.lives!=='number'||!Number.isInteger(p.lives)||typeof p.ended!=='boolean')return false;
 return p.lives>=0&&p.lives<=(p.mode==='lives'?3:p.mode==='survival'?1:0)&&(p.mode==='endless'?!p.ended:p.ended===(p.lives===0));
}
const memory=new Map<string,FlowProgress>();
function arithmeticFlow(operation:FlowOperation):MountFn{return(root,ctx)=>{
 const multiplication=operation==='multiplication',id=multiplication?'multiplication-flow':'addition-flow',title=multiplication?'Поток умножения':'Поток сложения',symbol=multiplication?'×':'+',noun=multiplication?'произведение':'сумму';
 const total=(task:Addition)=>multiplication?multiplicationTotal(task):additionTotal(task);
 const createDeck=(limit:FlowLimit)=>multiplication?new MultiplicationDeck(limit===100?100:10):new AdditionDeck(limit);
 const valid=(value:unknown)=>validFlow(value,operation);
 initializeMoveSound();
 const storageKey=`sciencechess-mathlab:v1:${ctx.profile.id}:${id}`;
 let saved:unknown=memory.get(storageKey);try{if(!saved)saved=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{}
 let deck=createDeck(valid(saved)?saved.limit:10);
 let state:FlowProgress=valid(saved)?{...saved,mode:saved.mode??'endless',lives:saved.lives??0,ended:saved.ended??false,task:{...saved.task}}:{mode:'endless',lives:0,ended:false,version:1,limit:10,task:deck.next(),hadError:false,solved:0,correct:0,errors:0};
 let timer:number|undefined,locked=false,disposed=false;
 const page=el('div',{class:'mathlab','data-exercise':id});
 const settings=el('select',{'aria-label':'Сложение'});
 const difficulty=el('select',{'aria-label':'Сложность'});
 for(const [value,label] of [['easy','Простой'],['hard','Сложный']]){const option=el('option',{value},[label]);option.selected=(state.limit===100?'hard':'easy')===value;difficulty.append(option);}
 const levelNote=el('p',{class:'ml-muted ml-flow-level'});
 function renderLevel(){difficulty.value=state.limit===100?'hard':'easy';settingsLabel.hidden=multiplication||state.limit===100;levelNote.textContent=multiplication?(state.limit===100?'Двузначное число × число от 2 до 9':'Таблица умножения от 1 до 10'):(state.limit===100?'Двузначные слагаемые · сумма до 100':`Сумма до ${state.limit}`);}
 for(const limit of [10,20]){const option=el('option',{value:String(limit)},[`Сумма до ${limit}`]);option.selected=limit===state.limit;settings.append(option);}
 const modeSelect=el('select',{'aria-label':'Режим'});
 for(const [value,label] of [['endless','Бесконечный'],['survival','До первой ошибки'],['lives','Три жизни']]){const option=el('option',{value},[label]);option.selected=value===state.mode;modeSelect.append(option);}
 const lives=el('div',{class:'ml-flow-lives',role:'img'});
 const result=el('div',{class:'ml-flow-result',role:'status','aria-live':'polite'});
 const instruction=el('p',{class:'ml-instruction'});
 const equation=el('div',{class:'ml-equation',role:'status','aria-live':'polite'});
 const feedback=el('p',{class:'ml-flow-feedback',role:'status','aria-live':'polite'});
 const pad=el('div',{class:'ml-keypad ml-flow-keypad',role:'group','aria-label':`Выбери ${noun}`});
 const sound=button('',()=>{setMoveSoundEnabled(!moveSoundEnabled());renderSound();if(moveSoundEnabled())playInteractionSound('answer',false);});
 sound.setAttribute('data-action-sound','manual');
 function renderSound(){sound.textContent=moveSoundEnabled()?'Звук: вкл':'Звук: выкл';sound.setAttribute('aria-label','Звук нажатий');sound.setAttribute('aria-pressed',String(moveSoundEnabled()));}
 renderSound();
 const stats=el('div',{class:'ml-stats'}),notice=el('p',{class:'ml-muted'});
 function persist(){memory.set(storageKey,{...state,task:{...state.task}});try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{notice.textContent='Прогресс сохраняется только в этой вкладке.';}}
 function renderStats(){const attempted=state.solved+(state.hadError?1:0);stats.replaceChildren(...[['Решено',state.solved],['Точность',attempted?`${Math.round(state.correct/attempted*100)}%`:'—'],['Ошибок',state.errors]].map(([title,value])=>el('div',{class:'ml-stat'},[el('span',{},[String(title)]),el('strong',{},[String(value)])])));}
 function renderLives(){
  lives.hidden=state.mode==='endless';lives.replaceChildren();
  lives.setAttribute('aria-label',`Жизни: ${state.lives} из ${state.mode==='lives'?3:1}`);
  for(let i=0;i<state.lives;i++){
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 32 30');svg.setAttribute('aria-hidden','true');svg.classList.add('ml-flow-heart');
   const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M16 28 3.5 15.5C-4 8 6-3 14 5l2 2 2-2c8-8 18 3 10.5 10.5Z');svg.append(path);lives.append(svg);
  }
 }
 function show(){
  locked=state.ended;pad.hidden=state.ended;renderLives();result.replaceChildren();result.hidden=!state.ended;
  instruction.textContent=state.mode==='endless'?`Выбери ${noun}. Следующий пример появится сразу после верного ответа.`:state.mode==='survival'?`Решай до первой ошибки. Выбери ${noun}.`:'Три жизни. Каждый неверный ответ убирает сердечко.';
  if(state.ended){result.append(el('h2',{},['Попытка завершена']),el('p',{},[`Решено примеров: ${state.solved}.`]),button('Новая попытка',()=>reset(), 'ml-primary'));feedback.className='ml-flow-feedback ml-retry';feedback.textContent=`${state.task.a} ${symbol} ${state.task.b} = ${total(state.task)}`;}
  equation.textContent=`${state.task.a} ${symbol} ${state.task.b} = ?`;pad.querySelectorAll<HTMLButtonElement>('button').forEach(b=>{b.disabled=state.ended;b.removeAttribute('aria-pressed');});renderStats();}
 function answer(n:number){
  if(disposed||locked)return;
  playInteractionSound('answer',false);
  if(n!==total(state.task)){
   state.hadError=true;state.errors++;
   if(state.mode!=='endless'){state.lives--;state.ended=state.lives===0;}
   feedback.className='ml-flow-feedback ml-retry';feedback.textContent='Попробуй ещё раз';
   persist();renderStats();renderLives();
   if(state.ended)show();
   else if(state.mode!=='endless'){
    // Lock briefly so a double tap cannot consume several hearts at once.
    locked=true;pad.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);
    timer=window.setTimeout(()=>{timer=undefined;if(disposed)return;locked=false;show();},350);
   }
   return;
  }
  locked=true;state.solved++;if(!state.hadError)state.correct++;
  const solved=state.task;feedback.className='ml-flow-feedback ml-correct';feedback.textContent=`Верно! ${solved.a} ${symbol} ${solved.b} = ${n}`;
  pad.querySelectorAll<HTMLButtonElement>('button').forEach(b=>{b.disabled=true;b.setAttribute('aria-pressed',String(Number(b.dataset.value)===n));});
  state.task=deck.next(solved);state.hadError=false;persist();renderStats();
  timer=window.setTimeout(()=>{timer=undefined;if(disposed)return;locked=false;feedback.textContent='';keypad();show();},350);
 }
 function keypad(){
  pad.replaceChildren();const choices=multiplication||state.limit===100;
  pad.classList.toggle('ml-flow-choices',choices);
  const values=choices?arithmeticChoices(state.task,operation):Array.from({length:state.limit+1},(_,n)=>n);
  for(const n of values){const b=button(String(n),()=>answer(n));b.dataset.value=String(n);b.setAttribute('data-action-sound','manual');pad.append(b);}
 }
 function reset(limit:FlowLimit=state.limit,mode:FlowMode=state.mode){if(timer!==undefined)clearTimeout(timer);timer=undefined;locked=false;deck=createDeck(limit);state={mode,lives:mode==='lives'?3:mode==='survival'?1:0,ended:false,version:1,limit,task:deck.next(),hadError:false,solved:0,correct:0,errors:0};feedback.textContent='';persist();renderLevel();keypad();show();}
 difficulty.addEventListener('change',()=>reset(difficulty.value==='hard'?100:multiplication?10:Number(settings.value) as 10|20));
 modeSelect.addEventListener('change',()=>reset(state.limit,modeSelect.value as FlowMode));
 settings.addEventListener('change',()=>reset(Number(settings.value) as 10|20));
 const settingsLabel=el('label',{class:'ml-field'},[el('span',{},['Сложение']),settings]);
 page.append(el('a',{href:'#math',class:'ml-back'},['← Математика']),el('h1',{},[title]),el('section',{class:'ml-panel ml-flow-settings'},[el('label',{class:'ml-field'},[el('span',{},['Сложность']),difficulty]),settingsLabel,el('label',{class:'ml-field'},[el('span',{},['Режим']),modeSelect])]),el('section',{class:'ml-panel ml-flow-stage'},[levelNote,instruction,lives,equation,feedback,result,pad,el('div',{class:'ml-actions'},[button('Начать заново',()=>reset()),sound])]),stats,notice);
 root.append(page);renderLevel();keypad();show();
 return ()=>{disposed=true;if(timer!==undefined)clearTimeout(timer);};
};}
export const mountAdditionFlow=arithmeticFlow('addition');
export const mountMultiplicationFlow=arithmeticFlow('multiplication');
