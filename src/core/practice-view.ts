import {el,button} from './ui';

/** Layout only: retain the same exercise nodes, handlers, timers and session. */
export function attachPracticeView(root:HTMLElement):()=>void {
  if(root.querySelector('.settings-page'))return ()=>{};
  const candidate=root.querySelector<HTMLElement>('.ml-stage,.ml-flow-stage')
    ??root.querySelector<HTMLElement>('.board-area')?.closest<HTMLElement>('.panel');
  if(!candidate)return ()=>{};
  const stage=candidate;
  const shell=stage.closest<HTMLElement>('.mathlab')??stage.parentElement??root;
  const attributes=new Map(['role','aria-label','aria-modal'].map(name=>[name,root.getAttribute(name)]));
  const previousOverflow=document.body.style.overflow;
  const htmlOverflow=document.documentElement.style.overflow;
  const viewportStyles=new Map(['width','height','left','top'].map(name=>[name,root.style.getPropertyValue(name)]));
  const restoreViewport=()=>{for(const [name,value] of viewportStyles){if(value)root.style.setProperty(name,value);else root.style.removeProperty(name);}};
  let active=false;

  shell.classList.add('practice-shell');
  stage.classList.add('practice-stage');
  const toggle=button('Играть на одном экране',()=>set(!active));
  toggle.setAttribute('aria-pressed','false');
  const bar=el('div',{class:'practice-bar'},[toggle]);
  shell.insertBefore(bar,stage);

  function restoreAttributes(){
    for(const [name,value] of attributes){
      if(value===null)root.removeAttribute(name);else root.setAttribute(name,value);
    }
  }
  function fit(){
    if(!active)return;
    const viewport=window.visualViewport;
    const height=viewport?.height??innerHeight;
    root.style.width=`${viewport?.width??innerWidth}px`;
    root.style.height=`${height}px`;
    root.style.left=`${viewport?.offsetLeft??0}px`;
    root.style.top=`${viewport?.offsetTop??0}px`;
    const width=root.clientWidth;
    const wide=width>=700||width>height*1.25;
    const reserve=wide?(stage.querySelector('.exercise-seg')?140:100):245;
    const boardSize=Math.max(160,Math.floor(Math.min(wide?width*.57-24:width-24,height-reserve)));
    root.style.setProperty('--practice-board',`${boardSize}px`);
    // Board reads this size using its normal fitting and coordinate machinery.
    window.dispatchEvent(new Event('practice-layout-change'));
  }
  function set(value:boolean){
    active=value;
    root.classList.toggle('practice-focused',value);
    if(value){
      root.setAttribute('role','dialog');
      root.setAttribute('aria-label','Игровой экран');
      root.setAttribute('aria-modal','true');
    }else restoreAttributes();
    toggle.textContent=value?'← Настройки и разделы':'Играть на одном экране';
    toggle.setAttribute('aria-pressed',String(value));
    document.body.style.overflow=value?'hidden':previousOverflow;
    document.documentElement.style.overflow=value?'hidden':htmlOverflow;
    if(value)fit();
    else{
      root.style.removeProperty('--practice-board');restoreViewport();
      window.dispatchEvent(new Event('practice-layout-change'));
    }
  }
  const start=(event:Event)=>{
    const target=(event.target as Element)?.closest('button');
    if(target&&stage.contains(target)&&['Старт','Начать','Новая серия','Новая попытка','Начать заново'].includes(target.textContent?.trim()??''))set(true);
  };
  const keyboard=(event:KeyboardEvent)=>{
    // Existing Escape/Space premove cancellation has priority over closing layout.
    if(event.defaultPrevented)return;
    if(active&&event.key==='Tab'){
      const controls=[...root.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]')]
        .filter(node=>node.getClientRects().length);
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!root.contains(document.activeElement)||!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
    if(event.key==='Escape'&&active){event.preventDefault();set(false);toggle.focus();}
  };
  root.addEventListener('click',start,true);
  window.addEventListener('keydown',keyboard);
  window.addEventListener('resize',fit);
  window.visualViewport?.addEventListener('resize',fit);
  window.visualViewport?.addEventListener('scroll',fit);

  set(true);

  return ()=>{
    root.removeEventListener('click',start,true);
    window.removeEventListener('keydown',keyboard);
    window.removeEventListener('resize',fit);
    window.visualViewport?.removeEventListener('resize',fit);
    window.visualViewport?.removeEventListener('scroll',fit);
    root.classList.remove('practice-focused');
    restoreAttributes();
    root.style.removeProperty('--practice-board');
    document.body.style.overflow=previousOverflow;
    document.documentElement.style.overflow=htmlOverflow;restoreViewport();
    bar.remove();
    shell.classList.remove('practice-shell');
    stage.classList.remove('practice-stage');
  };
}
