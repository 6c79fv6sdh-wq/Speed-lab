import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { DEFAULT_CALIBRATION } from '../src/core/settings';
import { newGameRecord } from '../src/core/games';
import { timeControl } from '../src/core/timecontrol';

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory();
  vi.resetModules();
});

async function fixture() {
  const db = await import('../src/core/db');
  for (const id of ['source', 'destination']) {
    await db.putProfile({ id, name: id, nameKey: id, createdAt: 1, lastSeenAt: 1 });
  }
  await db.setActiveProfileId('source');
  await db.putSession({ id: 'session', profileId: 'source', module: 'motorics', mode: 'test', startedAt: 1, endedAt: 2, calibration: DEFAULT_CALIBRATION, summary: {} });
  await db.putMeasurement({ id: 'measurement', sessionId: 'session', profileId: 'source', module: 'motorics', mode: 'test', ts: 1, calibration: DEFAULT_CALIBRATION, data: { latencyMs: 10 } });
  await db.recordOpeningNode('rep', '', 'e4', 10);
  const game = newGameRecord({ profileId: 'source', userColor: 'white', bot: { id: 'bot', name: 'Bot', kind: 'engine', rating: 1500 }, timeControl: timeControl('5+3') });
  await db.putGame(game);
  const bundle = await db.exportBundle();
  return { db, bundle, game };
}

describe('backup and profile isolation', () => {
  it('restores games and measurements into another profile without duplicates', async () => {
    const { db, bundle } = await fixture();
    expect(bundle.version).toBe(2);
    expect(bundle.games).toHaveLength(1);
    await db.setActiveProfileId('destination');
    await db.importBundle(bundle);
    await db.importBundle(bundle);
    const sessions = await db.allSessions();
    const measurements = await db.allMeasurements();
    expect(sessions).toHaveLength(1);
    expect(measurements).toHaveLength(1);
    expect(measurements[0].sessionId).toBe(sessions[0].id);
    expect(measurements[0].profileId).toBe('destination');
    expect(await db.gamesOfProfile('destination')).toHaveLength(1);
    expect(await db.allOpeningNodes()).toHaveLength(1);
    await db.setActiveProfileId('source');
    expect(await db.allMeasurements()).toHaveLength(1);
    expect(await db.gamesOfProfile('source')).toHaveLength(1);
  });

  it('clears only active-profile measurements and preserves both game histories', async () => {
    const { db, bundle } = await fixture();
    await db.setActiveProfileId('destination');
    await db.importBundle(bundle);
    await db.clearMeasurements();
    expect(await db.allMeasurements()).toHaveLength(0);
    expect(await db.allSessions()).toHaveLength(0);
    expect(await db.allOpeningNodes()).toHaveLength(0);
    expect(await db.gamesOfProfile('destination')).toHaveLength(1);
    await db.setActiveProfileId('source');
    expect(await db.allMeasurements()).toHaveLength(1);
    expect(await db.gamesOfProfile('source')).toHaveLength(1);
  });

  it('rejects a malformed later record before writing any earlier record', async () => {
    const { db, bundle } = await fixture();
    await db.setActiveProfileId('destination');
    bundle.games[0].fen = 'not a chess position';
    await expect(db.importBundle(bundle)).rejects.toThrow();
    expect(await db.allSessions()).toHaveLength(0);
    expect(await db.allMeasurements()).toHaveLength(0);
  });

  it('rolls back the whole transaction on an ID collision with a foreign profile', async () => {
    const { db, bundle } = await fixture();
    await db.setActiveProfileId('destination');
    const foreign = { ...bundle.measurements[0], id: `import:${JSON.stringify(['destination', 'source', 'measurement'])}` };
    await db.putMeasurement(foreign);
    await expect(db.importBundle(bundle)).rejects.toThrow(/другого профиля/);
    expect(await db.allSessions()).toHaveLength(0);
    await db.setActiveProfileId('source');
    expect((await db.allMeasurements()).find(m => m.id === foreign.id)?.profileId).toBe('source');
  });

  it('reads v1 backups and rejects unknown versions and inconsistent game positions', async () => {
    const { db, bundle } = await fixture();
    const v1 = { ...bundle, version: 1, profile: undefined, games: undefined };
    expect(db.parseBundle(JSON.stringify(v1)).games).toEqual([]);
    expect(() => db.parseBundle(JSON.stringify({ ...bundle, version: 99 }))).toThrow(/версия/);
    bundle.games[0].moves.push({ uci: 'e2e4', san: 'e4', spentMs: 100, clockLeftMs: 300000 });
    expect(() => db.parseBundle(JSON.stringify(bundle))).toThrow(/fen/);
  });
});

it('adopts legacy opening statistics under the new profile key', async () => {
  const { db } = await fixture();
  const { openDB } = await import('idb');
  const connection = await openDB('sciencechess-hyperlab', 2);
  await connection.put('openingNodes', { id: 'rep|e4', repertoireId: 'rep', path: 'e4', expectedSan: 'e5', samples: [30], updatedAt: 1 });
  connection.close();
  expect(await db.adoptOrphanRecords('source')).toBe(1);
  await db.recordOpeningNode('rep', 'e4', 'e5', 50);
  const nodes = await db.getOpeningNodes('rep');
  expect(nodes.get('e4')?.id).toBe('source|rep|e4');
  expect(nodes.get('e4')?.samples).toEqual([30, 50]);
});
