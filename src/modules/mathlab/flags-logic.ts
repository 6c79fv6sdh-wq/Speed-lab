import {FLAG_COUNTRIES} from './flag-countries';
export type FlagCode=typeof FLAG_COUNTRIES[number]['code'];
export type FlagPool='all'|'familiar'|'rare';
export const FLAG_POOLS:Record<FlagPool,string>={all:'Все страны',familiar:'Знакомые флаги',rare:'Редкие флаги'};
const familiar=new Set('ru us gb fr de it es pt cn jp kr in br ca au nz tr eg gr se no fi dk nl be ch at pl ua by kz am az ge uz kg tj mn th vn ar mx'.split(' '));
const rare=new Set('bt bz ki nr tv pw mh fm st km dj sz ls vu ws to tl cv kn lc vc ag dm gd sb pg sr gy bj gw gq ga gm er so ss na mw bi rw sc mu mv bf cf td tg mg mr'.split(' '));
export const countryByCode=new Map<string,typeof FLAG_COUNTRIES[number]>(FLAG_COUNTRIES.map(c=>[c.code,c]));
export const flagCountries=(pool:FlagPool)=>FLAG_COUNTRIES.filter(c=>pool==='all'||(pool==='familiar'?familiar:rare).has(c.code));
// Normalized flag images can make these countries visually indistinguishable.
const twins=[['mc','id'],['td','ro'],['nl','lu']];
export const confusableFlags=(a:string,b:string)=>twins.some(group=>group.includes(a)&&group.includes(b));
export interface FlagTask {country:FlagCode;options:FlagCode[]}
const index=(length:number,rng:()=>number)=>Math.min(length-1,Math.floor(rng()*length));
function shuffled<T>(values:readonly T[],rng:()=>number):T[]{const result=[...values];for(let i=result.length-1;i>0;i--){const j=index(i+1,rng);[result[i],result[j]]=[result[j],result[i]];}return result;}
export class FlagDeck {
 private remaining:FlagCode[]=[];
 constructor(readonly pool:FlagPool='all',private rng:()=>number=Math.random){}
 next(previous?:FlagCode):FlagTask{
  const countries=flagCountries(this.pool);
  if(!this.remaining.length)this.remaining=shuffled(countries.map(c=>c.code),this.rng);
  const last=this.remaining.length-1;
  if(previous===this.remaining[last]&&last>0)[this.remaining[0],this.remaining[last]]=[this.remaining[last],this.remaining[0]];
  const country=this.remaining.pop()!;
  const distractors=shuffled(countries.filter(c=>c.code!==country&&!confusableFlags(country,c.code)).map(c=>c.code),this.rng).slice(0,3);
  return {country,options:shuffled([country,...distractors],this.rng)};
 }
}
export interface FlagProgress {version:1;pool:FlagPool;total:number;correct:number;task:FlagTask;selected:FlagCode|null}
export function validFlagProgress(raw:unknown):raw is FlagProgress{
 const s=raw as FlagProgress|undefined;
 if(!s||s.version!==1||!['all','familiar','rare'].includes(s.pool)||!Number.isSafeInteger(s.total)||!Number.isSafeInteger(s.correct)||s.correct<0||s.total<0||s.correct>s.total||!s.task||!Array.isArray(s.task.options))return false;
 const allowed=new Set(flagCountries(s.pool).map(c=>c.code));
 return allowed.has(s.task.country)&&s.task.options.length===4&&new Set(s.task.options).size===4&&s.task.options.every(c=>allowed.has(c))&&s.task.options.includes(s.task.country)&&!s.task.options.some(c=>c!==s.task.country&&confusableFlags(c,s.task.country))&&(s.selected===null||s.total>0&&s.task.options.includes(s.selected));
}
