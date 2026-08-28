import { describe, it, expect } from 'vitest';
import {
  KNIGHT_SCAN_LEVEL_COUNTS,
  KNIGHT_SCAN_SCORED,
  KNIGHT_SCAN_WARMUP,
  boardSignature,
  generateKnightScanRound,
  generateKnightScanSession,
  knightShortestPath,
  type KnightScanLevel,
} from '../src/modules/knight-scan-logic';

const seeded = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
};

describe('knightShortestPath — BFS по клеткам коня', () => {
  it('на пустой доске конь с a1 до b3 идёт в один ход', () => {
    // a1 = 0, b3 = file 1 + rank 2*8 = 17
    expect(knightShortestPath(0, 17)).toEqual([0, 17]);
  });

  it('a1 до a1 — путь длины 0', () => {
    expect(knightShortestPath(0, 0)).toEqual([0]);
  });

  it('a1 до h8 без препятствий — 6 ходов (общеизвестная величина)', () => {
    const path = knightShortestPath(0, 63);
    expect(path).not.toBeNull();
    expect((path as number[]).length - 1).toBe(6);
  });

  it('препятствие делает цель недостижимой, если блокирует все соседние клетки', () => {
    // Конь в углу a1 (0) имеет только два хода: b3 (17) и c2 (10).
    const blocked = new Set([17, 10]);
    expect(knightShortestPath(0, 63, blocked)).toBeNull();
  });

  it('препятствие на клетке пути удлиняет путь, но не делает его короче', () => {
    const free = knightShortestPath(0, 17);
    expect(free).toEqual([0, 17]);
    // Блокируем саму цель — раз target никогда не в blocked по контракту
    // генератора, здесь просто проверяем, что путь честно ищет обход
    // (или сообщает null), а не занижает расстояние.
    const viaDetour = knightShortestPath(0, 17, new Set([10])); // c2 не мешает b3
    expect(viaDetour).toEqual([0, 17]);
  });
});

describe('generateKnightScanRound — один раунд', () => {
  const levels: KnightScanLevel[] = [2, 3, 4];

  for (const level of levels) {
    it(`level=${level}: ровно одна из четырёх досок имеет расстояние ${level}`, () => {
      const rnd = seeded(100 + level);
      for (let trial = 0; trial < 20; trial++) {
        const used = new Set<string>();
        const round = generateKnightScanRound(rnd, level, used);
        const matches = round.boards.filter((b) => b.distance === level);
        expect(matches).toHaveLength(1);
        expect(round.boards[round.correctIndex].distance).toBe(level);
      }
    });

    it(`level=${level}: у остальных досок путь длиннее ${level} или отсутствует, никогда короче`, () => {
      const rnd = seeded(200 + level);
      for (let trial = 0; trial < 20; trial++) {
        const used = new Set<string>();
        const round = generateKnightScanRound(rnd, level, used);
        round.boards.forEach((b, i) => {
          if (i === round.correctIndex) return;
          if (b.distance !== null) expect(b.distance).toBeGreaterThan(level);
        });
      }
    });

    it(`level=${level}: у верной доски BFS-путь действительно ведёт из коня в цель за ${level} ходов`, () => {
      const rnd = seeded(300 + level);
      const used = new Set<string>();
      const round = generateKnightScanRound(rnd, level, used);
      const correct = round.boards[round.correctIndex];
      expect(correct.path).not.toBeNull();
      const path = correct.path as number[];
      expect(path[0]).toBe(correct.knight);
      expect(path[path.length - 1]).toBe(correct.target);
      expect(path.length - 1).toBe(level);
      // ни один промежуточный узел пути не занят препятствием
      for (const sq of path) {
        if (sq !== correct.knight && sq !== correct.target) {
          expect(correct.obstacles).not.toContain(sq);
        }
      }
    });

    it(`level=${level}: целевая клетка всегда свободна ни на одной из четырёх досок`, () => {
      const rnd = seeded(400 + level);
      for (let trial = 0; trial < 20; trial++) {
        const used = new Set<string>();
        const round = generateKnightScanRound(rnd, level, used);
        for (const b of round.boards) {
          expect(b.obstacles).not.toContain(b.target);
          expect(b.obstacles).not.toContain(b.knight);
        }
      }
    });

    it(`level=${level}: у верной доски препятствий не больше заявленного сложностью`, () => {
      const rnd = seeded(500 + level);
      const used = new Set<string>();
      const round = generateKnightScanRound(rnd, level, used);
      expect(round.boards[round.correctIndex].obstacles.length).toBeLessThanOrEqual(round.obstacleCount);
    });

    it(`level=${level}: «похожие» ложные доски не разрастаются в непроходимую тесноту`, () => {
      // «Похожий» вариант — верная доска плюс не более 3 лишних фигур
      // (см. similarDecoy) — иначе четыре мини-доски превращаются в
      // «шахматные ковры», а не чистое сравнение.
      const rnd = seeded(600 + level);
      const used = new Set<string>();
      const round = generateKnightScanRound(rnd, level, used);
      for (const b of round.boards) {
        expect(b.obstacles.length).toBeLessThanOrEqual(round.obstacleCount + 3);
      }
    });
  }
});

describe('generateKnightScanSession — вся сессия целиком', () => {
  it('3 разминочных + 20 зачётных, у зачётных — точное распределение 6/10/4 по уровням', () => {
    const rnd = seeded(7);
    const session = generateKnightScanSession(rnd);
    expect(session.rounds).toHaveLength(KNIGHT_SCAN_WARMUP + KNIGHT_SCAN_SCORED);

    const warmup = session.rounds.slice(0, KNIGHT_SCAN_WARMUP);
    for (const r of warmup) expect(r.level).toBe(2);

    const scored = session.rounds.slice(KNIGHT_SCAN_WARMUP);
    expect(scored).toHaveLength(KNIGHT_SCAN_SCORED);
    const counts: Record<number, number> = { 2: 0, 3: 0, 4: 0 };
    for (const r of scored) counts[r.level]++;
    expect(counts).toEqual({
      2: KNIGHT_SCAN_LEVEL_COUNTS[2],
      3: KNIGHT_SCAN_LEVEL_COUNTS[3],
      4: KNIGHT_SCAN_LEVEL_COUNTS[4],
    });
  });

  it('порядок зачётных заданий не всегда отсортирован по уровню (перемешан)', () => {
    // На фиксированном сиде порядок детерминирован — проверяем, что он
    // не совпадает с тривиальным «все двойки, потом тройки, потом
    // четвёрки», иначе сложность росла бы предсказуемо от задания к
    // заданию.
    const rnd = seeded(7);
    const session = generateKnightScanSession(rnd);
    const scoredLevels = session.rounds.slice(KNIGHT_SCAN_WARMUP).map((r) => r.level);
    const sorted = [...scoredLevels].sort((a, b) => a - b);
    expect(scoredLevels).not.toEqual(sorted);
  });

  it('ни одна доска не повторяется внутри сессии (проверка по сигнатуре)', () => {
    const rnd = seeded(42);
    const session = generateKnightScanSession(rnd);
    const seen = new Set<string>();
    for (const round of session.rounds) {
      for (const b of round.boards) {
        const sig = boardSignature(b);
        expect(seen.has(sig)).toBe(false);
        seen.add(sig);
      }
    }
  });

  it('сид сессии — детерминированное число, зависящее от rnd', () => {
    const a = generateKnightScanSession(seeded(9));
    const b = generateKnightScanSession(seeded(9));
    expect(a.seed).toBe(b.seed);
  });

  it('несколько разных сидов подряд — каждый даёт валидную сессию (устойчивость генератора)', () => {
    for (const s of [1, 2, 3, 17, 99, 12345]) {
      const session = generateKnightScanSession(seeded(s));
      expect(session.rounds).toHaveLength(KNIGHT_SCAN_WARMUP + KNIGHT_SCAN_SCORED);
      for (const round of session.rounds) {
        const matches = round.boards.filter((b) => b.distance === round.level);
        expect(matches).toHaveLength(1);
      }
    }
  });

  /*
   * Жалоба пользователя: «иногда правильный ответ сразу о нескольких
   * досках». Разбор кода не нашёл нарушения на уровне логики — но
   * прежняя проверка (assertExactlyOneCorrect в knight-scan-logic.ts)
   * перечитывала уже посчитанное board.distance, а не пересчитывала его
   * заново, поэтому ошибка в самом knightShortestPath осталась бы
   * незамеченной (одна и та же функция не может проверить сама себя).
   * Здесь — много сидов подряд (не 6, а 200) и Math.random() отдельно,
   * чтобы ловить редкие сочетания, которые не попадают на маленькую
   * фиксированную выборку сидов выше.
   */
  it('двести разных сидов подряд — инвариант держится на куда большей выборке', () => {
    for (let s = 1; s <= 200; s++) {
      const session = generateKnightScanSession(seeded(s * 7919 + 3));
      for (const round of session.rounds) {
        const matches = round.boards.filter((b) => b.distance === round.level);
        expect(matches).toHaveLength(1);
        expect(round.boards[round.correctIndex].distance).toBe(round.level);
      }
    }
  });

  it('на настоящем Math.random (как в продакшене) — 30 сессий подряд без нарушений', () => {
    for (let i = 0; i < 30; i++) {
      const session = generateKnightScanSession(() => Math.random());
      for (const round of session.rounds) {
        const matches = round.boards.filter((b) => b.distance === round.level);
        expect(matches).toHaveLength(1);
      }
    }
  });
});

/*
 * Независимая от knightShortestPath реализация того же BFS (свой массив
 * расстояний по индексу вместо Map+visited-Set) — сверяет РЕЗУЛЬТАТ, а
 * не переиспользует проверяемую функцию для проверки самой себя. Именно
 * такую перепроверку не делала прежняя assertExactlyOneCorrect (см.
 * комментарий у теста «двести сидов» выше) — если бы в knightShortestPath
 * был баг, инвариант «ровно одна верная доска» держался бы СИСТЕМАТИЧЕСКИ
 * неверно и ни разу бы не поймался, потому что сверялся сам с собой.
 */
describe('knightShortestPath — сверка с независимым BFS на большой случайной выборке', () => {
  const KNIGHT_STEPS_LOCAL: ReadonlyArray<readonly [number, number]> = [
    [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
  ];

  function bruteDistance(start: number, target: number, blocked: ReadonlySet<number>): number | null {
    if (start === target) return 0;
    const dist = new Array<number>(64).fill(-1);
    dist[start] = 0;
    const queue = [start];
    for (let qi = 0; qi < queue.length; qi++) {
      const cur = queue[qi];
      const f = cur % 8;
      const r = Math.floor(cur / 8);
      for (const [df, dr] of KNIGHT_STEPS_LOCAL) {
        const nf = f + df;
        const nr = r + dr;
        if (nf < 0 || nf > 7 || nr < 0 || nr > 7) continue;
        const nb = nr * 8 + nf;
        if (dist[nb] !== -1 || blocked.has(nb)) continue;
        dist[nb] = dist[cur] + 1;
        if (nb === target) return dist[nb];
        queue.push(nb);
      }
    }
    return null;
  }

  it('3000 случайных досок (0–5 препятствий) — расстояние и путь совпадают с независимым BFS', () => {
    const rnd = seeded(555);
    let checked = 0;
    for (let i = 0; i < 3000; i++) {
      const start = Math.floor(rnd() * 64);
      const target = Math.floor(rnd() * 64);
      if (start === target) continue;
      const blocked = new Set<number>();
      const obstCount = Math.floor(rnd() * 6);
      while (blocked.size < obstCount) {
        const sq = Math.floor(rnd() * 64);
        if (sq !== start && sq !== target) blocked.add(sq);
      }
      const path = knightShortestPath(start, target, blocked);
      const gotDist = path ? path.length - 1 : null;
      const wantDist = bruteDistance(start, target, blocked);
      checked++;
      expect(gotDist).toBe(wantDist);
      if (path) {
        // Путь — легальная последовательность ходов коня, ни один
        // промежуточный узел не занят препятствием (кроме самой цели).
        for (let k = 1; k < path.length; k++) {
          const a = path[k - 1];
          const b = path[k];
          const af = a % 8;
          const ar = Math.floor(a / 8);
          const bf = b % 8;
          const br = Math.floor(b / 8);
          const df = Math.abs(af - bf);
          const dr = Math.abs(ar - br);
          expect((df === 1 && dr === 2) || (df === 2 && dr === 1)).toBe(true);
          if (b !== target) expect(blocked.has(b)).toBe(false);
        }
      }
    }
    expect(checked).toBeGreaterThan(2500);
  });
});
