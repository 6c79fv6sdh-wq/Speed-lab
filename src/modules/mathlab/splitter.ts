import {playInteractionSound} from '../../core/move-sound';

/** One coordinate system for taps, dragging and the visible numbered rail. */
export function splitValueAt(x:number,left:number,width:number,max:number):number {
 if(width<=0||!Number.isFinite(x))return 0;
 return Math.max(0,Math.min(max,Math.round((x-left)/width*max)));
}
/** Native range remains the keyboard/screen-reader control; pointers use the whole rail. */
export function mountSplitter(rail:HTMLElement,slider:HTMLInputElement):()=>void {
 const hit=document.createElement('span');hit.className='ml-split-hit';hit.setAttribute('aria-hidden','true');rail.append(hit);
 let pointer:number|null=null;
 const set=(event:PointerEvent)=>{
  const rect=rail.getBoundingClientRect();
  if(rect.width<=0)return;
  rail.style.setProperty('--split-visual',`${Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100))}%`);
  const next=splitValueAt(event.clientX,rect.left,rect.width,Number(slider.max));
  if(next===Number(slider.value))return;
  slider.value=String(next);slider.dispatchEvent(new Event('input',{bubbles:true}));
  playInteractionSound('choice',false);
 };
 const down=(event:PointerEvent)=>{
  if(pointer!==null||event.isPrimary===false||event.button!==0||slider.disabled)return;
  event.preventDefault();pointer=event.pointerId;rail.classList.add('is-dragging');
  slider.focus({preventScroll:true});rail.setPointerCapture?.(event.pointerId);set(event);
 };
 const move=(event:PointerEvent)=>{if(pointer===event.pointerId)set(event);};
 const release=()=>{
  const id=pointer;pointer=null;rail.classList.remove('is-dragging');rail.style.removeProperty('--split-visual');
  if(id!==null&&rail.hasPointerCapture?.(id))rail.releasePointerCapture(id);
 };
 const up=(event:PointerEvent)=>{if(pointer!==event.pointerId)return;set(event);release();};
 const cancel=(event:PointerEvent)=>{if(pointer===event.pointerId)release();};
 rail.addEventListener('pointerdown',down);rail.addEventListener('pointermove',move);
 rail.addEventListener('pointerup',up);rail.addEventListener('pointercancel',cancel);rail.addEventListener('lostpointercapture',cancel);
 window.addEventListener('blur',release);
 return()=>{release();hit.remove();rail.removeEventListener('pointerdown',down);rail.removeEventListener('pointermove',move);rail.removeEventListener('pointerup',up);rail.removeEventListener('pointercancel',cancel);rail.removeEventListener('lostpointercapture',cancel);window.removeEventListener('blur',release);};
}
