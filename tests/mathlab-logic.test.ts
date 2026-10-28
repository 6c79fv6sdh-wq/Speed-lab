import {describe,it,expect} from 'vitest';
import {defaults,sanitize,split,complement,generate,signLayout,dotLayout,createBoxes,transfer,undo,occupied,validBridge} from '../src/modules/mathlab/logic';
import {MathSeries} from '../src/modules/mathlab/engine';
import {mathStorage} from '../src/modules/mathlab/storage';
const rng=(seed:number)=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
describe('MathLab mathematical invariants',()=>{
 it('preserves every split and clamps a changed whole',()=>{
  for(let whole=2;whole<=10;whole++)for(let a=-1;a<=11;a++){
   const [left,right]=split(whole,a);expect(left+right).toBe(whole);expect(left).toBeGreaterThanOrEqual(0);expect(right).toBeGreaterThanOrEqual(0);expect(split(whole,right)).toEqual([right,left]);
  }
 });
 it('complements every integer from 0 to 10, including endpoints',()=>{for(let n=0;n<=10;n++)expect(n+complement(n)).toBe(10);});
 it('generates valid independent tasks reproducibly in every exercise',()=>{
  for(const id of ['builder','friends','glance','bridge'] as const){
   const s={...defaults(id),min:id==='builder'?2:1,max:10,edges:true,level:3};const first=rng(12),second=rng(12);
   for(let i=0;i<200;i++){const t=generate(id,s,first);expect(t).toEqual(generate(id,s,second));if(id==='bridge')expect(validBridge(t.a,t.b)).toBe(true);if(id==='friends')expect(t.a+t.b).toBe(10);if(id==='builder')expect(t.a+t.b).toBe(t.whole);expect(t.answer).toBeGreaterThanOrEqual(0);expect(t.answer).toBeLessThanOrEqual(18);}
  }
 });
 it.each([[8,5,13],[7,6,13],[6,6,12],[9,8,17],[9,9,18]])('%i + %i yields a full ten and %i without creating or losing balls',(a,b,sum)=>{
  let state=createBoxes(a,b);const initial=state;
  const check=()=>{const balls=[...state.left,...state.right].filter(Boolean);expect(balls.length).toBe(sum);expect(new Set(balls.map(ball=>ball!.id)).size).toBe(sum);expect(balls.filter(ball=>ball!.origin==='teal')).toHaveLength(a);expect(balls.filter(ball=>ball!.origin==='amber')).toHaveLength(b);};
  for(let i=0;i<10-a;i++){const before=state;state=transfer(state,state.right.findIndex(Boolean),state.left.findIndex(v=>!v));check();expect(occupied(state.left)).toBe(a+i+1);expect(undo(state)).toEqual(before);}
  expect(occupied(state.right)).toBe(sum-10);expect(occupied(state.left)).toBe(10);expect(transfer(state,0,0)).toBe(state);
  while(state.history.length)state=undo(state);expect(state).toEqual(initial);
 });
 it('rejects occupied cells, missing sources and invalid indices',()=>{const s=createBoxes(8,5);for(const [from,to] of [[0,0],[9,8],[-1,8],[0,10],[0,1.5]])expect(transfer(s,from,to)).toBe(s);expect(()=>createBoxes(4,3)).toThrow();expect(()=>createBoxes(0,11)).toThrow();});
 it('generates non-overlapping dots with mandatory structures above four',()=>{
  for(const layout of ['random','groups','standard'] as const)for(let n=1;n<=10;n++){
   const data=dotLayout(n,layout,rng(n));expect(data.points).toHaveLength(n);if(n>=5)expect(data.frame).toBe(true);
   for(const point of data.points){expect(point.x).toBeGreaterThanOrEqual(9);expect(point.x).toBeLessThanOrEqual(91);expect(point.y).toBeGreaterThan(10);expect(point.y).toBeLessThan(90);}
   for(let i=0;i<n;i++)for(let j=0;j<i;j++)expect(Math.hypot(data.points[i].x-data.points[j].x,data.points[i].y-data.points[j].y)).toBeGreaterThan(18);
  }
 });
 it('counts only the first answer, stores hints and separates time from correctness',()=>{
  const s=new MathSeries('friends',{...defaults('friends'),count:5});const task=generate('friends',defaults('friends'),rng(1));
  const answer={task,correct:true,answer:String(task.answer),responseMs:900000,hint:false};s.begin();expect(s.submit(answer)).toBe(true);expect(s.submit({...answer,correct:false})).toBe(false);expect(s.finish().correct).toBe(1);
  s.begin();s.submit({...answer,correct:false,hint:true});expect(s.finish().hints).toBe(1);expect(s.finish().errors).toBe(1);
 });
 it('sanitizes stale settings and falls back to memory when persistence is blocked',()=>{
  const blocked={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}};
  const storage=mathStorage('blocked-test',blocked);const s={...defaults('glance'),exposure:3000};expect(storage.saveSettings('glance',s)).toBe(false);expect(storage.settings('glance').exposure).toBe(3000);
  expect(sanitize('builder',{min:20,max:-1,count:17,whole:5,part:9}).part).toBe(5);
  expect(sanitize('friends',{numbers:[]}).numbers).toHaveLength(9);
 });
});

it('generates both kinds of signs with at most ten symbols and deterministic shuffled slots',()=>{
 const random=rng(47),same=rng(47);const settings=defaults('signs');
 for(let i=0;i<500;i++){
  const task=generate('signs',settings,random);expect(task).toEqual(generate('signs',settings,same));
  expect(task.a).toBeGreaterThan(0);expect(task.b).toBeGreaterThan(0);expect(task.a+task.b).toBe(task.whole);expect(task.whole).toBeLessThanOrEqual(10);
  const slots=signLayout(task.a,task.b,rng(i));expect(slots).toHaveLength(12);expect(slots.filter(s=>s==='+')).toHaveLength(task.a);expect(slots.filter(s=>s==='−')).toHaveLength(task.b);expect(slots).toEqual(signLayout(task.a,task.b,rng(i)));
 }
 for(const pair of [[-1,2],[6,5],[0,0],[1.5,2]])expect(()=>signLayout(pair[0],pair[1])).toThrow();
});
