import {it,expect} from 'vitest';
import {PIECE_VALUES,materialValue,materialSign,materialTask} from '../src/modules/mathlab/material';
import {defaults,generate} from '../src/modules/mathlab/logic';
import {MathSeries} from '../src/modules/mathlab/engine';
import {mathStorage} from '../src/modules/mathlab/storage';
it('compares conventional values, including equal groups of different pieces',()=>{
 expect(PIECE_VALUES).toEqual({P:1,N:3,B:3,R:5,Q:9});
 expect(materialSign(materialValue(['Q']),materialValue(['B','R']))).toBe('>');
 expect(materialSign(materialValue(['R','P']),materialValue(['N','B']))).toBe('=');
 expect(materialSign(materialValue(['N','P']),materialValue(['R']))).toBe('<');
});
it('generates reproducible varied groups and all three relations without kings',()=>{
 const random=(initial:number)=>{let seed=initial;return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);};
 const first=random(43),second=random(43),relations=new Set<number>(),pieces=new Set<string>();
 for(let i=0;i<300;i++){
  const task=generate('material',defaults('material'),first);expect(task).toEqual(generate('material',defaults('material'),second));
  for(const group of [task.left!,task.right!]){expect(group.length).toBeGreaterThan(0);expect(group.length).toBeLessThanOrEqual(3);for(const p of group)pieces.add(p);}
  expect(task.a).toBe(materialValue(task.left!));expect(task.b).toBe(materialValue(task.right!));expect(task.answer).toBe(Math.sign(task.a-task.b));relations.add(task.answer);
  expect(task.left).not.toEqual(task.right);
 }
 expect([...relations].sort()).toEqual([-1,0,1]);expect(pieces.size).toBe(5);
 expect(materialTask(()=>0)).toEqual(materialTask(()=>0));expect(materialTask(()=>.999)).toEqual(materialTask(()=>.999));
});
it('stores the actual groups and first attempt independently of other exercises',()=>{
 const s=new MathSeries('material',{...defaults('material'),count:5});const task=generate('material',defaults('material'),()=>.5);
 s.begin();const answer={task,answer:'=',correct:true,responseMs:100,hint:false};expect(s.submit(answer)).toBe(true);expect(s.submit({...answer,correct:false})).toBe(false);
 const storage=mathStorage('material-test',null);storage.saveResult(s.finish(42));expect(storage.results()[0].answers[0].task.left).toEqual(task.left);expect(storage.results()[0].exercise).toBe('material');
});
