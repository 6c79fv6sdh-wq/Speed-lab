import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const { putGame } = vi.hoisted(() => ({ putGame: vi.fn() }));
vi.mock('../src/core/db', () => ({ putGame, getGame: vi.fn(), uid: () => 'game' }));
import { GameAutosave, newGameRecord } from '../src/core/games';
import { timeControl } from '../src/core/timecontrol';
beforeEach(() => { putGame.mockReset(); document.body.replaceChildren(); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());
const game = () => newGameRecord({ profileId: 'p', userColor: 'white', bot: { id: 'bot', name: 'Bot', kind: 'engine', rating: 1500 }, timeControl: timeControl('5+3') });

it('keeps an immutable snapshot even if the live game changes before persistence', async () => {
  const record = game();
  const autosave = new GameAutosave();
  autosave.save(record);
  record.moves.push({ uci: 'e2e4', san: 'e4', spentMs: 100, clockLeftMs: 300000 });
  await autosave.flush();
  expect(putGame.mock.calls[0][0].moves).toEqual([]);
});

it('reports quota failure, preserves unsaved data and retries it', async () => {
  putGame.mockRejectedValueOnce(new DOMException('full', 'QuotaExceededError')).mockResolvedValue(undefined);
  const autosave = new GameAutosave();
  autosave.save(game());
  await expect(autosave.flush()).rejects.toThrow('full');
  expect(document.querySelector('[role="alert"]')?.textContent).toMatch(/сохран/);
  await autosave.flush();
  expect(putGame).toHaveBeenCalledTimes(2);
  expect(putGame.mock.calls[0][0]).toEqual(putGame.mock.calls[1][0]);
});

it('does not restore an older failed snapshot over a newer queued save', async () => {
  let rejectFirst!: (error: Error) => void;
  putGame.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectFirst = reject; })).mockResolvedValue(undefined);
  const autosave = new GameAutosave();
  const record = game();
  autosave.save(record);
  const first = autosave.flush();
  const failure = expect(first).rejects.toThrow('full');
  await Promise.resolve();
  record.resultLabel = 'newer state';
  autosave.save(record);
  const second = autosave.flush();
  rejectFirst(new Error('full'));
  await failure;
  await second;
  await autosave.flush();
  expect(putGame).toHaveBeenCalledTimes(2);
  expect(putGame.mock.calls[1][0].resultLabel).toBe('newer state');
});

it('retains retry actions for more than one failed write', async () => {
  const { reportStorageError } = await import('../src/core/storage-error');
  const first = vi.fn().mockResolvedValue(undefined);
  const second = vi.fn().mockResolvedValue(undefined);
  reportStorageError(new Error('first'), first);
  reportStorageError(new Error('second'), second);
  (document.querySelector('#storage-error button') as HTMLButtonElement).click();
  await vi.waitFor(() => expect(document.querySelector('#storage-error')).toBeNull());
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
});
