import { describe, it, expect } from 'vitest';
import { MATE_PUZZLES } from '../src/data/puzzles-mate';
import pack from '../data/mate-in-1-500.json';
import { allLegalMoves, isLegalUci, moveFromKeys, moveFromUci, posFromFen, uciOf } from '../src/core/chess';
import { matePuzzleCount, matePuzzleQueue, taskFromMatePuzzle } from '../src/modules/reaction-logic';
import type { Key } from 'chessground/types';

function rng(seed: number) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

describe('replacement mate-in-one pack', () => {
  it('contains exactly the supplied 500 tasks, no old tasks or duplicate positions', () => {
    expect(matePuzzleCount()).toBe(500);
    expect(new Set(MATE_PUZZLES.map(p => p.id)).size).toBe(500);
    expect(new Set(MATE_PUZZLES.map(p => p.fen.split(' ').slice(0, 4).join(' '))).size).toBe(500);
    expect(MATE_PUZZLES.map(p => [p.fen, p.uci, p.san])).toEqual(
      pack.puzzles.map(p => [p.fen, p.solutionUci, p.solutionSan]),
    );
  });

  it('every solution is legal and the unique mating move', () => {
    for (const p of MATE_PUZZLES) {
      const pos = posFromFen(p.fen);
      expect(isLegalUci(pos, p.uci), p.id).toBe(true);
      const mates = allLegalMoves(pos).filter(move => {
        const after = pos.clone();
        after.play(move);
        return after.isCheckmate();
      }).map(uciOf);
      expect(mates, p.id).toEqual([p.uci]);
    }
  });

  it('sets side and orientation from each FEN, with 250 tasks per side', () => {
    let white = 0;
    for (const [index, p] of MATE_PUZZLES.entries()) {
      const task = taskFromMatePuzzle(p);
      expect(task.userColor).toBe(task.pos.turn);
      expect(task.userColor).toBe(pack.puzzles[index].boardOrientation);
      expect(task.solutions[0].uci).toBe(p.uci);
      if (task.userColor === 'white') white++;
    }
    expect(white).toBe(250);
  });

  it('handles all five promotion mates with the existing auto-queen board move', () => {
    const promotions = MATE_PUZZLES.filter(p => p.uci.length === 5);
    expect(promotions).toHaveLength(5);
    for (const p of promotions) {
      const task = taskFromMatePuzzle(p);
      const move = moveFromKeys(task.pos, p.uci.slice(0, 2) as Key, p.uci.slice(2, 4) as Key)!;
      expect(uciOf(move)).toBe(task.solutions[0].uci);
      task.pos.play(moveFromUci(uciOf(move)));
      expect(task.pos.isCheckmate()).toBe(true);
    }
  });

  it('shuffles the entire pool without repeats or modifying the source order', () => {
    const original = MATE_PUZZLES.map(p => p.id);
    const first = matePuzzleQueue(rng(42), 500).map(p => p.id);
    const second = matePuzzleQueue(rng(777), 500).map(p => p.id);
    expect(new Set(first).size).toBe(500);
    expect([...first].sort()).toEqual([...original].sort());
    expect(first).not.toEqual(original);
    expect(first).not.toEqual(second);
    expect(MATE_PUZZLES.map(p => p.id)).toEqual(original);
    expect(new Set(matePuzzleQueue(rng(11), 10).map(p => p.id)).size).toBe(10);
  });
});
