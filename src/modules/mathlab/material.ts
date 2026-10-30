import type {Rng} from './logic';
const pickInt=(rng:Rng,min:number,max:number)=>min+Math.min(max-min,Math.floor(rng()*(max-min+1)));
export const PIECE_VALUES={P:1,N:3,B:3,R:5,Q:9} as const;
export type MaterialPiece=keyof typeof PIECE_VALUES;
export const PIECE_NAMES:Record<MaterialPiece,string>={P:'Пешка',N:'Конь',B:'Слон',R:'Ладья',Q:'Ферзь'};
export const materialValue=(pieces:readonly MaterialPiece[])=>pieces.reduce((sum,p)=>sum+PIECE_VALUES[p],0);
export const materialSign=(a:number,b:number)=>a===b?'=':a>b?'>':'<';
// Enumerate unordered groups once. Equal-value tasks can compare different pieces,
// rather than two copies of the same group. No kings or positional evaluation.
const groups:MaterialPiece[][]=[];
const kinds=Object.keys(PIECE_VALUES) as MaterialPiece[];
function collect(prefix:MaterialPiece[],start:number){
 if(prefix.length)groups.push(prefix);
 if(prefix.length===3)return;
 for(let i=start;i<kinds.length;i++){
  const next=[...prefix,kinds[i]];if(materialValue(next)<=15)collect(next,i);
 }
}
collect([],0);
const pairsByRelation=[-1,0,1].map(relation=>groups.flatMap(left=>groups.filter(right=>Math.sign(materialValue(left)-materialValue(right))===relation&&left.join('')!==right.join('')).map(right=>({left,right}))));
export function materialTask(rng:Rng=Math.random):{left:MaterialPiece[];right:MaterialPiece[]}{
 const pairs=pairsByRelation[pickInt(rng,0,2)];
 const pair=pairs[pickInt(rng,0,pairs.length-1)];
 return {left:[...pair.left],right:[...pair.right]};
}
