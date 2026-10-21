import { describe, expect, it } from 'vitest';
import { positionsOf } from '../src/data/premove-positions';
import { shuffle, TASKS_PER_SESSION } from '../src/modules/premove';
import { allLegalMoves, makeSan, moveFromUci, posFromFen, uciOf } from '../src/core/chess';
import source from '../data/lichess-safe-premove-200-white.json';
import audit from '../data/premove-expansion-audit.json';
import gameCandidates from '../tools/premove-game-candidates.json';
import gamePgn from '../data/premove-source-games.pgn?raw';
import {parsePgn,startingPosition} from 'chessops/pgn';
import {parseSan} from 'chessops/san';
import {makeFen} from 'chessops/fen';
import {validateForcedCapture, type EngineLine} from '../src/data/premove-validator';

describe('expanded verified premove recapture pool', () => {
 const pool = positionsOf('forced-capture');
 const imported = pool.filter(task => task.id.startsWith('fc-lichess-') || task.id.startsWith('fc-game-'));
 it('offers at least 50 distinct positions in the previously tiny mode', () => {
  expect(pool.length).toBeGreaterThanOrEqual(50);
  expect(new Set(pool.map(task => task.fen.split(' ').slice(0,4).join(' '))).size).toBe(pool.length);
  expect(imported.map(task => task.id).sort()).toEqual([...audit.accepted].sort());
  expect(audit.counts.forcedCapture).toBe(pool.length);
 });
 it('matches the supplied real-game positions and recomputes both SAN moves', () => {
  for(const task of imported) {
   const fromGame=gameCandidates.find(candidate=>candidate.poolId===task.id);
   if(fromGame){
    expect(task.fen).toBe(fromGame.startFen);expect(task.expectedUci).toBe(fromGame.expectedOpponentMove);expect(task.answerUci).toBe(fromGame.premove);expect(task.source).toEqual(fromGame.source);
    continue;
   }
   const original=source.tasks.find(p => `fc-lichess-${p.id.toLowerCase()}` === task.id)!;
   expect(original,task.id).toBeDefined();
   expect(task.fen).toBe(original.startFen);
   expect(task.expectedUci).toBe(original.expectedOpponentMove);
   expect(task.answerUci).toBe(original.premove);
   expect(task.source.url).toBe(original.sourceUrl);
   expect(task.source.ply).toBe(original.sourcePly);
   expect(task.evalMeta.depth).toBeGreaterThanOrEqual(16);
   const pos=posFromFen(task.fen), expected=moveFromUci(task.expectedUci);
   expect(pos.isCheck(),task.id).toBe(false);
   expect(pos.board.get(expected.to)?.color,task.id).toBe(task.userColor);
   expect(makeSan(pos,expected),task.id).toBe(task.expectedSan);
   pos.play(expected);
   const answer=moveFromUci(task.answerUci);
   expect(makeSan(pos,answer),task.id).toBe(task.answerSan);
   expect(answer.to,task.id).toBe(expected.to);
  }
 });
 it('replays the complete source games to the exact imported position and both recorded moves', () => {
  const positions=new Map<string,{fen:string;expected:string;answer:string}>();
  for(const game of parsePgn(gamePgn)) {
   const pos=startingPosition(game.headers).unwrap();const moves=[...game.moves.mainline()];
   for(const [i,node] of moves.entries()) {
    const id=`fc-game-${game.headers.get('SourceFile')!.replace('.pgn','')}-${game.headers.get('SourceGame')}-${i+1}`;
    positions.set(id,{fen:makeFen(pos.toSetup()),expected:node.san,answer:moves[i+1]?.san??''});
    const move=parseSan(pos,node.san);expect(move,id).toBeDefined();pos.play(move!);
   }
  }
  for(const task of imported.filter(task=>task.id.startsWith('fc-game-'))) {
   expect(positions.get(task.id),task.id).toEqual({fen:task.fen,expected:task.expectedSan,answer:task.answerSan});
  }
 });
 it('every other legal opponent move auto-cancels the proposed recapture', () => {
  for(const task of imported) {
   const pos=posFromFen(task.fen), answer=moveFromUci(task.answerUci);
   for(const move of allLegalMoves(pos)) {
    if(uciOf(move)===task.expectedUci)continue;
    const after=pos.clone();after.play(move);
    expect(after.isLegal(answer),`${task.id}: unsafe after ${uciOf(move)}`).toBe(false);
   }
  }
 });
 it('each imported position has saved independent Stockfish analysis', () => {
  const entries = audit.analyses as [string, unknown][];
  for(const task of imported) {
   const entry=entries.find(([key]) => {const [engine,depth,pv,fen]=JSON.parse(key);return engine===task.evalMeta.engine&&depth===task.evalMeta.depth&&pv===5&&fen===task.fen;});
   expect(entry,task.id).toBeDefined();
   expect((entry![1] as unknown[]).length,task.id).toBeGreaterThan(0);
  }
 });
 it('passes the independent application validator using the saved engine evidence', () => {
  const byFen = new Map<string, EngineLine[]>();
  for(const [key,lines] of audit.analyses as [string, EngineLine[]][]) {
   const [,depth,,fen] = JSON.parse(key);
   if(depth === audit.depth && (!byFen.has(fen) || byFen.get(fen)!.length < lines.length)) byFen.set(fen,lines);
  }
  for(const task of imported) {
   const result=validateForcedCapture(task,{linesAt:fen=>byFen.get(fen)});
   expect(result.ok, task.id + (result.ok ? '' : ': '+result.reasons.join('; '))).toBe(true);
  }
 });
 it('uses different random queues without repeating a task inside the series', () => {
  const random=(seed:number)=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const first=shuffle(pool,random(1)).slice(0,TASKS_PER_SESSION).map(task=>task.id);
  const second=shuffle(pool,random(2)).slice(0,TASKS_PER_SESSION).map(task=>task.id);
  expect(new Set(first).size).toBe(TASKS_PER_SESSION);
  expect(first).not.toEqual(second);
 });
});
