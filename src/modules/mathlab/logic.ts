export const EXERCISES = ['glance', 'builder', 'friends', 'bridge', 'signs'] as const;
export type Exercise = typeof EXERCISES[number];
export interface MathSettings {
  mode: 'learn' | 'train' | 'explore'; count: number; min: number; max: number;
  exposure: number; moving: boolean; layout: 'standard' | 'groups' | 'random';
  unknown: 'first' | 'second' | 'random'; level: number; frame: boolean;
  whole: number; part: number; auto: boolean; edges: boolean; numbers: number[]; a: number; b: number;
}
export const TITLES: Record<Exercise,string> = {glance:'Мгновенный взгляд',builder:'Конструктор числа',friends:'Друзья десятки',bridge:'Дострой десятку',signs:'Плюсы и минусы'};
export function defaults(id:Exercise):MathSettings {
  return {mode:id==='builder'||id==='bridge'?'explore':'learn',count:10,min:id==='builder'||id==='signs'?2:1,max:id==='builder'||id==='signs'?10:4,
    exposure:1000,moving:false,layout:'standard',unknown:'random',level:1,frame:true,whole:8,part:8,auto:false,edges:false,numbers:[1,2,3,4,5,6,7,8,9],a:8,b:5};
}
const integer=(v:unknown,fallback:number,min:number,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max?v:fallback;
export function sanitize(id:Exercise,raw:unknown):MathSettings {
  const d=defaults(id);if(!raw||typeof raw!=='object')return d;
  const r=raw as Partial<MathSettings>;const min=integer(r.min,d.min,id==='builder'||id==='signs'?2:1,10);
  return {...d,mode:r.mode&&['learn','train','explore'].includes(r.mode)?r.mode:d.mode,
    count:[5,10,20,30].includes(r.count!)?r.count!:d.count,min,max:Math.max(min,integer(r.max,d.max,id==='builder'||id==='signs'?2:1,10)),
    exposure:[500,1000,2000,3000,5000].includes(r.exposure!)?r.exposure!:d.exposure,
    moving:typeof r.moving==='boolean'?r.moving:false,
    layout:r.layout&&['standard','groups','random'].includes(r.layout)?r.layout:d.layout,
    unknown:r.unknown&&['first','second','random'].includes(r.unknown)?r.unknown:d.unknown,
    whole:integer(r.whole,8,2,10),part:Math.min(integer(r.whole,8,2,10),integer(r.part,8,0,10)),level:integer(r.level,1,1,3),frame:typeof r.frame==='boolean'?r.frame:d.frame,auto:typeof r.auto==='boolean'?r.auto:d.auto,
    edges:typeof r.edges==='boolean'?r.edges:d.edges,
    numbers:Array.isArray(r.numbers)&&r.numbers.some(n=>Number.isInteger(n)&&n>=1&&n<=9)?[...new Set(r.numbers.filter(n=>Number.isInteger(n)&&n>=1&&n<=9))]:d.numbers,
    a:integer(r.a,8,1,9),b:integer(r.b,5,1,9)};
}
export type Rng=()=>number;
export const pickInt=(rng:Rng,min:number,max:number)=>min+Math.min(max-min,Math.floor(rng()*(max-min+1)));
export const complement=(n:number)=>10-n;
export function split(whole:number,part:number):[number,number] {
  const w=Math.max(2,Math.min(10,Math.round(whole)));
  const a=Math.max(0,Math.min(w,Math.round(part)));
  return [a,w-a];
}
export interface Task {a:number;b:number;whole:number;answer:number;missingFirst:boolean;reverse:boolean}
export function generate(id:Exercise,s:MathSettings,rng:Rng=Math.random,previous?:Task):Task {
  let task:Task;
  for(let attempt=0;;attempt++){
    let a=0,b=0,whole=0;let missingFirst=s.unknown==='first'||s.unknown==='random'&&rng()<.5;
    if(id==='glance'){whole=pickInt(rng,s.min,s.max);a=whole;}
    if(id==='signs'){whole=pickInt(rng,Math.max(2,s.min),s.max);a=pickInt(rng,1,whole-1);b=whole-a;}
    if(id==='builder'){whole=pickInt(rng,s.min,s.max);a=pickInt(rng,0,whole);b=whole-a;}
    if(id==='friends'){const ns=s.edges?[...s.numbers,0,10]:s.numbers;a=ns[pickInt(rng,0,ns.length-1)];b=complement(a);whole=10;missingFirst=s.level===3&&rng()<.5;}
    if(id==='bridge'){a=pickInt(rng,2,9);b=pickInt(rng,11-a,9);whole=a+b;}
    task={a,b,whole,answer:id==='bridge'||id==='glance'||id==='signs'?whole:missingFirst?a:b,missingFirst,reverse:id==='friends'&&s.level===3&&rng()<.5};
    if(attempt>=10||!previous||JSON.stringify(task)!==JSON.stringify(previous))return task;
  }
}
export interface DotPoint{x:number;y:number}
export function dotLayout(n:number,layout:MathSettings['layout'],rng:Rng=Math.random):{points:DotPoint[];frame:boolean} {
  if(n<1||n>10||!Number.isInteger(n))throw Error('Количество точек: 1–10');
  if(n>=5||layout==='groups')return {points:Array.from({length:n},(_,i)=>({x:10+(i%5)*20,y:25+Math.floor(i/5)*50})),frame:true};
  if(layout==='standard'){
    const shapes:Record<number,DotPoint[]>={1:[{x:50,y:50}],2:[{x:32,y:30},{x:68,y:70}],3:[{x:30,y:25},{x:50,y:50},{x:70,y:75}],4:[{x:30,y:25},{x:70,y:25},{x:30,y:75},{x:70,y:75}]};
    return {points:shapes[n],frame:false};
  }
  const cells=Array.from({length:12},(_,i)=>i);
  for(let i=cells.length-1;i>0;i--){const j=pickInt(rng,0,i);[cells[i],cells[j]]=[cells[j],cells[i]];}
  return {points:cells.slice(0,n).map(i=>({x:13+(i%4)*24+(rng()-.5)*4,y:18+Math.floor(i/4)*32+(rng()-.5)*4})),frame:false};
}
export interface Ball {id:string;origin:'teal'|'amber'}
export interface Boxes {a:number;b:number;left:(Ball|null)[];right:(Ball|null)[];history:{left:(Ball|null)[];right:(Ball|null)[]}[]}
export function validBridge(a:number,b:number):boolean{return Number.isInteger(a)&&Number.isInteger(b)&&a>=1&&a<=9&&b>=1&&b<=9&&a+b>10&&a+b<=18;}
export function createBoxes(a:number,b:number):Boxes {
  if(!validBridge(a,b))throw Error('Выбери числа от 1 до 9 с суммой больше 10.');
  return {a,b,left:Array.from({length:10},(_,i)=>i<a?{id:`t${i}`,origin:'teal'}:null),right:Array.from({length:10},(_,i)=>i<b?{id:`a${i}`,origin:'amber'}:null),history:[]};
}
export const occupied=(box:(Ball|null)[])=>box.filter(Boolean).length;
export function transfer(s:Boxes,from:number,to:number):Boxes {
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>=10||to<0||to>=10||!s.right[from]||s.left[to])return s;
  const left=[...s.left],right=[...s.right];left[to]=right[from];right[from]=null;
  return {...s,left,right,history:[...s.history,{left:s.left,right:s.right}]};
}
export function undo(s:Boxes):Boxes {const prev=s.history.at(-1);return prev?{...s,...prev,history:s.history.slice(0,-1)}:s;}

/** Twelve fixed slots keep every symbol separate, including on narrow screens. */
export function signLayout(plus:number,minus:number,rng:Rng=Math.random):('+'|'−'|null)[]{
 if(!Number.isInteger(plus)||!Number.isInteger(minus)||plus<0||minus<0||plus+minus<1||plus+minus>10)throw Error('На поле от 1 до 10 знаков');
 const slots:('+'|'−'|null)[]=[...Array(plus).fill('+'),...Array(minus).fill('−'),...Array(12-plus-minus).fill(null)];
 for(let i=slots.length-1;i>0;i--){const j=pickInt(rng,0,i);[slots[i],slots[j]]=[slots[j],slots[i]];}
 return slots;
}
