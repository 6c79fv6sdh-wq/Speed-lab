/**
 * «Snapshot» — упражнение «Тактики» на зрительно-структурную память: не
 * абстрактные цветные плитки Human Benchmark, а реальная шахматная
 * структура. Модуль чистый (ни DOM, ни таймеров, ни Chessground) — та же
 * дисциплина, что и в knight-scan-logic.ts и motorics-route.ts: вся
 * генерация и подсчёт очков здесь и проверяются тестами, а DOM/таймеры —
 * в reaction.ts.
 *
 * Доска рисуется СВОИМ лёгким DOM-виджетом (как мини-доски «Скана конём»),
 * а не через board/board.ts: та доска — про ходы по правилам шахмат,
 * а тут — про свободную расстановку панельных фигур на произвольные
 * пустые клетки, что Chessground/chessops не считает «ходом» вовсе.
 */
import type { Color, Role } from '../core/chess';
import { fileOf, rankOf, squareDistance } from '../core/chess';
import type { Key } from 'chessground/types';
import {
  SNAPSHOT_MEANINGFUL_POSITIONS,
  type GamePhase,
  type MeaningfulPosition,
  type SnapshotDifficulty,
} from '../data/snapshot-positions';

export type { SnapshotDifficulty, GamePhase, MeaningfulPosition };

export interface PlacedPiece {
  square: Key;
  color: Color;
  role: Role;
}

export type SnapshotKind = 'meaningful' | 'control';

export type SnapshotLevel = 1 | 2 | 3 | 4 | 5;
export const SNAPSHOT_LEVELS: readonly SnapshotLevel[] = [1, 2, 3, 4, 5];
export const SNAPSHOT_EXPOSURE_MS = 3000;

/** Source categories describe the existing pool, never the selected level. */
export const SNAPSHOT_PAIR_COUNTS: Record<SnapshotDifficulty, number> = { easy: 4, medium: 3, hard: 1 };

export const SNAPSHOT_WARMUP = 2;
export const SNAPSHOT_SCORED_PAIRS = 8; // 4 + 3 + 1
export const SNAPSHOT_SCORED = SNAPSHOT_SCORED_PAIRS * 2; // meaningful + control

export interface SnapshotTask {
  id: string;
  pairId: string;
  kind: SnapshotKind;
  difficulty: SnapshotDifficulty;
  level: SnapshotLevel;
  /** Сторона, которой снизу расположена доска — сторона хода в позиции. */
  orientation: Color;
  /** Полная расстановка ДО исчезновения фигур. */
  pieces: PlacedPiece[];
  /** Подмножество pieces, которое исчезает и уходит в перемешанную панель. */
  removed: PlacedPiece[];
  exposureMs: number;
  warmup: boolean;
  /** Только meaningful — для отчёта и хранения источника партии. */
  meaningful?: MeaningfulPosition;
}

// --- Разбор FEN → список фигур на доске.

const FEN_ROLE: Record<string, Role> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

export function piecesFromFen(fen: string): PlacedPiece[] {
  const board = fen.split(' ')[0];
  const ranks = board.split('/');
  const pieces: PlacedPiece[] = [];
  ranks.forEach((rankStr, i) => {
    const rank = 8 - i; // FEN идёт с 8-й горизонтали
    let file = 1;
    for (const ch of rankStr) {
      if (/\d/.test(ch)) {
        file += Number(ch);
        continue;
      }
      const role = FEN_ROLE[ch.toLowerCase()];
      const color: Color = ch === ch.toUpperCase() ? 'white' : 'black';
      const square = `${String.fromCharCode(96 + file)}${rank}` as Key;
      pieces.push({ square, color, role });
      file++;
    }
  });
  return pieces;
}

const FEN_CHAR: Record<Role, string> = { pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k' };

/** Обратное к piecesFromFen — для хранения original/reconstructed FEN замера. */
export function piecesToFen(pieces: PlacedPiece[]): string {
  const grid: (string | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (const p of pieces) {
    const f = fileOf(p.square);
    const r = rankOf(p.square);
    const ch = FEN_CHAR[p.role];
    grid[r][f] = p.color === 'white' ? ch.toUpperCase() : ch;
  }
  const ranks: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let rankStr = '';
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const ch = grid[r][f];
      if (!ch) {
        empty++;
        continue;
      }
      if (empty) {
        rankStr += String(empty);
        empty = 0;
      }
      rankStr += ch;
    }
    if (empty) rankStr += String(empty);
    ranks.push(rankStr);
  }
  return ranks.join('/');
}

export const ALL_SQUARES: Key[] = (() => {
  const out: Key[] = [];
  for (let r = 1; r <= 8; r++) for (let f = 1; f <= 8; f++) out.push(`${String.fromCharCode(96 + f)}${r}` as Key);
  return out;
})();

function fileIdx(sq: Key): number {
  return fileOf(sq); // 0..7
}
function rankIdx(sq: Key): number {
  return rankOf(sq); // 0..7
}

/** Четверть доски 0..3: 0=a-d/1-4, 1=e-h/1-4, 2=a-d/5-8, 3=e-h/5-8. */
export function quadrantOf(sq: Key): number {
  const f = fileIdx(sq) < 4 ? 0 : 1;
  const r = rankIdx(sq) < 4 ? 0 : 1;
  return r * 2 + f;
}

function kingsAdjacent(a: Key, b: Key): boolean {
  return squareDistance(a, b) <= 1;
}

// --- Генерация shuffled control из meaningful: тот же мультимножество фигур,
// новая случайная расстановка с ограничениями из ТЗ.

export interface ControlResult {
  pieces: PlacedPiece[];
}

export function generateShuffledControl(meaningful: PlacedPiece[], rnd: () => number): ControlResult {
  const originalSig = boardSignature(meaningful);
  for (let attempt = 0; attempt < 300; attempt++) {
    const placed = tryPlaceControl(meaningful, rnd);
    if (!placed) continue;
    if (boardSignature(placed) === originalSig) continue; // не должна случайно совпасть с реальной
    return { pieces: placed };
  }
  // Практически недостижимо для реальных наборов фигур (≤24), но лучше
  // вернуть последнюю честную попытку, чем зависнуть в бесконечном retry.
  return { pieces: tryPlaceControl(meaningful, rnd) ?? meaningful };
}

function boardSignature(pieces: PlacedPiece[]): string {
  return [...pieces]
    .sort((a, b) => a.square.localeCompare(b.square))
    .map((p) => `${p.square}${p.color[0]}${p.role[0]}`)
    .join(',');
}

function tryPlaceControl(meaningful: PlacedPiece[], rnd: () => number): PlacedPiece[] | null {
  const kings = meaningful.filter((p) => p.role === 'king');
  const others = shuffle(
    meaningful.filter((p) => p.role !== 'king'),
    rnd,
  );

  const used = new Set<Key>();
  const placed: PlacedPiece[] = [];

  // Короли — в двух случайных РАЗНЫХ четвертях, не рядом.
  const quadOrder = shuffle([0, 1, 2, 3], rnd);
  const kingSquares: Key[] = [];
  for (let i = 0; i < kings.length; i++) {
    const quad = quadOrder[i % 4];
    const sq = pickSquareInQuadrant(quad, used, rnd, false);
    if (!sq) return null;
    used.add(sq);
    kingSquares.push(sq);
    placed.push({ ...kings[i], square: sq });
  }
  if (kingSquares.length === 2 && kingsAdjacent(kingSquares[0], kingSquares[1])) return null;

  // Остальные фигуры — round-robin по четвертям для плотности «примерно
  // поровну», пешки не на 1/8 горизонталь.
  let quadCursor = 0;
  for (const piece of others) {
    let sq: Key | null = null;
    for (let tries = 0; tries < 4 && !sq; tries++) {
      const quad = quadOrder[(quadCursor + tries) % 4];
      sq = pickSquareInQuadrant(quad, used, rnd, piece.role === 'pawn');
    }
    if (!sq) return null;
    used.add(sq);
    placed.push({ ...piece, square: sq });
    quadCursor++;
  }
  return placed;
}

function pickSquareInQuadrant(quad: number, used: Set<Key>, rnd: () => number, isPawn: boolean): Key | null {
  const candidates = ALL_SQUARES.filter((sq) => {
    if (used.has(sq)) return false;
    if (quadrantOf(sq) !== quad) return false;
    if (isPawn && (rankIdx(sq) === 0 || rankIdx(sq) === 7)) return false;
    return true;
  });
  if (!candidates.length) return null;
  return candidates[Math.floor(rnd() * candidates.length)];
}

// --- Выбор исчезающих фигур.

export function chooseRemoved(pieces: PlacedPiece[], count: number, rnd: () => number): PlacedPiece[] | null {
  if (!Number.isInteger(count) || count < 1 || count > 5) return null;
  const candidates = [...new Map(pieces.map(piece => [piece.square, piece])).values()];
  if (candidates.length < count) return null;
  return shuffle(candidates, rnd).slice(0, count);
}

/** Тот же набор цветов/типов исчезающих фигур для control-пары, что и у meaningful. */
export function chooseMatchingRemoved(
  controlPieces: PlacedPiece[],
  profile: PlacedPiece[],
  rnd: () => number,
): PlacedPiece[] | null {
  const pool = [...controlPieces];
  const picked: PlacedPiece[] = [];
  for (const want of profile) {
    const idx = pool.findIndex((p) => p.color === want.color && p.role === want.role && !picked.includes(p));
    if (idx === -1) return null;
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  void rnd;
  return picked;
}

function shuffle<T>(items: T[], rnd: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Сборка сессии.

export interface SnapshotSession {
  seed: number;
  level: SnapshotLevel;
  tasks: SnapshotTask[]; // warmup (не в счёт) + зачётные, в порядке показа
}

function buildPair(
  meaningfulPos: MeaningfulPosition,
  rnd: () => number,
  level: SnapshotLevel,
): { meaningfulTask: SnapshotTask; controlTask: SnapshotTask } | null {
  const meaningfulPieces = piecesFromFen(meaningfulPos.fen);
  const removedMeaningful = chooseRemoved(meaningfulPieces, level, rnd);
  if (!removedMeaningful) return null;

  const control = generateShuffledControl(meaningfulPieces, rnd);
  const removedControl = chooseMatchingRemoved(control.pieces, removedMeaningful, rnd);
  if (!removedControl) return null;

  const pairId = meaningfulPos.id;
  return {
    meaningfulTask: {
      id: `${pairId}-meaningful`,
      pairId,
      kind: 'meaningful',
      difficulty: meaningfulPos.difficulty,
      level,
      orientation: meaningfulPos.sideToMove,
      pieces: meaningfulPieces,
      removed: removedMeaningful,
      exposureMs: SNAPSHOT_EXPOSURE_MS,
      warmup: false,
      meaningful: meaningfulPos,
    },
    controlTask: {
      id: `${pairId}-control`,
      pairId,
      kind: 'control',
      difficulty: meaningfulPos.difficulty,
      level,
      orientation: meaningfulPos.sideToMove,
      pieces: control.pieces,
      removed: removedControl,
      exposureMs: SNAPSHOT_EXPOSURE_MS,
      warmup: false,
    },
  };
}

/**
 * Порядок показа: 8 пар (16 заданий) вперемешку, но так, чтобы между
 * meaningful и её control-парой было минимум три ДРУГИЕ попытки — иначе
 * пользователь легко узнает пару по свежей памяти о предыдущем задании,
 * и сравнение потеряет смысл.
 */
function interleave(tasks: SnapshotTask[], rnd: () => number): SnapshotTask[] {
  const byPair = new Map<string, SnapshotTask[]>();
  for (const t of tasks) {
    const arr = byPair.get(t.pairId) ?? [];
    arr.push(t);
    byPair.set(t.pairId, arr);
  }
  for (let attempt = 0; attempt < 2000; attempt++) {
    const order = shuffle(tasks, rnd);
    const posOf = new Map<SnapshotTask, number>();
    order.forEach((t, i) => posOf.set(t, i));
    let ok = true;
    for (const [, pair] of byPair) {
      if (pair.length < 2) continue;
      const gap = Math.abs(posOf.get(pair[0])! - posOf.get(pair[1])!);
      if (gap < 4) {
        ok = false;
        break;
      }
    }
    if (ok) return order;
  }
  // Не сошлось за разумное число попыток (не должно происходить при 8
  // парах на 16 слотов) — возвращаем последний вариант, не подвешивая сессию.
  return shuffle(tasks, rnd);
}

export function generateSnapshotSession(
  rnd: () => number, seed: number, level: SnapshotLevel = 1,
  positions: readonly MeaningfulPosition[] = SNAPSHOT_MEANINGFUL_POSITIONS,
): SnapshotSession | null {
  if (!SNAPSHOT_LEVELS.includes(level)) return null;
  // The same source selection rules at every level; unsuitable positions are skipped.
  const eligible = positions.filter(position => piecesFromFen(position.fen).length >= level);
  const sources: MeaningfulPosition[] = [];
  for (const difficulty of ['easy', 'medium', 'hard'] as SnapshotDifficulty[]) {
    const pool = eligible.filter(position => position.difficulty === difficulty);
    const count = SNAPSHOT_PAIR_COUNTS[difficulty];
    if (pool.length < count) return null;
    sources.push(...(pool.length === count ? pool : shuffle(pool, rnd)).slice(0, count));
  }
  const scoredTasks: SnapshotTask[] = [];
  for (const position of sources) {
    const pair = buildPair(position, rnd, level);
    if (!pair) return null;
    scoredTasks.push(pair.meaningfulTask, pair.controlTask);
  }
  const ordered = interleave(scoredTasks, rnd);
  const warmupTasks: SnapshotTask[] = [];
  const signature = (task: SnapshotTask) => `${piecesToFen(task.pieces)}|${task.removed.map(p => p.square).sort().join(',')}`;
  const used = new Set(scoredTasks.map(signature));
  for (const position of shuffle(sources, rnd).slice(0, SNAPSHOT_WARMUP)) {
    let task: SnapshotTask | null = null;
    for (let retry = 0; retry < 100; retry++) {
      const pair = buildPair(position, rnd, level);
      if (pair && !used.has(signature(pair.meaningfulTask))) { task = pair.meaningfulTask; break; }
    }
    if (!task) return null;
    used.add(signature(task));
    warmupTasks.push({ ...task, id: `warmup-${position.id}`, warmup: true });
  }
  return { seed, level, tasks: [...warmupTasks, ...ordered] };
}

// --- Подсчёт очков попытки.

export interface Placement {
  square: Key;
  color: Color;
  role: Role;
}

export type PieceOutcome =
  | 'correct'
  | 'wrong-piece-right-square'
  | 'right-piece-wrong-square'
  | 'missed'
  | 'extra';

export interface PieceResult {
  outcome: PieceOutcome;
  /** Клетка, где фигура должна была стоять (missed/extra — по смыслу другой стороны). */
  correctSquare: Key | null;
  /** Клетка, куда её реально поставили (missed — null, никуда не поставили). */
  chosenSquare: Key | null;
  color: Color;
  role: Role;
  /** Чебышёвское расстояние между correctSquare и chosenSquare, если оба есть. */
  distance: number | null;
}

/**
 * Одинаковые фигуры одного цвета — взаимозаменяемы (не по внутреннему ID),
 * поэтому сопоставление removed↔placements идёт в три прохода: точное
 * совпадение клетки+фигуры → та же клетка, но другая фигура → та же
 * фигура, но другая клетка. Остаток — пропуски/лишние размещения.
 */
export function scoreAttempt(removed: PlacedPiece[], placements: Placement[]): PieceResult[] {
  const remainingRemoved = [...removed];
  const remainingPlaced = [...placements];
  const results: PieceResult[] = [];

  // Проход 1: точное совпадение.
  for (let i = remainingRemoved.length - 1; i >= 0; i--) {
    const r = remainingRemoved[i];
    const j = remainingPlaced.findIndex((p) => p.square === r.square && p.color === r.color && p.role === r.role);
    if (j !== -1) {
      results.push({ outcome: 'correct', correctSquare: r.square, chosenSquare: r.square, color: r.color, role: r.role, distance: 0 });
      remainingRemoved.splice(i, 1);
      remainingPlaced.splice(j, 1);
    }
  }

  // Проход 2: та же фигура (цвет+тип), другая клетка — ближайшая по
  // расстоянию среди оставшихся кандидатов того же типа.
  for (let i = remainingRemoved.length - 1; i >= 0; i--) {
    const r = remainingRemoved[i];
    let bestJ = -1;
    let bestDist = Infinity;
    remainingPlaced.forEach((p, j) => {
      if (p.color !== r.color || p.role !== r.role) return;
      const d = squareDistance(r.square, p.square);
      if (d < bestDist) {
        bestDist = d;
        bestJ = j;
      }
    });
    if (bestJ !== -1) {
      const p = remainingPlaced[bestJ];
      results.push({ outcome: 'right-piece-wrong-square', correctSquare: r.square, chosenSquare: p.square, color: r.color, role: r.role, distance: bestDist });
      remainingRemoved.splice(i, 1);
      remainingPlaced.splice(bestJ, 1);
    }
  }

  // Проход 3: та же клетка (правильное поле), но другая фигура.
  for (let i = remainingRemoved.length - 1; i >= 0; i--) {
    const r = remainingRemoved[i];
    const j = remainingPlaced.findIndex((p) => p.square === r.square);
    if (j !== -1) {
      const p = remainingPlaced[j];
      results.push({ outcome: 'wrong-piece-right-square', correctSquare: r.square, chosenSquare: p.square, color: p.color, role: p.role, distance: 0 });
      remainingRemoved.splice(i, 1);
      remainingPlaced.splice(j, 1);
    }
  }

  // Остаток: пропуски (клетка так и не получила фигуру) и лишние
  // размещения (фигура встала туда, что вообще не соответствует ни одной
  // недостающей клетке).
  for (const r of remainingRemoved) {
    results.push({ outcome: 'missed', correctSquare: r.square, chosenSquare: null, color: r.color, role: r.role, distance: null });
  }
  for (const p of remainingPlaced) {
    results.push({ outcome: 'extra', correctSquare: null, chosenSquare: p.square, color: p.color, role: p.role, distance: null });
  }

  return results;
}

export interface AttemptSummary {
  fullyCorrect: number;
  total: number;
  accuracy: number;
  typeErrors: number; // wrong-piece-right-square
  spatialErrors: number; // right-piece-wrong-square
  missed: number;
  extra: number;
  meanErrorDistance: number | null;
}

export function summarizeAttempt(results: PieceResult[]): AttemptSummary {
  const total = results.filter((r) => r.outcome !== 'extra').length; // знаменатель — сколько реально нужно было угадать
  const fullyCorrect = results.filter((r) => r.outcome === 'correct').length;
  const typeErrors = results.filter((r) => r.outcome === 'wrong-piece-right-square').length;
  const spatialErrors = results.filter((r) => r.outcome === 'right-piece-wrong-square').length;
  const missed = results.filter((r) => r.outcome === 'missed').length;
  const extra = results.filter((r) => r.outcome === 'extra').length;
  const distances = results.map((r) => r.distance).filter((d): d is number => d !== null && d > 0);
  return {
    fullyCorrect,
    total,
    accuracy: total ? fullyCorrect / total : 0,
    typeErrors,
    spatialErrors,
    missed,
    extra,
    meanErrorDistance: distances.length ? distances.reduce((a, b) => a + b, 0) / distances.length : null,
  };
}

/** Only explicit level metadata counts; legacy difficulty/exposure never implies a new level. */
export function snapshotRecordLevel(mode: string, data: Record<string, unknown>): SnapshotLevel | null {
  const match = /^snapshot:level-([1-5])$/.exec(mode);
  const stored = data.level;
  const explicit = typeof stored === 'number' && SNAPSHOT_LEVELS.includes(stored as SnapshotLevel) ? stored as SnapshotLevel : null;
  const fromMode = match ? Number(match[1]) as SnapshotLevel : null;
  if (explicit !== null && fromMode !== null && explicit !== fromMode) return null;
  return explicit ?? fromMode;
}
