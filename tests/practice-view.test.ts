import {it,expect,vi} from 'vitest';
import {attachPracticeView} from '../src/core/practice-view';
it('keeps exercise nodes and state alive when entering/exiting and restores layout on disposal',()=>{
 const root=document.createElement('main');root.setAttribute('role','main');root.style.width='400px';root.innerHTML='<div class="mathlab"><section>Settings</section><section class="ml-stage"><button>Начать</button><div id="task"></div></section></div>';document.body.append(root);const task=root.querySelector('#task'),start=root.querySelector<HTMLButtonElement>('.ml-stage button')!;let answers=0;start.addEventListener('click',()=>{answers++;task!.textContent=String(answers);});const previous=document.body.style.overflow;document.body.style.overflow='auto';const resize=vi.fn();window.addEventListener('practice-layout-change',resize);const dispose=attachPracticeView(root);
 try{
  expect(root.classList.contains('practice-focused')).toBe(true);
  start.click();expect(root.classList.contains('practice-focused')).toBe(true);expect(root.querySelector('#task')).toBe(task);expect(task!.textContent).toBe('1');expect(document.body.style.overflow).toBe('hidden');
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));expect(root.classList.contains('practice-focused')).toBe(false);expect(task!.textContent).toBe('1');expect(root.getAttribute('role')).toBe('main');expect(root.style.width).toBe('400px');
  start.click();expect(answers).toBe(2);dispose();expect(document.body.style.overflow).toBe('auto');expect(root.getAttribute('role')).toBe('main');expect(root.querySelector('.practice-bar')).toBeNull();
  start.click();expect(answers).toBe(3);expect(root.classList.contains('practice-focused')).toBe(false);expect(resize).toHaveBeenCalled();
 }finally{window.removeEventListener('practice-layout-change',resize);dispose();root.remove();document.body.style.overflow=previous;}
});
it('does not hijack Escape already used to cancel a premove',()=>{
 const root=document.createElement('main');root.innerHTML='<section class="panel"><div class="board-area"><button>Старт</button></div></section>';document.body.append(root);const dispose=attachPracticeView(root);
 try{root.querySelector<HTMLButtonElement>('.board-area button')!.click();const event=new KeyboardEvent('keydown',{key:'Escape',cancelable:true});event.preventDefault();window.dispatchEvent(event);expect(root.classList.contains('practice-focused')).toBe(true);}finally{dispose();root.remove();}
});
it('ignores settings previews and auto-opens an already active stream',()=>{
 const settings=document.createElement('main');settings.innerHTML='<div class="settings-page"><section class="panel"><div class="board-area"></div></section></div>';const stop=attachPracticeView(settings);expect(settings.querySelector('.practice-bar')).toBeNull();stop();const flow=document.createElement('main');flow.innerHTML='<div class="mathlab"><section class="ml-flow-stage"></section></div>';document.body.append(flow);const dispose=attachPracticeView(flow);try{expect(flow.classList.contains('practice-focused')).toBe(true);}finally{dispose();flow.remove();}
});
