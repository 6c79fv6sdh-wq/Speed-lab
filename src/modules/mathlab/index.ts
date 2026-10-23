import type {AppContext,MountFn,Unmount} from '../../main';
import {el,button} from '../../core/ui';
import {defaults,generate,split,validBridge,createBoxes,occupied,transfer,undo,TITLES,EXERCISES,type Exercise,type MathSettings,type Task,type Boxes} from './logic';
import {MathSeries,type MathResult} from './engine';
import {mathStorage} from './storage';
import {dots,tenFrame,mountBoxes} from './visuals';
import './styles.css';
const route=(id:Exercise)=>`#math-${id}`;
const descriptions:Record<Exercise,string>={glance:'Запомни точки и назови их количество.',builder:'Раздели число на две части и найди неизвестную.',friends:'Найди пару чисел, которые вместе дают десять.',bridge:'Переложи шарики, собери десятку и найди сумму.'};
const symbols:Record<Exercise,string>={glance:'•••',builder:'3 | 5',friends:'? + 7',bridge:'10 + ?'};
function stat(label:string,value:string):HTMLElement{return el('div',{class:'ml-stat'},[el('span',{},[label]),el('strong',{},[value])]);}
function history(host:HTMLElement,results:MathResult[]):void {
 host.replaceChildren();if(!results.length){host.append(el('p',{class:'ml-muted'},['Завершённые тренировки появятся здесь.']));return;}
 const list=el('ul',{class:'ml-history'});
 for(const r of results.slice(-8).reverse())list.append(el('li',{},[el('strong',{},[TITLES[r.exercise]]),el('span',{},[`${new Date(r.completedAt).toLocaleDateString('ru-RU')} · Верно: ${r.correct} из ${r.answers.length} · Точность: ${r.answers.length?Math.round(r.correct/r.answers.length*100):0}% · Подсказки: ${r.hints}`])]));
 host.append(list);
}
export const mountMathLab:MountFn=(root,ctx)=>{
 const page=el('div',{class:'mathlab'});root.append(page);
 page.append(el('p',{class:'ml-eyebrow'},['MathLab']),el('h1',{},['Математика']),el('p',{class:'ml-intro'},['Числа, их части и первые шаги в устном счёте.']));
 const cards=el('div',{class:'ml-cards'});
 for(const id of EXERCISES)cards.append(el('a',{class:'ml-card',href:route(id)},[el('span',{class:'ml-symbol','aria-hidden':'true'},[symbols[id]]),el('h2',{},[TITLES[id]]),el('p',{},[descriptions[id]]),el('span',{class:'ml-card-link'},['Открыть →'])]));
 page.append(cards);const recent=el('section',{class:'ml-panel'},[el('h2',{},['Последние тренировки'])]);const list=el('div');history(list,mathStorage(ctx.profile.id).results());recent.append(list);page.append(recent);
 return ()=>{};
};
export function mathExercise(id:Exercise):MountFn{return(root,ctx)=>mountExercise(root,ctx,id);}
function mountExercise(root:HTMLElement,ctx:AppContext,id:Exercise):Unmount {
 const store=mathStorage(ctx.profile.id);let settings=store.settings(id);
 // Exploration is meaningful only in the two manipulatives.
 if((id==='glance'||id==='friends')&&settings.mode==='explore')settings.mode='learn';
 const page=el('div',{class:'mathlab','data-exercise':id});root.append(page);
 page.append(el('a',{href:'#math',class:'ml-back'},['← Математика']),el('h1',{},[TITLES[id]]));
 const settingsDetails=el('details',{class:'ml-panel ml-settings',open:''},[el('summary',{},['Настройки'])]);
 const fields=el('fieldset',{class:'ml-fields'});settingsDetails.append(fields);
 const stage=el('section',{class:'ml-panel ml-stage','aria-label':TITLES[id]});
 const progress=el('p',{class:'ml-progress',role:'status'});
 const surface=el('div',{class:'ml-surface'});
 const feedback=el('div',{class:'ml-feedback',role:'status','aria-live':'polite'});
 const controls=el('div',{class:'ml-actions'});
 const start=button('Начать',startRun,'ml-primary');const stop=button('Завершить',stopRun);stop.hidden=true;
 const restart=button('Начать заново',startRun);restart.hidden=true;
 controls.append(start,restart,stop);stage.append(progress,surface,feedback,controls);
 const savedNotice=el('p',{class:'ml-muted',role:'status'});
 const recent=el('details',{class:'ml-panel'},[el('summary',{},['Мои тренировки'])]);const recentBody=el('div');recent.append(recentBody);refreshHistory();
 page.append(settingsDetails,stage,savedNotice,recent);
 let series:MathSeries|null=null;let task:Task|null=null;let boxes:Boxes|null=null;
 let phase:'idle'|'prepare'|'show'|'answer'|'feedback'|'done'|'paused'='idle';
 let taskStart=0;let hintUsed=false;let reviewing=false;let disposed=false;
 let timers:number[]=[];let cleanVisual:(()=>void)|null=null;
 let currentDots:HTMLElement|null=null;let dotsReplay:HTMLElement|null=null;
 const later=(fn:()=>void,ms:number)=>{timers.push(window.setTimeout(()=>{if(!disposed)fn();},ms));};
 function clear(){for(const t of timers)window.clearTimeout(t);timers=[];cleanVisual?.();cleanVisual=null;}
 function refreshHistory(){history(recentBody,store.results().filter(r=>r.exercise===id));}
 function persist(){if(!store.saveSettings(id,settings))savedNotice.textContent='Настройки действуют в этой вкладке. Постоянное сохранение сейчас недоступно.';}
 let fieldGroup:HTMLElement=fields;
 function settingGroup(title:string){fieldGroup=el('div',{class:'ml-setting-group',role:'group','aria-label':title},[el('h3',{},[title])]);fields.append(fieldGroup);}
 function field(label:string,control:HTMLElement){fieldGroup.append(el('label',{class:'ml-field'},[el('span',{},[label]),control]));}
 function select<K extends keyof MathSettings>(key:K,label:string,options:[string|number,string][]) {
  const control=el('select',{'aria-label':label});
  for(const [value,text] of options){const option=el('option',{value:String(value)},[text]);option.selected=String(settings[key])===String(value);control.append(option);}
  control.addEventListener('change',()=>{const old=settings[key];(settings as unknown as Record<string,unknown>)[key]=typeof old==='number'?Number(control.value):control.value;if(key==='level'&&id==='friends')settings.frame=settings.level===1;changed();});field(label,control);
 }
 function numberSetting(key:'min'|'max'|'a'|'b',label:string,min:number,max:number){
  const input=el('input',{type:'number',min:String(min),max:String(max),value:String(settings[key]),'aria-label':label});
  input.addEventListener('change',()=>{const v=Number(input.value);settings[key]=Math.max(min,Math.min(max,Number.isInteger(v)?v:min));if(key==='min')settings.max=Math.max(settings.min,settings.max);if(key==='max')settings.min=Math.min(settings.min,settings.max);changed();});field(label,input);
 }
 function checkbox(key:'frame'|'edges'|'auto'|'moving',label:string){const input=el('input',{type:'checkbox'});input.checked=settings[key];input.addEventListener('change',()=>{settings[key]=input.checked;changed();});field(label,input);input.closest('label')?.classList.add('ml-toggle-field');}
 function renderSettings(){
  fields.replaceChildren();settingGroup('Серия');
  select('mode','Режим',id==='builder'||id==='bridge'?[['explore','Исследование'],['train',id==='builder'?'Найди неизвестную часть':'Тренировка']]:[['learn','Обучение'],['train','Тренировка']]);
  if(settings.mode!=='explore')select('count','Заданий в серии',[[5,'5'],[10,'10'],[20,'20'],[30,'30']]);
  if(id==='glance'){
   settingGroup('Количество точек');
   const range=el('select',{'aria-label':'Количество точек'});
   for(const [value,label] of [['4','1–4: небольшие количества'],['5','1–5'],['10','1–10'],['custom','Свой диапазон']]){const option=el('option',{value},[label]);option.selected=settings.min===1&&String(settings.max)===value||value==='custom'&&(settings.min!==1||![4,5,10].includes(settings.max));range.append(option);}
   range.addEventListener('change',()=>{if(range.value==='custom'){settings.min=2;settings.max=8;}else{settings.min=1;settings.max=Number(range.value);}changed();});field('Количество точек',range);
   numberSetting('min','От',1,10);numberSetting('max','До',1,10);
   settingGroup('Показ');
   select('exposure','Время показа',[[500,'0,5 секунды'],[1000,'1 секунда'],[2000,'2 секунды'],[3000,'3 секунды'],[5000,'5 секунд']]);
   select('layout','Расположение', [['standard','Закономерные формы'],['groups','Группы и рамка десятки'],['random','Случайное; от 5 точек — группы']]);
   checkbox('moving','Движущиеся точки');
  }
  if(id==='builder'&&settings.mode==='train'){
   settingGroup('Состав числа');
   numberSetting('min','Числа от',2,10);numberSetting('max','Числа до',2,10);
   select('unknown','Неизвестная часть',[['first','Первая'],['second','Вторая'],['random','Случайная']]);
  }
  if(id==='friends'){
   settingGroup('Задания и подсказки');
   select('level','Уровень',[[1,'1 · С рамкой'],[2,'2 · Без подсказки'],[3,'3 · Смешанная серия']]);
   checkbox('frame','Показывать рамку');checkbox('edges','Включить 0 + 10 и 10 + 0');checkbox('auto','Переходить дальше автоматически');
   const group=el('div',{class:'ml-number-choices',role:'group','aria-label':'Числа в заданиях'});
   for(let n=1;n<=9;n++){const b=button(String(n),()=>{if(settings.numbers.includes(n)){if(settings.numbers.length===1)return;settings.numbers=settings.numbers.filter(v=>v!==n);}else settings.numbers=[...settings.numbers,n].sort((a,b)=>a-b);changed();});b.setAttribute('aria-pressed',String(settings.numbers.includes(n)));group.append(b);}field('Числа в заданиях',group);
  }
  if(id==='bridge'){
   settingGroup('Задание');
   select('level','Помощь',[[1,'1 · Обучение'],[2,'2 · Самостоятельно'],[3,'3 · В уме']]);
   if(settings.mode==='explore'){numberSetting('a','Первое число',1,9);numberSetting('b','Второе число',1,9);}
  }
  const reset=button('Настройки по умолчанию',()=>{settings=defaults(id);changed();});fields.append(el('div',{class:'ml-settings-footer'},[reset]));
 }
 function changed(){clear();series=null;phase='idle';task=null;boxes=null;persist();renderSettings();renderIdle();}
 function renderIdle(){
  surface.replaceChildren(el('p',{class:'ml-instruction'},[descriptions[id]]));feedback.replaceChildren();progress.textContent='';start.hidden=settings.mode==='explore';start.textContent='Начать';restart.hidden=true;stop.hidden=true;fields.disabled=false;
  if(id==='builder'&&settings.mode==='explore')drawBuilder();
  if(id==='bridge'&&settings.mode==='explore'){if(validBridge(settings.a,settings.b)){task={a:settings.a,b:settings.b,whole:settings.a+settings.b,answer:settings.a+settings.b,missingFirst:false,reverse:false};boxes=createBoxes(task.a,task.b);phase='answer';drawBridge();}else surface.append(el('p',{role:'status'},['Выбери два числа от 1 до 9 с суммой больше 10. Например, 8 и 5.']));}
 }
 function startRun(){
  clear();feedback.replaceChildren();
  if(settings.mode==='explore'){renderIdle();return;}
  series=new MathSeries(id,{...settings,numbers:[...settings.numbers]});fields.disabled=true;settingsDetails.open=false;start.hidden=true;restart.hidden=false;stop.hidden=false;nextTask();
 }
 function stopRun(){clear();series=null;phase='idle';renderIdle();}
 function nextTask(){
  clear();feedback.replaceChildren();currentDots=null;dotsReplay=null;reviewing=false;hintUsed=false;
  if(!series)return;
  if(series.complete){finish();return;}
  task=generate(id,settings,Math.random,task??undefined);series.begin();phase='answer';taskStart=performance.now();
  progress.textContent=`Задание ${series.answers.length+1} из ${settings.count}`;
  if(id==='glance'){drawGlance();return;}
  if(id==='builder')drawMissing();
  if(id==='friends')drawFriends();
  if(id==='bridge'){boxes=createBoxes(task.a,task.b);drawBridge();}
 }
 function expression(text:string){return el('div',{class:'ml-equation','aria-label':text},[text]);}
 function answerForm(onAnswer:(values:number[],text:string)=>void,labels=['Ответ']):{form:HTMLFormElement;inputs:HTMLInputElement[];submit:HTMLButtonElement}{
  const form=el('form',{class:'ml-answer-form'});const inputs=labels.map(label=>{const input=el('input',{type:'text',inputmode:'numeric',pattern:'[0-9]*',maxlength:'2',autocomplete:'off','aria-label':label});input.required=true;form.append(el('label',{class:'ml-answer-field'},[el('span',{},[label]),input]));return input;});
  const submit=el('button',{class:'btn ml-primary',type:'submit'},['Проверить']);form.append(submit);
  form.addEventListener('submit',e=>{e.preventDefault();if(phase!=='answer'||inputs.some(i=>!/^\d{1,2}$/.test(i.value)))return;onAnswer(inputs.map(i=>Number(i.value)),inputs.map(i=>i.value).join(', '));});
  return {form,inputs,submit};
 }
 function submit(correct:boolean,answer:string,details:Partial<{transferComplete:boolean;calculationCorrect:boolean}>={}){
  if(phase!=='answer'||!task)return;
  phase='feedback';clear();
  if(series&&!reviewing)series.submit({task:{...task},correct,answer,responseMs:Math.max(0,performance.now()-taskStart),hint:hintUsed,...details});
  feedback.replaceChildren(el('p',{class:correct?'ml-correct':'ml-retry'},[correct?'Верно!':`Попробуй ещё раз. Правильный ответ: ${task.answer}.`]));
  surface.querySelectorAll<HTMLInputElement|HTMLButtonElement>('input,button').forEach(b=>{b.disabled=true;});
  const actions=el('div',{class:'ml-actions'});
  if(!correct){actions.append(button(id==='glance'?'Посмотреть ещё раз':'Попробовать ещё раз',()=>retry()));}
  actions.append(button(series?.complete?'Результат':'Далее',()=>nextTask(),'ml-primary'));feedback.append(actions);
  if(id==='glance'){
   const replay=button('Посмотреть расположение',()=>{if(dotsReplay){feedback.append(dotsReplay.cloneNode(true));replay.disabled=true;}});feedback.append(replay);
   feedback.prepend(el('p',{},[`Было ${task.whole} ${task.whole===1?'точка':task.whole<5?'точки':'точек'}.${task.whole>=5?` 5 и ещё ${task.whole-5} — вместе ${task.whole}.`:''}`]));
   if(correct)later(nextTask,1100);
  }
  if(id==='friends'){
   feedback.prepend(expression(`${task.a} + ${task.b} = 10`));
   feedback.append(tenFrame(task.a,task.b));
   if(settings.auto&&correct)later(nextTask,1100);
  }
  if(id==='builder'){feedback.prepend(expression(`${task.whole} = ${task.a} + ${task.b}`));feedback.append(builderVisual(task.whole,task.a));}
  if(id==='bridge'&&settings.level===3){
   feedback.append(el('p',{},[`${task.a} + ${10-task.a} + ${task.b-(10-task.a)} = 10 + ${task.whole-10} = ${task.whole}`]));
   addBridgeDemo(actions);
  }
 }
 function addBridgeDemo(host:HTMLElement){
  const show=button('Показать на шариках',()=>{
   if(!task)return;let state=createBoxes(task.a,task.b);
   while(occupied(state.left)<10)state=transfer(state,state.right.findIndex(Boolean),state.left.findIndex(v=>!v));
   const demo=el('div',{class:'ml-boxes'},[el('section',{},[el('h3',{},['Первая коробка']),tenFrame(task.a,10-task.a)]),el('section',{},[el('h3',{},['Вторая коробка']),tenFrame(0,occupied(state.right))])]);
   feedback.append(demo);show.disabled=true;
  });host.append(show);
 }
 function retry(){
  if(!task)return;clear();reviewing=true;feedback.replaceChildren();phase='answer';taskStart=performance.now();
  if(id==='glance')drawGlance();else if(id==='builder')drawMissing();else if(id==='friends')drawFriends();else{boxes=createBoxes(task.a,task.b);drawBridge();}
 }
 function finish(){
  clear();if(!series)return;const result=series.finish();series=null;phase='done';
  if(!store.saveResult(result))savedNotice.textContent='Результат доступен в этой вкладке. Постоянное сохранение сейчас недоступно.';
  fields.disabled=false;stop.hidden=true;restart.hidden=true;start.hidden=false;start.textContent='Новая серия';progress.textContent='Тренировка завершена';feedback.replaceChildren();
  surface.replaceChildren(el('div',{class:'ml-stats'},[stat('Верно',`${result.correct} из ${result.answers.length}`),stat('Точность',`${Math.round(result.correct/result.answers.length*100)}%`),stat('Ошибок',String(result.errors)),stat('С подсказкой',String(result.hints))]));
  const wrong=result.answers.filter(a=>!a.correct);if(wrong.length){const values=[...new Set(wrong.map(a=>id==='friends'?`${a.task.a} + ${a.task.b}`:id==='bridge'?`${a.task.a} + ${a.task.b}`:String(a.task.whole)))];surface.append(el('p',{},[`Можно повторить: ${values.join(', ')}.`]));}
  refreshHistory();
 }
 function builderVisual(whole:number,a:number,flipped=false):HTMLElement {
  const [first,second]=split(whole,a);const row=el('div',{class:'ml-parts','aria-label':`${first} в первой группе, ${second} во второй`});
  for(let i=0;i<whole;i++)row.append(el('span',{class:`ml-part ${(i<first)!==flipped?'ml-teal':'ml-amber'}`,'aria-hidden':'true'},[el('span',{class:'ml-ball'})]));
  return row;
 }
 function drawBuilder(){
  surface.replaceChildren();let whole=settings.whole,part=settings.part,flipped=false;const wholeInput=el('input',{type:'number',min:'2',max:'10',value:String(whole),'aria-label':'Целое число'});
  const eq=expression('');const visual=el('div');const slider=el('input',{type:'range',min:'0',max:'8',step:'1',value:'8','aria-label':'Первая часть'});
  const rail=el('div',{class:'ml-splitter'});const ticks=el('div',{class:'ml-split-ticks','aria-hidden':'true'});const handle=el('span',{class:'ml-split-handle','aria-hidden':'true'},['↔']);rail.append(slider,handle,ticks);
  const update=()=>{[part]=split(whole,part);rail.style.setProperty('--split',`${100*part/whole}%`);rail.classList.toggle('ml-flipped',flipped);ticks.replaceChildren(...Array.from({length:whole+1},(_,i)=>el('span',{},[String(i)])));slider.max=String(whole);slider.value=String(part);slider.setAttribute('aria-valuetext',`${part} и ${whole-part}`);eq.textContent=`${whole} = ${part} + ${whole-part}`;eq.setAttribute('aria-label',eq.textContent);visual.replaceChildren(builderVisual(whole,part,flipped));settings.whole=whole;settings.part=part;persist();};
  const changeWhole=(value:number)=>{whole=Math.max(2,Math.min(10,Number.isInteger(value)?value:2));wholeInput.value=String(whole);part=Math.min(part,whole);update();};
  wholeInput.addEventListener('change',()=>changeWhole(Number(wholeInput.value)));slider.addEventListener('input',()=>{part=Number(slider.value);update();});
  surface.append(el('div',{class:'ml-whole-picker'},[button('−',()=>changeWhole(whole-1)),el('label',{},['Число ',wholeInput]),button('+',()=>changeWhole(whole+1))]),eq,visual,el('p',{class:'ml-legend'},['Передвигай разделитель или нажимай на шкалу']),rail,el('div',{class:'ml-legend'},['● Первая группа · ◉ Вторая группа']),button('Поменять местами',()=>{part=whole-part;flipped=!flipped;update();}));update();
 }
 function drawMissing(){if(!task)return;surface.replaceChildren(expression(`${task.whole} = ${task.missingFirst?'?':task.a} + ${task.missingFirst?task.b:'?'}`));const answer=answerForm((v,text)=>submit(v[0]===task!.answer,text));surface.append(answer.form);}
 function drawFriends(){if(!task)return;const text=`${task.missingFirst?'?':task.a} + ${task.missingFirst?task.b:'?'}`;surface.replaceChildren(expression(task.reverse?`10 = ${text}`:`${text} = 10`));
  const visual=el('div');if(settings.frame)visual.append(tenFrame(task.missingFirst?task.b:task.a));surface.append(visual);
  const hint=button('Подсказка: рамка',()=>{hintUsed=true;visual.replaceChildren(tenFrame(task!.missingFirst?task!.b:task!.a));hint.disabled=true;});if(!settings.frame)surface.append(hint);
  const answer=answerForm((v,text)=>submit(v[0]===task!.answer,text));surface.append(answer.form);
 }
 function drawGlance(){
  if(!task)return;phase='prepare';surface.replaceChildren(el('p',{class:'ml-ready',role:'status'},['Приготовься']));
  const taskDots=dots(task.whole,settings.layout);dotsReplay=taskDots.cloneNode(true) as HTMLElement;if(settings.moving)taskDots.classList.add('ml-moving');currentDots=null;
  if(document.hidden){onVisibility();return;}
  later(()=>{if(document.hidden){onVisibility();return;}phase='show';currentDots=taskDots;surface.replaceChildren(taskDots);const bar=el('div',{class:'ml-exposure','aria-hidden':'true'},[el('span',{style:`animation-duration:${settings.exposure}ms`})]);surface.append(bar);
   later(()=>{if(phase!=='show')return;phase='answer';currentDots=null;surface.replaceChildren(el('p',{class:'ml-instruction'},['Сколько было точек?']));taskStart=performance.now();const answer=answerForm((v,text)=>submit(v[0]===task!.answer,text));surface.append(answer.form);
    // Programmatic input focus opens the software keyboard on tablets.
    // Keep direct field editing available, but keypad choices need no input focus.
    const touchInput=!!window.matchMedia?.('(any-pointer: coarse)').matches||navigator.maxTouchPoints>0;
    const input=answer.inputs[0];
    const pad=el('div',{class:'ml-keypad','aria-label':'Количество точек'});
    for(let n=1;n<=10;n++)pad.append(button(String(n),()=>{
     input.value=String(n);
     if(touchInput)input.blur();else input.focus({preventScroll:true});
    }));
    surface.append(pad);if(!touchInput)input.focus({preventScroll:true});
   },settings.exposure);
  },600);
 }
 function drawBridge(){
  cleanVisual?.();cleanVisual=null;if(!task||!boxes)return;surface.replaceChildren();
  const mental=settings.level===3;const full=occupied(boxes.left)===10;
  surface.append(expression(full&&!mental?`${task.a} + ${task.b} = 10 + ${occupied(boxes.right)}`:`${task.a} + ${task.b} = ?`));
  if(!mental){const host=el('div');surface.append(host);cleanVisual=mountBoxes(host,boxes,next=>{boxes=next;drawBridge();},phase==='answer');
   surface.append(el('div',{class:'ml-actions'},[button('Отменить перемещение',()=>{if(boxes){boxes=undo(boxes);drawBridge();}}),button('Сначала',()=>{if(task){boxes=createBoxes(task.a,task.b);drawBridge();}})]));
  }
  const hintText=el('p',{class:'ml-instruction',role:'status'});const hint=button('Подсказка',()=>{hintUsed=true;hintText.textContent=`До десяти первому числу не хватает ${10-task!.a}. Возьми эту часть из второго числа.`;hint.disabled=true;});surface.append(hint,hintText);
  const answer=answerForm((values,text)=>{
   if(!task||!boxes)return;const calc=values.at(-1)===task.whole;const transferComplete=mental?values[0]===10-task.a&&values[1]===task.whole-10:occupied(boxes.left)===10;
   if(!transferComplete&&!mental)return;
   if(settings.mode==='explore'){
    phase='feedback';feedback.replaceChildren(el('p',{role:'status'},[calc?'Получилось!':`Проверь сумму: 10 + ${task.whole-10} = ${task.whole}.`]),button('Повторить',()=>{phase='answer';boxes=createBoxes(task!.a,task!.b);feedback.replaceChildren();drawBridge();}));if(mental)addBridgeDemo(feedback);return;
   }
   submit(calc&&transferComplete,text,{transferComplete,calculationCorrect:calc});
  },mental?['До десятки не хватает','Останется во второй части','Сумма']:['Сумма']);
  if(!mental&&!full){answer.inputs.forEach(i=>{i.disabled=true;});answer.submit.disabled=true;surface.append(el('p',{class:'ml-instruction'},['Сначала собери полную первую коробку.']));}
  surface.append(answer.form);
 }
 function onVisibility(){
  if(document.hidden&&(phase==='show'||phase==='prepare')){
   clear();currentDots?.remove();currentDots=null;phase='paused';surface.replaceChildren(el('p',{role:'status'},['Показ прерван. Посмотри точки ещё раз — без штрафа.']),button('Повторить показ',()=>{if(phase==='paused')drawGlance();}));
  }
 }
 document.addEventListener('visibilitychange',onVisibility);renderSettings();renderIdle();
 return()=>{disposed=true;clear();document.removeEventListener('visibilitychange',onVisibility);};
}
