import type {MountFn} from '../../main';
import {el,button} from '../../core/ui';
import {initializeMoveSound,playInteractionSound} from '../../core/move-sound';
import {FlagDeck,FLAG_POOLS,flagCountries,countryByCode,validFlagProgress,type FlagPool,type FlagProgress,type FlagCode} from './flags-logic';
import './styles.css';
import './flags.css';
const memory=new Map<string,FlagProgress>();
export const mountFlags:MountFn=(root,ctx)=>{
 initializeMoveSound();
 const key=`sciencechess-mathlab:v1:${ctx.profile.id}:flags`;
 let saved:unknown=memory.get(key);try{if(!saved)saved=JSON.parse(localStorage.getItem(key)||'null');}catch{}
 let deck=new FlagDeck(validFlagProgress(saved)?saved.pool:'all');
 let state:FlagProgress=validFlagProgress(saved)?{...saved,task:{...saved.task,options:[...saved.task.options]}}:{version:1,pool:'all',total:0,correct:0,task:deck.next(),selected:null};
 let disposed=false,ready=false,request=0,question=0;
 const page=el('div',{class:'mathlab','data-exercise':'flags'});
 const pool=el('select',{'aria-label':'Набор флагов'});
 for(const [value,title] of Object.entries(FLAG_POOLS)){const option=el('option',{value},[`${title} · ${flagCountries(value as FlagPool).length}`]);option.selected=state.pool===value;pool.append(option);}
 const progress=el('p',{class:'ml-progress flags-progress'});
 const picture=el('img',{class:'flags-image',alt:'Флаг страны. Выбери её название.',decoding:'async',draggable:'false'});
 const loading=el('p',{class:'flags-loading',role:'status'},['Загружаем флаг…']);
 const retry=button('Повторить загрузку',()=>loadPicture());retry.hidden=true;
 const frame=el('div',{class:'flags-picture'},[picture,el('div',{class:'flags-image-status'},[loading,retry])]);
 const choices=el('div',{class:'flags-choices',role:'group','aria-label':'Варианты ответа'});
 const feedback=el('p',{class:'flags-feedback',role:'status','aria-live':'polite'});
 const next=button('Дальше',()=>{if(disposed||state.selected===null)return;state.task=deck.next(state.task.country);state.selected=null;persist();renderQuestion();},'ml-primary');next.hidden=true;
 const stats=el('div',{class:'ml-stats'});
 const notice=el('p',{class:'ml-muted',role:'status'});
 function persist(){const snapshot={...state,task:{...state.task,options:[...state.task.options]}};memory.set(key,snapshot);try{localStorage.setItem(key,JSON.stringify(snapshot));}catch{notice.textContent='Прогресс сохраняется только в этой вкладке.';}}
 function renderStats(){stats.replaceChildren(...[['Верно',String(state.correct)],['Точность',state.total?`${Math.round(state.correct/state.total*100)}%`:'—'],['Ошибок',String(state.total-state.correct)]].map(([label,value])=>el('div',{class:'ml-stat'},[el('span',{},[label]),el('strong',{},[value])])));}
 function review(){
  const country=countryByCode.get(state.task.country)!;
  const correct=state.selected===state.task.country;
  picture.alt=`Флаг: ${country.name}`;
  choices.querySelectorAll<HTMLButtonElement>('button').forEach(b=>{
   const code=b.dataset.country!;b.disabled=true;
   if(code===state.task.country){b.classList.add('flags-correct');b.append(el('span',{'aria-hidden':'true',class:'flags-answer-mark'},['✓']));}
   else if(code===state.selected){b.classList.add('flags-wrong');b.append(el('span',{'aria-hidden':'true',class:'flags-answer-mark'},['×']));}
  });
  feedback.className=`flags-feedback ${correct?'ml-correct':'ml-retry'}`;
  feedback.textContent=correct?`Верно! ${country.name}.`:`Это ${country.name}.`;
  next.hidden=false;
 }
 function answer(code:FlagCode){
  if(disposed||!ready||state.selected!==null||!state.task.options.includes(code))return;
  playInteractionSound('answer',false);
  state.selected=code;state.total++;if(code===state.task.country)state.correct++;
  persist();renderStats();review();
 }
 function loadPicture(){
  const token=++request;ready=false;picture.hidden=true;loading.hidden=false;retry.hidden=true;loading.textContent='Загружаем флаг…';
  choices.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);
  picture.onload=()=>{if(disposed||token!==request)return;ready=true;picture.hidden=false;loading.hidden=true;choices.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=state.selected!==null);};
  picture.onerror=()=>{if(disposed||token!==request)return;loading.textContent='Не удалось загрузить флаг.';retry.hidden=false;};
  picture.src=`${import.meta.env.BASE_URL}flags/${state.task.country}.svg`;
 }
 function renderQuestion(){
  feedback.textContent='';next.hidden=true;choices.replaceChildren();
  progress.textContent=`Флаги мира · Вопрос ${state.total+(state.selected===null?1:0)}`;
  picture.alt='Флаг страны. Выбери её название.';
  const current=++question;
  for(const code of state.task.options){const choice=button(countryByCode.get(code)!.name,()=>{if(current===question)answer(code);},'flags-answer');choice.dataset.country=code;choice.setAttribute('data-action-sound','manual');choices.append(choice);}
  renderStats();loadPicture();if(state.selected!==null)review();
 }
 function reset(){deck=new FlagDeck(pool.value as FlagPool);state={version:1,pool:pool.value as FlagPool,total:0,correct:0,task:deck.next(),selected:null};persist();renderQuestion();}
 pool.addEventListener('change',reset);
 const settings=el('section',{class:'ml-panel flags-settings'},[el('label',{class:'ml-field'},[el('span',{},['Набор флагов']),pool]),button('Начать заново',reset)]);
 const stage=el('section',{class:'ml-panel ml-stage flags-stage','aria-label':'Флаги мира'},[progress,el('p',{class:'flags-prompt'},['Какой стране принадлежит флаг?']),el('div',{class:'flags-layout'},[frame,choices]),el('div',{class:'flags-footer'},[feedback,next])]);
 page.append(el('a',{href:'#math',class:'ml-back'},['← Математика']),el('h1',{},['Флаги мира']),settings,stage,stats,notice);root.append(page);renderQuestion();
 return ()=>{disposed=true;request++;picture.onload=null;picture.onerror=null;};
};
