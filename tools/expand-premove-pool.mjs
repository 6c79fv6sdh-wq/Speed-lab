// Expand the active recapture pool from the existing Lichess dataset.
// Reuses the same numeric/structural validator; never copies an unverified task.
// PREMOVE_ANALYSIS_CACHE=/tmp/premove-expansion-cache.json node tools/expand-premove-pool.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import { Chess } from 'chessops/chess';
import { parseFen } from 'chessops/fen';
import { parseUci } from 'chessops/util';
process.env.PREMOVE_DEPTH ??= '16';
process.env.PREMOVE_ANALYSIS_CACHE ??= join(tmpdir(),'sciencechess-premove-analysis-cache.json');
const auditFile = new URL('../data/premove-expansion-audit.json',import.meta.url);
if (!existsSync(process.env.PREMOVE_ANALYSIS_CACHE) && existsSync(auditFile)) {
 writeFileSync(process.env.PREMOVE_ANALYSIS_CACHE,JSON.stringify(JSON.parse(readFileSync(auditFile)).analyses));
}
const { validateForcedCapture, renderPoolFile, analysisSnapshot, stopEngine } = await import('./build-premove-pool.mjs');
const current = await import('../src/data/premove-pool.ts');
const source = JSON.parse(readFileSync(new URL('../data/lichess-safe-premove-200-white.json', import.meta.url)));
const forced = current.PREMOVE_FORCED_CAPTURE_POOL.filter(task=>!task.id.startsWith('fc-lichess-')&&!task.id.startsWith('fc-game-'));
const candidateFile = new URL('./premove-candidates.json', import.meta.url);
const candidates = JSON.parse(readFileSync(candidateFile));
const accepted = [], rejected = [];
const signature = fen => fen.split(' ').slice(0, 4).join(' ');
const seen = new Set(forced.map(task => signature(task.fen)));
try {
 for (const task of [...source.tasks,...JSON.parse(readFileSync(new URL('./premove-game-candidates.json',import.meta.url)))]) {
  if (forced.length >= 50) break;
  const c = {
   id: task.poolId ?? `fc-lichess-${task.id.toLowerCase()}`,
   fen: task.startFen, userColor: task.userColor ?? 'white', expectedUci: task.expectedOpponentMove, answerUci: task.premove,
   // The dataset supplies one player's name, game id and ply, not the other
   // player's name/date. Preserve that uncertainty rather than inventing them.
   source: task.source ?? { white: task.sourceSolverColor === 'w' ? task.sourcePlayer : 'Unknown',
    black: task.sourceSolverColor === 'b' ? task.sourcePlayer : 'Unknown',
    event: `Lichess ${task.sourceGameId}`, date: '????.??.??', ply: task.sourcePly, url: task.sourceUrl },
  };
  const fail = why => { rejected.push({ id:c.id, why }); console.log(`Reject ${c.id}: ${why}`); };
  if (seen.has(signature(c.fen))) { fail('duplicate position'); continue; }
  const pos = Chess.fromSetup(parseFen(c.fen).unwrap()).unwrap();
  const expected = parseUci(c.expectedUci), answer = parseUci(c.answerUci);
  if (!expected || !answer || !pos.isLegal(expected)) { fail('invalid expected move'); continue; }
  // Independently verify the source's auto-cancel promise for every other
  // legal opponent move; otherwise a "safe" recapture drill is misleading.
  let alternativesSafe = true;
  for (const [from,tos] of pos.allDests()) for (const to of tos) {
   const promotions = pos.board.get(from)?.role === 'pawn' && [0,7].includes(to>>3) ? ['queen','rook','bishop','knight'] : [undefined];
   for (const promotion of promotions) {
    const move = promotion ? {from,to,promotion} : {from,to};
    if (from === expected.from && to === expected.to && promotion === expected.promotion) continue;
    const after = pos.clone(); after.play(move);
    if (after.isLegal(answer)) alternativesSafe = false;
   }
  }
  if (!alternativesSafe) { fail('premove remains legal after an alternative reply'); continue; }
  console.log(`Checking ${c.id} at depth ${process.env.PREMOVE_DEPTH} (${forced.length}/50 accepted)`);
  const result = await validateForcedCapture(c);
  if (!result.task) { fail(result.rejected); continue; }
  forced.push(result.task);accepted.push(c.id);seen.add(signature(c.fen));
  if (!candidates.candidates.some(existing => existing.id === c.id)) candidates.candidates.push(c);
  console.log(`Accept ${c.id}: ${result.task.expectedSan} → ${result.task.answerSan}, total ${forced.length}`);
 }
 if (forced.length < 50) throw Error(`Only ${forced.length} valid recapture tasks; active pool has not been changed`);
 const report = { sources:['data/lichess-safe-premove-200-white.json','data/premove-source-games.pgn'], depth:Number(process.env.PREMOVE_DEPTH), accepted, rejected,
  counts:{forcedCapture:forced.length,safeUnsafe:current.PREMOVE_SAFE_UNSAFE_POOL.length,cancel:current.PREMOVE_CANCEL_POOL.length},
  analyses:analysisSnapshot(),
 };
 writeFileSync(new URL('../data/premove-expansion-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 writeFileSync(candidateFile,JSON.stringify(candidates,null,2)+'\n');
 writeFileSync(new URL('../src/data/premove-pool.ts',import.meta.url),renderPoolFile({forced,safeUnsafe:current.PREMOVE_SAFE_UNSAFE_POOL,cancel:current.PREMOVE_CANCEL_POOL}));
 console.log(JSON.stringify(report.counts));
} finally { stopEngine(); }
