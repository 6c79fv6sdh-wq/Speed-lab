export type Movement='walk'|'knight';
export interface PlannerSettings{size:5|6;movement:Movement;checkpoints:0|1|2;changing:boolean;seconds:0|60|120}
export const plannerDefaults:PlannerSettings={size:5,movement:'walk',checkpoints:1,changing:true,seconds:0};
export function validPlannerSettings(raw:unknown):raw is PlannerSettings{const s=raw as PlannerSettings;return !!s&&[5,6].includes(s.size)&&['walk','knight'].includes(s.movement)&&[0,1,2].includes(s.checkpoints)&&typeof s.changing==='boolean'&&[0,60,120].includes(s.seconds);}
export interface Puzzle{size:5|6;movement:Movement;start:number;goal:number;checkpoints:number[];blocked:number[];after:Record<number,number[]>;changing:boolean}
export function neighbors(size:number,movement:Movement,cell:number):number[]{
 const x=cell%size,y=Math.floor(cell/size),deltas=movement==='walk'?[[1,0],[-1,0],[0,1],[0,-1]]:[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
 return deltas.filter(([dx,dy])=>x+dx>=0&&x+dx<size&&y+dy>=0&&y+dy<size).map(([dx,dy])=>(y+dy)*size+x+dx);
}
export function checkpointProgress(p:Puzzle,path:readonly number[]):number{let next=0;for(const cell of path)if(cell===p.checkpoints[next])next++;return next;}
export const obstacles=(p:Puzzle,path:readonly number[])=>p.changing&&path.length>1?p.after[path[1]]??p.blocked:p.blocked;
export const legalMoves=(p:Puzzle,path:readonly number[])=>neighbors(p.size,p.movement,path.at(-1)!).filter(cell=>!obstacles(p,path).includes(cell));
export const move=(p:Puzzle,path:readonly number[],cell:number):number[]|null=>legalMoves(p,path).includes(cell)?[...path,cell]:null;
export const reached=(p:Puzzle,path:readonly number[])=>path.at(-1)===p.goal&&checkpointProgress(p,path)===p.checkpoints.length;
/** Breadth-first search includes ordered waypoint progress, not just position. */
function search(p:Puzzle,start:number,progress:number,blocked:readonly number[]):number[]|null{
 const queue=[{cell:start,progress,parent:-1}],seen=new Set([`${start}:${progress}`]);
 for(let i=0;i<queue.length;i++){
  const current=queue[i];
  if(current.cell===p.goal&&current.progress===p.checkpoints.length){const path:number[]=[];let at=i;while(at>=0){path.push(queue[at].cell);at=queue[at].parent;}return path.reverse();}
  for(const cell of neighbors(p.size,p.movement,current.cell)){
   if(blocked.includes(cell))continue;const next=current.progress+(cell===p.checkpoints[current.progress]?1:0),key=`${cell}:${next}`;
   if(!seen.has(key)){seen.add(key);queue.push({cell,progress:next,parent:i});}
  }
 }
 return null;
}
/** From the initial square, dynamic puzzles branch exactly once at the first step. */
export function remainingRoute(p:Puzzle,path:readonly number[]):number[]|null{
 if(!p.changing||path.length>1)return search(p,path.at(-1)!,checkpointProgress(p,path),obstacles(p,path));
 let best:number[]|null=null;
 for(const first of legalMoves(p,path)){
  const route=search(p,first,checkpointProgress(p,[p.start,first]),p.after[first]??p.blocked);
  if(route&&(!best||route.length+1<best.length))best=[p.start,...route];
 }
 return best;
}
function shuffle<T>(items:readonly T[],rng:()=>number):T[]{const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.min(i,Math.floor(rng()*(i+1)));[result[i],result[j]]=[result[j],result[i]];}return result;}
function prepareChanges(p:Puzzle,rng:()=>number):boolean{
 for(const first of legalMoves(p,[p.start])){
  const progress=checkpointProgress(p,[p.start,first]);const baseline=search(p,first,progress,p.blocked);if(!baseline)return false;
  const protectedCells=[p.start,p.goal,first,...p.checkpoints];
  const candidates=shuffle(baseline.slice(1,-1),rng).concat(shuffle(Array.from({length:p.size*p.size},(_,i)=>i),rng));
  let changed:number[]|undefined;
  for(const added of candidates){
   if(protectedCells.includes(added)||p.blocked.includes(added))continue;
   const base=p.blocked.length?p.blocked.filter(cell=>cell!==p.blocked[0]):[];
   const next=[...base,added];if(search(p,first,progress,next)){changed=next;break;}
  }
  // Opening a wall is a safe fallback on a narrow corridor.
  if(!changed&&p.blocked.length)changed=p.blocked.slice(1);
  if(!changed)return false;p.after[first]=changed;
 }
 return true;
}
export function generatePuzzle(settings:PlannerSettings,rng:()=>number=Math.random):Puzzle{
 for(let attempt=0;attempt<101;attempt++){
  const size=settings.size,start=0,goal=size*size-1;
  const available=shuffle(Array.from({length:size*size-2},(_,i)=>i+1),rng);
  const checkpoints=available.slice(0,settings.checkpoints);
  const blocked=attempt===100?[]:available.slice(settings.checkpoints,settings.checkpoints+(size===5?5:9));
  const p:Puzzle={size,movement:settings.movement,start,goal,checkpoints,blocked,after:{},changing:settings.changing};
  if(!search(p,start,0,blocked))continue;
  if(settings.changing&&!prepareChanges(p,rng))continue;
  if(remainingRoute(p,[start]))return p;
 }
 throw new Error('Не удалось создать проходимое поле');
}
