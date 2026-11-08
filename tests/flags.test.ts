import {it,expect,vi} from 'vitest';
import {FLAG_COUNTRIES} from '../src/modules/mathlab/flag-countries';
import {FlagDeck,flagCountries,confusableFlags,validFlagProgress} from '../src/modules/mathlab/flags-logic';
import {mountFlags} from '../src/modules/mathlab/flags';
import type {AppContext} from '../src/main';
import {readFileSync,existsSync} from 'node:fs';
const rng=(initial:number)=>{let seed=initial;return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);};
it('has 195 distinct countries with real self-contained local SVGs and rare countries',()=>{
 expect(FLAG_COUNTRIES).toHaveLength(195);expect(new Set(FLAG_COUNTRIES.map(c=>c.code)).size).toBe(195);expect(new Set(FLAG_COUNTRIES.map(c=>c.name)).size).toBe(195);
 for(const country of FLAG_COUNTRIES){const path=`public/flags/${country.code}.svg`;expect(existsSync(path)).toBe(true);const svg=readFileSync(path,'utf8');expect(svg).toContain('<svg');expect(svg).not.toMatch(/<script|(?:href|src)=["']https?:/);}
 for(const code of ['bt','nr','tv','pw','ki','fm','mh','st'])expect(flagCountries('rare').some(c=>c.code===code)).toBe(true);
});
it('generates four distinct choices, one correct, all answer positions and no ambiguous twin',()=>{
 for(const pool of ['all','familiar','rare'] as const){const deck=new FlagDeck(pool,rng(7)),same=new FlagDeck(pool,rng(7));const seen=new Set(),positions=new Set();let previous;
  for(let i=0;i<flagCountries(pool).length*3;i++){
   const task=deck.next(previous);expect(task).toEqual(same.next(previous));expect(task.options).toHaveLength(4);expect(new Set(task.options).size).toBe(4);expect(task.options.filter(c=>c===task.country)).toHaveLength(1);expect(task.country).not.toBe(previous);expect(task.options.some(c=>c!==task.country&&confusableFlags(c,task.country))).toBe(false);
   if(i<flagCountries(pool).length){expect(seen.has(task.country)).toBe(false);seen.add(task.country);}positions.add(task.options.indexOf(task.country));previous=task.country;
  }expect(positions.size).toBe(4);
 }
});
it('rejects stale or malformed progress',()=>{
 const task=new FlagDeck('all',rng(2)).next();const good={version:1,pool:'all',total:1,correct:1,task,selected:task.country};expect(validFlagProgress(good)).toBe(true);
 for(const bad of [null,{}, {...good,total:-1},{...good,correct:2},{...good,pool:'missing'},{...good,selected:'xx'},{...good,task:{...task,options:[task.country,task.country,task.country,task.country]}}])expect(validFlagProgress(bad)).toBe(false);
});
function mount(id:string){const root=document.createElement('main');document.body.append(root);const dispose=mountFlags(root,{profile:{id}} as AppContext);return {root,dispose};}
function load(root:HTMLElement){root.querySelector<HTMLImageElement>('img')!.dispatchEvent(new Event('load'));}
it('blocks answers before load, counts only once, shows feedback and preserves answered progress',()=>{
 const key='sciencechess-mathlab:v1:flags-ui:flags';const task={country:'bt',options:['bt','nr','tv','pw']};localStorage.setItem(key,JSON.stringify({version:1,pool:'all',total:0,correct:0,task,selected:null}));let {root,dispose}=mount('flags-ui');
 try{
  expect(root.querySelector('img')!.alt).not.toContain('Бутан');const wrong=root.querySelector<HTMLButtonElement>('[data-country="nr"]')!;wrong.click();expect(root.querySelector('.flags-feedback')!.textContent).toBe('');load(root);wrong.click();wrong.click();
  expect(root.querySelector('.flags-feedback')!.textContent).toContain('Бутан');expect(root.querySelectorAll('.flags-correct')).toHaveLength(1);expect(root.querySelectorAll('.flags-wrong')).toHaveLength(1);expect(JSON.parse(localStorage.getItem(key)!).total).toBe(1);
  dispose();root.remove();({root,dispose}=mount('flags-ui'));load(root);expect(root.querySelectorAll<HTMLButtonElement>('.flags-choices button')).toHaveLength(4);expect([...root.querySelectorAll<HTMLButtonElement>('.flags-choices button')].every(b=>b.disabled)).toBe(true);
  [...root.querySelectorAll('button')].find(b=>b.textContent==='Дальше')!.click();expect(root.querySelector('img')!.getAttribute('src')).not.toContain('/bt.svg');expect(root.querySelector('.flags-feedback')!.textContent).toBe('');
 }finally{dispose();root.remove();}
});
it('recovers from image errors without scoring and keeps choices working after retry',()=>{
 const {root,dispose}=mount('flags-retry');
 try{
  const img=root.querySelector('img')!;img.dispatchEvent(new Event('error'));expect(root.textContent).toContain('Не удалось загрузить флаг');
  [...root.querySelectorAll('button')].find(b=>b.textContent==='Повторить загрузку')!.click();load(root);root.querySelector<HTMLButtonElement>('.flags-choices button')!.click();expect(root.querySelector('.flags-feedback')!.textContent).not.toBe('');
 }finally{dispose();root.remove();}
});
it('works with blocked storage, resets incompatible pool state and ignores unloaded or unmounted clicks',()=>{
 const blocked=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('blocked');});const {root,dispose}=mount('flags-blocked');
 try{
  load(root);root.querySelector<HTMLButtonElement>('.flags-choices button')!.click();expect(root.textContent).toContain('только в этой вкладке');const pool=root.querySelector('select')!;pool.value='rare';pool.dispatchEvent(new Event('change'));expect(root.querySelector('.flags-progress')!.textContent).toContain('Вопрос 1');
  const before=root.querySelector('.ml-stats')!.textContent;load(root);dispose();root.querySelector<HTMLButtonElement>('.flags-choices button')!.click();expect(root.querySelector('.ml-stats')!.textContent).toBe(before);
 }finally{dispose();root.remove();blocked.mockRestore();}
});
