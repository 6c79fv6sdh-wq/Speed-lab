// Composed positions, not falsely attributed games. Exact #2 proof plus Stockfish.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {Chess} from 'chessops/chess';
import {parseFen,makeFen} from 'chessops/fen';
import {parseSquare} from 'chessops/util';
import {solveMateTwo} from '../src/core/mate-two.ts';
import {NodeEngine,ENGINE_VERSION} from './premove-engine.mjs';
let seed=20261021;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const source=JSON.parse(readFileSync('data/mate-in-1-500.json','utf8')).puzzles;
const engine=new NodeEngine();
const checkpoint='/tmp/mate-two-pack-checkpoint.json';
const puzzles=existsSync(checkpoint)?JSON.parse(readFileSync(checkpoint,'utf8')):[];
const fingerprint=fen=>{
 const [board,turn]=fen.split(' ');
 const flip=s=>s.replace(/[a-zA-Z]/g,c=>c===c.toUpperCase()?c.toLowerCase():c.toUpperCase());
 const mirror=b=>b.split('/').map(r=>r.split('').reverse().join('')).join('/');
 const invert=flip(board.split('/').reverse().join('/'));
 return [board+' '+turn,mirror(board)+' '+turn,invert+' '+(turn==='w'?'b':'w'),mirror(invert)+' '+(turn==='w'?'b':'w')].sort()[0];
};
const seen=new Set(puzzles.map(p=>fingerprint(p.fen)));
const parents=new Set(puzzles.map(p=>p.parentId));
try{
 for(let attempt=0;attempt<40000 && puzzles.length<100;attempt++){
  const parent=source[attempt%source.length];
  if(parents.has(parent.id))continue;
  const setup=parseFen(parent.fen).unwrap();
  const from=parseSquare(parent.solutionUci.slice(0,2));
  const piece=setup.board.get(from);
  if(!piece||piece.role==='king'||piece.role==='pawn')continue;
  const to=Math.floor(rnd()*64);
  if(setup.board.has(to))continue;
  setup.board.take(from);setup.board.set(to,piece);
  const result=Chess.fromSetup(setup);if(result.isErr)continue;
  const pos=result.unwrap();if(pos.isEnd())continue;
  const fen=makeFen(pos.toSetup()),key=fingerprint(fen);
  if(seen.has(key))continue;
  const solved=solveMateTwo(pos);
  if(solved.mateInOne||solved.solutions.length!==1)continue;
  const analysis=await engine.analyse(fen,{depth:16,multipv:1});
  if(analysis[0]?.mate!==2||analysis[0].move!==solved.solutions[0].firstUci){console.log('Reject engine mismatch',fen,analysis);continue;}
  const p={id:`M2-${String(puzzles.length+1).padStart(3,'0')}`,fen,sideToMove:pos.turn,boardOrientation:pos.turn,
    parentId:parent.id,source:'Composed training position',solution:solved.solutions[0],
    verification:{engine:ENGINE_VERSION,depth:16,analysis,exactProof:'all legal first moves, all legal defences and all mate-in-one finishes'}};
  puzzles.push(p);seen.add(key);parents.add(parent.id);
  writeFileSync(checkpoint,JSON.stringify(puzzles));
  console.log(`Verified ${puzzles.length}/100: ${p.sideToMove}, ${p.solution.firstSan}, ${p.solution.branches.length} defences`);
 }
 if(puzzles.length<100)throw Error(`Only ${puzzles.length} tasks; no incomplete pack published`);
 const pack={schemaVersion:1,title:'Мат в 2 — 100 проверенных задач',source:'Composed training positions; no game attribution',puzzles};
 writeFileSync('data/mate-in-2-100.json',JSON.stringify(pack,null,2)+'\n');
 writeFileSync('src/data/puzzles-mate-two.ts',`import type {MateTwoSolution} from '../core/mate-two';\nexport interface MateTwoPuzzle {id:string;fen:string;sideToMove:'white'|'black';boardOrientation:'white'|'black';solution:MateTwoSolution}\nexport const MATE_TWO_PUZZLES:MateTwoPuzzle[] = ${JSON.stringify(puzzles.map(({id,fen,sideToMove,boardOrientation,solution})=>({id,fen,sideToMove,boardOrientation,solution})),null,2)};\n`);
}finally{engine.stop();}
