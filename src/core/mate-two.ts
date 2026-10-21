import type { Chess } from 'chessops/chess';
import type { NormalMove } from 'chessops/types';
import { makeUci } from 'chessops/util';
import { makeSan } from 'chessops/san';

export interface MateTwoBranch {
  replyUci: string;
  replySan: string;
  winningUcis: string[];
  winningSans: string[];
}
export interface MateTwoSolution {
  firstUci: string;
  firstSan: string;
  branches: MateTwoBranch[];
}
export function legalMoves(pos: Chess): NormalMove[] {
  const moves: NormalMove[] = [];
  for (const [from, tos] of pos.allDests()) for (const to of tos) {
    if (pos.board.get(from)?.role === 'pawn' && [0, 7].includes(to >> 3)) {
      for (const promotion of ['queen', 'rook', 'bishop', 'knight'] as const) {
        const move = { from, to, promotion };
        if (pos.isLegal(move)) moves.push(move);
      }
    } else moves.push({ from, to });
  }
  return moves;
}
export function matingMoves(pos: Chess): NormalMove[] {
  return legalMoves(pos).filter(move => {
    const after = pos.clone(); after.play(move);
    return after.isCheckmate();
  });
}
/** Exhaustive #2 proof: reject any mate in one; cover EVERY legal defence.
 * Includes all mating finishes, including underpromotions. No engine-score cutoff. */
export function solveMateTwo(pos: Chess): { mateInOne: boolean; solutions: MateTwoSolution[] } {
  const moves = legalMoves(pos);
  if (moves.some(move => { const after = pos.clone(); after.play(move); return after.isCheckmate(); })) {
    return { mateInOne: true, solutions: [] };
  }
  const solutions: MateTwoSolution[] = [];
  for (const first of moves) {
    const after = pos.clone(); after.play(first);
    const replies = legalMoves(after);
    if (!replies.length) continue; // Stalemate is not mate in two.
    const branches: MateTwoBranch[] = [];
    for (const reply of replies) {
      const final = after.clone(); final.play(reply);
      const mates = matingMoves(final);
      if (!mates.length) break;
      branches.push({ replyUci: makeUci(reply), replySan: makeSan(after, reply),
        winningUcis: mates.map(makeUci), winningSans: mates.map(move => makeSan(final, move)) });
    }
    if (branches.length === replies.length) solutions.push({ firstUci: makeUci(first), firstSan: makeSan(pos, first), branches });
  }
  return { mateInOne: false, solutions };
}
