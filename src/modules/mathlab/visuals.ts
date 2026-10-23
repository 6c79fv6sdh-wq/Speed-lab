import {el} from '../../core/ui';
import {dotLayout,occupied,transfer,type Boxes,type MathSettings,type Rng} from './logic';
export function tenFrame(n:number,second=0):HTMLElement {
 const frame=el('div',{class:'ml-frame','aria-label':`Рамка: ${n} из первой группы${second?`, ${second} из второй`:''}, свободно ${10-n-second}`});
 for(let i=0;i<10;i++)frame.append(el('span',{class:`ml-cell ${i<n?'ml-teal':i<n+second?'ml-amber':''}`,'aria-hidden':'true'},i<n+second?[el('span',{class:'ml-ball'})]:[]));
 return frame;
}
export function dots(n:number,layout:MathSettings['layout'],rng:Rng=Math.random):HTMLElement {
 const {points,frame}=dotLayout(n,layout,rng);
 const area=el('div',{class:`ml-dots ${frame?'ml-dots-frame':''}`,'aria-label':'Точки для запоминания'});
 if(frame)for(let i=0;i<10;i++)area.append(el('span',{class:'ml-dot-cell','aria-hidden':'true',style:`left:${(i%5)*20}%;top:${Math.floor(i/5)*50}%`}));
 for(const [i,p] of points.entries())area.append(el('span',{class:'ml-dot','aria-hidden':'true',style:`left:${p.x}%;top:${p.y}%;--orbit-duration:${1.5+i*.17}s;--orbit-delay:${-i*.31}s`}));
 return area;
}
/** Pointer drag and keyboard/tap selection share the same atomic state transition. */
export function mountBoxes(host:HTMLElement,state:Boxes,onChange:(next:Boxes)=>void,enabled=true):()=>void {
 host.replaceChildren();let selected:number|null=null;
 let drag:{id:number;from:number;x:number;y:number;button:HTMLElement;moved:boolean}|null=null;
 let ghost:HTMLElement|null=null;let hover:HTMLElement|null=null;let draggedButton:HTMLElement|null=null;
 const status=el('p',{class:'ml-instruction',role:'status'},['Перенеси шарик из второй коробки в свободную ячейку первой.']);
 const boxes=el('div',{class:'ml-boxes'});
 const targets:HTMLButtonElement[]=[];const sources:HTMLButtonElement[]=[];
 const count=occupied(state.left);
 if(count===10)status.textContent='Полная десятка готова. Найди сумму.';
 for(const side of ['left','right'] as const){
  const grid=el('div',{class:`ml-frame ml-transfer-frame ${side==='left'&&count===10?'ml-full':''}`,role:'group','aria-label':side==='left'?'Первая коробка':'Вторая коробка'});
  state[side].forEach((ball,index)=>{
   const button=el('button',{type:'button',class:`ml-cell ${ball?'ml-'+ball.origin:''}`,'aria-label':`${side==='left'?'Первая':'Вторая'} коробка, ячейка ${index+1}: ${ball?`шарик ${ball.origin==='teal'?'первой':'второй'} группы`:'свободно'}`,'data-side':side,'data-index':String(index)});
   if(ball)button.append(el('span',{class:'ml-ball','aria-hidden':'true'}));
   button.disabled=!enabled||(side==='left'?!!ball:!ball)||count===10;
   if(side==='left')targets.push(button);else sources.push(button);
   grid.append(button);
  });
  boxes.append(el('section',{},[el('h3',{},[side==='left'?'Первая коробка':'Вторая коробка']),grid]));
 }
 host.append(boxes,status);
 const select=(index:number|null)=>{selected=index;sources.forEach((b,i)=>{b.classList.toggle('ml-selected',i===index);b.setAttribute('aria-pressed',String(i===index));});status.textContent=index===null?'Выбери шарик во второй коробке.':'Теперь выбери свободную ячейку первой коробки.';};
 const cell=(target:EventTarget|null)=>target instanceof Element?target.closest<HTMLButtonElement>('button[data-side]'):null;
 const clean=()=>{ghost?.remove();ghost=null;hover?.classList.remove('ml-drop-target');hover=null;drag=null;};
 const commit=(from:number,to:number)=>{const next=transfer(state,from,to);if(next!==state)onChange(next);};
 const click=(e:MouseEvent)=>{
  const b=cell(e.target);if(!b||b.disabled)return;
  if(b===draggedButton){draggedButton=null;return;}
  const index=Number(b.dataset.index);
  if(b.dataset.side==='right')select(selected===index?null:index);
  else if(selected!==null)commit(selected,index);
  else status.textContent='Сначала выбери шарик во второй коробке.';
 };
 const down=(e:PointerEvent)=>{
  if(drag||!e.isPrimary||e.button!==0)return;
  const b=cell(e.target);if(!b||b.disabled||b.dataset.side!=='right')return;
  draggedButton=null;b.focus({preventScroll:true});
  drag={id:e.pointerId,from:Number(b.dataset.index),x:e.clientX,y:e.clientY,button:b,moved:false};b.setPointerCapture(e.pointerId);
 };
 const move=(e:PointerEvent)=>{
  if(!drag||drag.id!==e.pointerId)return;
  if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7)drag.moved=true;
  if(!drag.moved)return;
  if(!ghost){ghost=el('span',{class:'ml-drag-ghost ml-amber','aria-hidden':'true'},[el('span',{class:'ml-ball'})]);host.append(ghost);}
  ghost.style.left=`${e.clientX}px`;ghost.style.top=`${e.clientY}px`;
  hover?.classList.remove('ml-drop-target');hover=null;
  const b=cell(document.elementFromPoint(e.clientX,e.clientY));
  if(b&&host.contains(b)&&b.dataset.side==='left'&&!b.disabled){hover=b;b.classList.add('ml-drop-target');}
 };
 const up=(e:PointerEvent)=>{
  if(!drag||drag.id!==e.pointerId)return;
  const {from,moved,button}=drag;
  // Pointer-up owns this gesture. Consume its compatibility click regardless
  // of detail (touch browsers may report zero, just like keyboard clicks).
  draggedButton=button;
  const target=cell(document.elementFromPoint(e.clientX,e.clientY));
  if(button.hasPointerCapture(e.pointerId))button.releasePointerCapture(e.pointerId);
  clean();
  if(!moved){select(selected===from?null:from);return;}
  if(target&&host.contains(target)&&target.dataset.side==='left'&&!target.disabled)commit(from,Number(target.dataset.index));
  else{select(null);status.textContent='Шарик вернулся во вторую коробку. Выбери свободную ячейку первой.';}
 };
 const key=()=>{draggedButton=null;};
 host.addEventListener('keydown',key);host.addEventListener('click',click);host.addEventListener('pointerdown',down);host.addEventListener('pointermove',move);host.addEventListener('pointerup',up);host.addEventListener('pointercancel',clean);host.addEventListener('lostpointercapture',clean);
 return ()=>{clean();host.removeEventListener('keydown',key);host.removeEventListener('click',click);host.removeEventListener('pointerdown',down);host.removeEventListener('pointermove',move);host.removeEventListener('pointerup',up);host.removeEventListener('pointercancel',clean);host.removeEventListener('lostpointercapture',clean);};
}
