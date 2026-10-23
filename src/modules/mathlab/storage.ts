import {EXERCISES,sanitize,type Exercise,type MathSettings} from './logic';
import type {MathResult} from './engine';
const memory=new Map<string,string>();
export function mathStorage(owner='device',storage:Pick<Storage,'getItem'|'setItem'>|null=local()):{
  settings:(id:Exercise)=>MathSettings;saveSettings:(id:Exercise,s:MathSettings)=>boolean;results:()=>MathResult[];saveResult:(result:MathResult)=>boolean;
}{
  const prefix=`sciencechess-mathlab:v1:${owner}:`;
  const read=(key:string):unknown=>{try{const text=memory.get(prefix+key)??storage?.getItem(prefix+key);return text?JSON.parse(text):null;}catch{return null;}};
  const write=(key:string,value:unknown)=>{const text=JSON.stringify(value);memory.set(prefix+key,text);try{if(!storage)return false;storage.setItem(prefix+key,text);return true;}catch{return false;}};
  const results=()=>{const r=read('results');return Array.isArray(r)?r.filter((v):v is MathResult=>v?.version===1&&EXERCISES.includes(v.exercise)&&Number.isFinite(v.completedAt)&&Array.isArray(v.answers)&&Number.isInteger(v.correct)&&Number.isInteger(v.errors)).slice(-200):[];};
  return {settings:id=>sanitize(id,read(`settings:${id}`)),saveSettings:(id,s)=>write(`settings:${id}`,sanitize(id,s)),results,saveResult:r=>write('results',[...results(),r].slice(-200))};
}
function local():Storage|null{try{return window.localStorage;}catch{return null;}}
