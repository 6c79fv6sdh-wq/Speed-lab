import type {MountFn} from '../../main';
import {el,button} from '../../core/ui';
import './styles.css';
export interface Addition {a:number;b:number}
export const additionTotal=(task:Addition)=>task.a+task.b;
const key=(task:Addition)=>[task.a,task.b].sort((a,b)=>a-b).join(':');
/** A shuffled, finite deck is reused indefinitely; memory never grows with play. */
export class AdditionDeck {
 private deck:Addition[]=[];
 constructor(readonly limit:10|20=10,private random:()=>number=Math.random){}
 next(previous?:Addition):Addition{
  if(!this.deck.length){
   for(let a=1;a<this.limit;a++)for(let b=a;a+b<=this.limit;b++)this.deck.push({a,b});
   for(let i=this.deck.length-1;i>0;i--){const j=Math.min(i,Math.floor(this.random()*(i+1)));[this.deck[i],this.deck[j]]=[this.deck[j],this.deck[i]];}
  }
  if(previous&&key(this.deck.at(-1)!)===key(previous)&&this.deck.length>1){const last=this.deck.length-1;[this.deck[0],this.deck[last]]=[this.deck[last],this.deck[0]];}
  const task=this.deck.pop()!;return this.random()<.5?task:{a:task.b,b:task.a};
 }
}
export interface FlowProgress {version:1;limit:10|20;task:Addition;hadError:boolean;solved:number;correct:number;errors:number}
export function validFlow(value:unknown):value is FlowProgress{
 const p=value as FlowProgress|undefined;
 return !!p&&p.version===1&&(p.limit===10||p.limit===20)&&!!p.task&&Number.isInteger(p.task.a)&&Number.isInteger(p.task.b)&&p.task.a>=1&&p.task.b>=1&&additionTotal(p.task)<=p.limit&&typeof p.hadError==='boolean'&&[p.solved,p.correct,p.errors].every(n=>Number.isSafeInteger(n)&&n>=0)&&p.correct<=p.solved;
}
const memory=new Map<string,FlowProgress>();
export const mountAdditionFlow:MountFn=(root,ctx)=>{
 const storageKey=`sciencechess-mathlab:v1:${ctx.profile.id}:addition-flow`;
 let saved:unknown=memory.get(storageKey);try{if(!saved)saved=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{}
 let deck=new AdditionDeck(validFlow(saved)?saved.limit:10);
 let state:FlowProgress=validFlow(saved)?{...saved,task:{...saved.task}}:{version:1,limit:10,task:deck.next(),hadError:false,solved:0,correct:0,errors:0};
 let timer:number|undefined,locked=false,disposed=false;
 const page=el('div',{class:'mathlab','data-exercise':'addition-flow'});
 const settings=el('select',{'aria-label':'Сложение'});
 for(const limit of [10,20]){const option=el('option',{value:String(limit)},[`Сумма до ${limit}`]);option.selected=limit===state.limit;settings.append(option);}
 const equation=el('div',{class:'ml-equation',role:'status','aria-live':'polite'});
 const feedback=el('p',{class:'ml-flow-feedback',role:'status','aria-live':'polite'});
 const pad=el('div',{class:'ml-keypad ml-flow-keypad',role:'group','aria-label':'Выбери сумму'});
 const stats=el('div',{class:'ml-stats'}),notice=el('p',{class:'ml-muted'});
 function persist(){memory.set(storageKey,{...state,task:{...state.task}});try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{notice.textContent='Прогресс сохраняется только в этой вкладке.';}}
 function renderStats(){stats.replaceChildren(...[['Решено',state.solved],['Точность',state.solved?`${Math.round(state.correct/state.solved*100)}%`:'—'],['Ошибок',state.errors]].map(([title,value])=>el('div',{class:'ml-stat'},[el('span',{},[String(title)]),el('strong',{},[String(value)])])));}
 function show(){equation.textContent=`${state.task.a} + ${state.task.b} = ?`;pad.querySelectorAll<HTMLButtonElement>('button').forEach(b=>{b.disabled=false;b.removeAttribute('aria-pressed');});renderStats();}
 function answer(n:number){
  if(disposed||locked)return;
  if(n!==additionTotal(state.task)){state.hadError=true;state.errors++;feedback.className='ml-flow-feedback ml-retry';feedback.textContent='Попробуй ещё раз';persist();renderStats();return;}
  locked=true;state.solved++;if(!state.hadError)state.correct++;
  const solved=state.task;feedback.className='ml-flow-feedback ml-correct';feedback.textContent=`Верно! ${solved.a} + ${solved.b} = ${n}`;
  pad.querySelectorAll<HTMLButtonElement>('button').forEach(b=>{b.disabled=true;b.setAttribute('aria-pressed',String(Number(b.dataset.value)===n));});
  state.task=deck.next(solved);state.hadError=false;persist();renderStats();
  timer=window.setTimeout(()=>{timer=undefined;if(disposed)return;locked=false;feedback.textContent='';show();},350);
 }
 function keypad(){pad.replaceChildren();for(let n=0;n<=state.limit;n++){const b=button(String(n),()=>answer(n));b.dataset.value=String(n);pad.append(b);}}
 function reset(limit:10|20=state.limit){if(timer!==undefined)clearTimeout(timer);timer=undefined;locked=false;deck=new AdditionDeck(limit);state={version:1,limit,task:deck.next(),hadError:false,solved:0,correct:0,errors:0};feedback.textContent='';persist();keypad();show();}
 settings.addEventListener('change',()=>reset(Number(settings.value) as 10|20));
 page.append(el('a',{href:'#math',class:'ml-back'},['← Математика']),el('h1',{},['Поток сложения']),el('section',{class:'ml-panel'},[el('label',{class:'ml-field'},[el('span',{},['Сложение']),settings])]),el('section',{class:'ml-panel ml-flow-stage'},[el('p',{class:'ml-instruction'},['Выбери сумму. Следующий пример появится сразу после верного ответа.']),equation,feedback,pad,el('div',{class:'ml-actions'},[button('Начать заново',()=>reset())])]),stats,notice);
 root.append(page);keypad();show();
 return ()=>{disposed=true;if(timer!==undefined)clearTimeout(timer);};
};
