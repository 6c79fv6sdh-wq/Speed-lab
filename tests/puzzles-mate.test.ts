import { describe, it, expect } from 'vitest';
import { MATE_PUZZLES, matePuzzleUrl } from '../src/data/puzzles-mate';
import { allLegalMoves, isLegalUci, moveFromUci, posFromFen, tryPosFromFen, uciOf } from '../src/core/chess';

describe('задачи «мат в один ход»', () => {
  it('набор непустой, идентификаторы уникальны', () => {
    expect(MATE_PUZZLES.length).toBeGreaterThanOrEqual(100);
    const ids = MATE_PUZZLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ссылка на задачу собирается корректно', () => {
    expect(matePuzzleUrl(MATE_PUZZLES[0])).toBe(
      `https://lichess.org/training/${MATE_PUZZLES[0].id}`,
    );
  });

  it('каждая задача: валидный FEN, ход белых, легальный ход, после него мат', () => {
    for (const p of MATE_PUZZLES) {
      expect(tryPosFromFen(p.fen), `${p.id}: невалидный FEN ${p.fen}`).not.toBeNull();
      const pos = posFromFen(p.fen);

      expect(pos.turn, `${p.id}: ход должен быть за белых`).toBe('white');
      expect(isLegalUci(pos, p.uci), `${p.id}: ход ${p.san} (${p.uci}) нелегален`).toBe(true);

      const after = pos.clone();
      after.play(moveFromUci(p.uci));
      expect(after.isCheckmate(), `${p.id}: после ${p.san} нет мата`).toBe(true);
    }
  });

  it('у каждой задачи проставлена тема mateIn1', () => {
    for (const p of MATE_PUZZLES) {
      expect(p.themes, `${p.id}: темы пустые`).not.toHaveLength(0);
      expect(p.themes.includes('mateIn1'), `${p.id}: нет темы mateIn1`).toBe(true);
    }
  });

  /*
   * Синтетический набор SCM1-0001..SCM1-0500 (см. src/data/puzzles-mate.ts)
   * прислан с темой uniqueSolution — упражнение принимает как верный ТОЛЬКО
   * один конкретный uci (taskFromSolution в reaction-logic.ts), поэтому
   * заявленную единственность нельзя просто принять на слово: если бы
   * матовал ещё какой-то ход, ответ пользователя тем же ходом иногда
   * засчитывался бы ошибкой. Перебираем вообще все легальные ходы позиции.
   */
  it('набор SCM1 (uniqueSolution): решение действительно единственно', () => {
    const scm1 = MATE_PUZZLES.filter((p) => p.id.startsWith('SCM1-'));
    expect(scm1.length).toBeGreaterThan(0);
    for (const p of scm1) {
      const pos = posFromFen(p.fen);
      const mates = new Set<string>();
      for (const move of allLegalMoves(pos)) {
        const trial = pos.clone();
        trial.play(move);
        if (trial.isCheckmate()) mates.add(uciOf(move));
      }
      expect([...mates], `${p.id}: должен матовать ровно один ход`).toEqual([p.uci]);
    }
  });
});
