// Импорт второй партии задач «мат в один ход» — на этот раз не с Lichess,
// а синтетический набор SCM1 (см. PuzzleId в PGN), присланный уже с
// пометкой «verified unique mate-in-1». Пометке источника не доверяем —
// это тот же принцип, что и у import-safe-checks.mjs / build-premove-pool.mjs
// в этом репозитории: чужая проверка не считается, пока не повторена своим
// движком правил на каждой позиции.
//
// Дополнительно к тому, что уже проверял import-mate-puzzles.mjs (валиден
// ли FEN, легален ли ход, мат ли после него), здесь ещё:
//  - ход белых (иначе задача не «мат в один ход белыми», а что-то другое);
//  - РЕШЕНИЕ ЕДИНСТВЕННО — перебираются вообще все легальные ходы позиции,
//    и матующим должен оказаться ровно один. Файл заявляет uniqueSolution
//    в темах, но упражнение принимает только ОДИН приведённый uci как
//    верный (taskFromSolution в reaction-logic.ts) — если бы матовало ещё
//    что-то, второй правильный по факту ответ засчитывался бы ошибкой;
//  - дедуп: ни внутри этих 500 друг с другом, ни с уже существующими
//    задачами в src/data/puzzles-mate.ts (по позиции — доска, чей ход,
//    рокировки, взятие на проходе; часы хода в сигнатуру не входят).
//
// Запуск:
//   node tools/import-mate-puzzles-scm.mjs <файл.pgn>
// Печатает в stdout только новые записи (TS-литералы) для вставки в
// MATE_PUZZLES — существующий массив не трогает и не перегенерирует.
import { readFileSync } from 'node:fs';
import { Chess } from 'chessops/chess';
import { parseFen, makeFen } from 'chessops/fen';
import { parseSan, makeSan } from 'chessops/san';
import { makeUci } from 'chessops/util';

const file = process.argv[2];
if (!file) {
  console.error('Укажи путь к PGN');
  process.exit(1);
}

const text = readFileSync(file, 'utf8');
const existingSrc = readFileSync(new URL('../src/data/puzzles-mate.ts', import.meta.url), 'utf8');

function parsePgn(src) {
  const games = [];
  let cur = null;
  for (const rawLine of src.split(/\r?\n/)) {
    const line = rawLine.trim();
    const tag = /^\[(\w+)\s+"(.*)"\]$/.exec(line);
    if (tag) {
      if (!cur) cur = { tags: {}, moveText: '' };
      cur.tags[tag[1]] = tag[2];
      continue;
    }
    if (!line) continue;
    if (cur) {
      cur.moveText += ` ${line}`;
      if (line.includes('*') || /1-0|0-1|1\/2/.test(line)) {
        games.push(cur);
        cur = null;
      }
    }
  }
  if (cur) games.push(cur);
  return games;
}

function firstSan(moveText) {
  const cleaned = moveText.replace(/\{[^}]*\}/g, ' ').replace(/\d+\.(\.\.)?/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  for (const t of tokens) {
    if (t === '*' || /^(1-0|0-1|1\/2-1\/2)$/.test(t)) continue;
    return t;
  }
  return null;
}

const posFromFen = (fen) => Chess.fromSetup(parseFen(fen).unwrap()).unwrap();

/** Сигнатура позиции для дедупа — без часов хода, только то, что влияет на легальные ходы. */
function positionSignature(fen) {
  const parts = fen.split(' ');
  return parts.slice(0, 4).join(' '); // board, turn, castling, en passant
}

/** Существующие FEN из src/data/puzzles-mate.ts — грубым regex, файл это просто литералы. */
function existingSignatures(src) {
  const sigs = new Set();
  const re = /fen:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) sigs.add(positionSignature(m[1]));
  return sigs;
}

const existingSigs = existingSignatures(existingSrc);
const games = parsePgn(text);
const out = [];
const rejected = [];
const seenInBatch = new Set();

for (const g of games) {
  const id = g.tags.PuzzleId || g.tags.Event || '?';
  const fen = g.tags.FEN;
  const san = firstSan(g.moveText);
  const fail = (why) => rejected.push({ id, why });

  if (!fen) { fail('нет FEN'); continue; }
  let pos;
  try { pos = posFromFen(fen); } catch (e) { fail(`невалидный FEN: ${e.message}`); continue; }

  if (pos.turn !== 'white') { fail('ход не белых'); continue; }
  if (!san) { fail('не нашёл ход решения'); continue; }

  const move = parseSan(pos, san);
  if (!move) { fail(`ход ${san} нелегален`); continue; }

  const after = pos.clone();
  after.play(move);
  if (!after.isCheckmate()) { fail(`после ${san} нет мата`); continue; }

  // Перебор всех легальных ходов позиции — решение обязано быть ровно одно.
  // Тот же приём перечисления (allDests + перебор промоций пешки), что и в
  // allLegalMoves (src/core/chess.ts) и в остальных импортёрах этого репо.
  const mates = [];
  for (const [from, tos] of pos.allDests()) {
    for (const to of tos) {
      const piece = pos.board.get(from);
      const cands =
        piece?.role === 'pawn' && (to >> 3 === 7 || to >> 3 === 0)
          ? ['queen', 'knight', 'rook', 'bishop'].map((promotion) => ({ from, to, promotion }))
          : [{ from, to }];
      for (const cand of cands) {
        const trial = pos.clone();
        trial.play(cand);
        if (trial.isCheckmate()) mates.push(makeUci(cand));
      }
    }
  }
  const uniqueMates = [...new Set(mates)];
  if (uniqueMates.length !== 1) {
    fail(`решение не единственно — матует ${uniqueMates.length} ход(ов): ${uniqueMates.join(', ')}`);
    continue;
  }
  if (uniqueMates[0] !== makeUci(move)) {
    fail(`единственный мат — ${uniqueMates[0]}, но заявлен ${makeUci(move)}`);
    continue;
  }

  const sig = positionSignature(fen);
  if (existingSigs.has(sig)) { fail('дубликат уже существующей задачи'); continue; }
  if (seenInBatch.has(sig)) { fail('дубликат внутри этой же партии PGN'); continue; }
  seenInBatch.add(sig);

  out.push({
    id,
    fen: makeFen(pos.toSetup()),
    uci: makeUci(move),
    san: makeSan(pos, move),
    themes: (g.tags.Themes || '').split(/\s+/).filter(Boolean),
  });
}

console.error(`Разобрано партий:     ${games.length}`);
console.error(`Прошли проверку:      ${out.length}`);
console.error(`Отклонено:            ${rejected.length}`);
const reasonCounts = new Map();
for (const r of rejected) {
  const key = r.why.replace(/[0-9a-h][1-8][0-9a-h][0-8]?.*/, '').trim();
  reasonCounts.set(key, (reasonCounts.get(key) || 0) + 1);
}
for (const [why, n] of reasonCounts) console.error(`  ${why}: ${n}`);
console.error('Примеры отклонений:');
for (const r of rejected.slice(0, 20)) console.error(`  ${r.id}: ${r.why}`);

const body = out
  .map(
    (p) => `  {
    id: '${p.id}',
    fen: '${p.fen}',
    uci: '${p.uci}',
    san: '${p.san}',
    themes: [${p.themes.map((t) => `'${t}'`).join(', ')}],
  },`,
  )
  .join('\n');

process.stdout.write(body + '\n');
