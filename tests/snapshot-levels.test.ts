import { describe, expect, it } from 'vitest';
import { SNAPSHOT_LEVELS, SNAPSHOT_SCORED, generateSnapshotSession, chooseRemoved, snapshotRecordLevel } from '../src/modules/snapshot-logic';
import { SNAPSHOT_MEANINGFUL_POSITIONS } from '../src/data/snapshot-positions';
import { summarizeAll, summarizeModule } from '../src/modules/data-summary';
import { sessionIsComplete } from '../src/modules/today-plan';
import { DEFAULT_CALIBRATION } from '../src/core/settings';
import type { MeasurementRecord, SessionRecord } from '../src/core/db';
const random = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };

for (const level of SNAPSHOT_LEVELS) describe(`Snapshot level ${level}`, () => {
  it('removes exactly N distinct pieces for every task, with 3000 ms exposure and the same source pool', () => {
    for (const seed of [1, 7, 13, 42, 99]) {
      const session = generateSnapshotSession(random(seed), seed, level)!;
      expect(session).not.toBeNull();
      expect(session.level).toBe(level);
      for (const task of session.tasks) {
        expect(task.level).toBe(level);
        expect(task.exposureMs).toBe(3000);
        expect(task.removed).toHaveLength(level);
        expect(new Set(task.removed.map(p => p.square)).size).toBe(level);
        expect(task.removed.every(p => task.pieces.some(original => original.square === p.square && original.role === p.role && original.color === p.color))).toBe(true);
      }
      expect(session.tasks.filter(t => !t.warmup && t.meaningful).map(t => t.meaningful!.id).sort())
        .toEqual(SNAPSHOT_MEANINGFUL_POSITIONS.map(p => p.id).sort());
    }
  });
  it('counts a completed session in the daily plan and rejects a partial session', () => {
    const session = {module:'reaction', mode:`snapshot:level-${level}`, summary:{attempts:SNAPSHOT_SCORED, level}} as unknown as SessionRecord;
    expect(sessionIsComplete(session)).toBe(true);
    expect(sessionIsComplete({...session, summary:{attempts:SNAPSHOT_SCORED-1, level}})).toBe(false);
  });
});
it('skips an unsuitable position instead of lowering the requested count', () => {
  const invalid = {...SNAPSHOT_MEANINGFUL_POSITIONS[0], id:'too-few', fen:'8/8/8/8/8/8/8/K7 w - - 0 1'};
  const session = generateSnapshotSession(random(18),18,5,[invalid,...SNAPSHOT_MEANINGFUL_POSITIONS])!;
  expect(session).not.toBeNull();
  expect(session.tasks.every(task => task.removed.length===5 && task.pairId !== invalid.id)).toBe(true);
  expect(chooseRemoved([{square:'a1',role:'king',color:'white'}], 2, random(1))).toBeNull();
});
it('never guesses a new level from legacy difficulty or number of removed pieces', () => {
  expect(snapshotRecordLevel('snapshot',{difficulty:'easy',total:3,exposureMs:2500})).toBeNull();
  expect(snapshotRecordLevel('snapshot:level-3',{level:4})).toBeNull();
  expect(sessionIsComplete({module:'reaction',mode:'snapshot',summary:{attempts:16}} as unknown as SessionRecord)).toBe(true);
});
it('keeps each Snapshot level and legacy measurements in separate progress aggregates', () => {
  const make = (mode:string, level?:number):MeasurementRecord => ({id:mode,sessionId:mode,profileId:'p',module:'reaction',mode,ts:1,calibration:DEFAULT_CALIBRATION,data:{level,latencyMs:100,correct:true}});
  const measurements = [make('snapshot:level-1',1),make('snapshot:level-5',5),make('snapshot')];
  for(const rows of [summarizeAll(measurements),summarizeModule(measurements,'reaction')]) {
    expect(rows).toHaveLength(3);
    expect(rows.map(row=>row.attempts)).toEqual([1,1,1]);
    expect(rows.map(row=>row.key)).toEqual(expect.arrayContaining(['Snapshot · уровень 1','Snapshot · уровень 5','Snapshot · без уровня (прежние результаты)']));
  }
});
