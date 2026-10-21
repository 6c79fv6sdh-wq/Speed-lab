import { describe, expect, it } from 'vitest';
import { MATE_TWO_PUZZLES } from '../src/data/puzzles-mate-two';
import { solveMateTwo } from '../src/core/mate-two';
import { posFromFen, moveFromUci, allLegalMoves, uciOf } from '../src/core/chess';
import pack from '../data/mate-in-2-100.json';

describe('100 verified mate-in-two tasks', () => {
  it('has distinct positions, complete engine audit and both orientations', () => {
    expect(MATE_TWO_PUZZLES).toHaveLength(100);
    expect(new Set(MATE_TWO_PUZZLES.map(p=>p.fen)).size).toBe(100);
    expect(new Set(MATE_TWO_PUZZLES.map(p=>p.sideToMove)).size).toBe(2);
    for(const p of pack.puzzles) {
      expect(p.verification.depth).toBeGreaterThanOrEqual(16);
      expect(p.verification.analysis[0].mate).toBe(2);
      expect(p.verification.analysis[0].move).toBe(p.solution.firstUci);
    }
  });
  it.each(MATE_TWO_PUZZLES)('$id: unique key, no mate in one, complete defences and all mates', p => {
    const pos=posFromFen(p.fen);
    expect(pos.turn).toBe(p.boardOrientation);
    const proof=solveMateTwo(pos);
    expect(proof.mateInOne).toBe(false);
    expect(proof.solutions).toEqual([p.solution]);
    pos.play(moveFromUci(p.solution.firstUci));
    expect(new Set(p.solution.branches.map(b=>b.replyUci))).toEqual(new Set(allLegalMoves(pos).map(uciOf)));
    for(const branch of p.solution.branches) {
      const after=pos.clone(); after.play(moveFromUci(branch.replyUci));
      const mates=allLegalMoves(after).filter(m=>{const final=after.clone();final.play(m);return final.isCheckmate();}).map(uciOf);
      expect(new Set(branch.winningUcis)).toEqual(new Set(mates));
    }
  });
});
