import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ allSessions: vi.fn(async () => []), measurementsOf: vi.fn(async () => []), activeProfileId: vi.fn(async () => 'p'), putSession: vi.fn(async () => {}), putMeasurement: vi.fn(async () => {}), uid: vi.fn(() => crypto.randomUUID()) }));
vi.mock('../src/core/db', () => db);
import { mountReaction } from '../src/modules/reaction';
import { mountMotorics } from '../src/modules/motorics';
import { DEFAULT_CALIBRATION } from '../src/core/settings';
import { mockBounds } from './helpers/dom';
import type { AppContext } from '../src/main';
let root: HTMLElement;
let unmount: (() => void) | undefined;
const ctx = { calibration: DEFAULT_CALIBRATION, profile: { id: 'p', name: 'Test' }, setCalibration: vi.fn(), setProfileName: vi.fn(), signOut: vi.fn() } as unknown as AppContext;
const choose = (name: string) => [...root.querySelectorAll<HTMLButtonElement>('.seg-btn')].find(b => b.textContent === name)!.click();
const visible = (b: HTMLElement) => { for (let el: HTMLElement | null = b; el && el !== root; el = el.parentElement) if (el.style.display === 'none' || el.hidden) return false; return true; };
const start = () => [...root.querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent === 'Старт' && visible(b))!;
async function flush() { for (let i = 0; i < 20; i++) await Promise.resolve(); }
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  mockBounds(); root = document.createElement('div'); document.body.append(root);
});
afterEach(async () => { unmount?.(); await flush(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.replaceChildren(); });
describe('switching exercise saves and stops the previous attempt', () => {
  it.each([
    ['Что висит?', 'Мат в 1'],
    ['Мат в 1', 'Шах'],
    ['Скан конём', 'Мат в 1'],
    ['Snapshot', 'Мат в 1'],
    ['Мат в 1', 'Snapshot'],
  ])('tactics: %s → %s needs no Stop button', async (from, to) => {
    unmount = mountReaction(root, ctx); choose(from); await flush(); start().click();
    choose(from); await flush(); expect(db.putSession).not.toHaveBeenCalled();
    choose(to); await flush();
    expect(db.putSession).toHaveBeenCalledTimes(1);
    const old = db.putSession.mock.calls[0] as unknown as [{id: string}];
    const nextStart = start(); expect(nextStart.disabled).toBe(false); nextStart.click(); expect(nextStart.disabled).toBe(true);
    await vi.advanceTimersByTimeAsync(6000);
    expect(db.putSession).toHaveBeenCalledTimes(1);
    unmount(); unmount = undefined; await flush();
    expect(db.putSession).toHaveBeenCalledTimes(2);
    expect((db.putSession.mock.calls[1] as unknown as [{id: string}])[0].id).not.toBe(old[0].id);
  });
  it('supports chained switches through scan and Snapshot back to ordinary tactics', async () => {
    unmount = mountReaction(root, ctx);
    for (const name of ['Что висит?', 'Мат в 1', 'Скан конём', 'Snapshot', 'Шах']) {
      choose(name); await flush();
      const nextStart = start(); expect(nextStart.disabled).toBe(false);
      nextStart.click(); expect(nextStart.disabled).toBe(true);
    }
    expect(db.putSession).toHaveBeenCalledTimes(4);
  });
  it('waits for saving before allowing another session to start', async () => {
    unmount = mountReaction(root, ctx); start().click();
    let saved!: () => void;
    db.putSession.mockImplementationOnce(() => new Promise<void>(resolve => { saved = resolve; }));
    choose('Мат в 1'); await flush();
    expect(start().disabled).toBe(true);
    expect([...root.querySelectorAll<HTMLElement>('.seg')][0].querySelectorAll('button:disabled').length).toBeGreaterThan(0);
    saved(); await flush();
    expect(start().disabled).toBe(false);
    expect(db.putSession).toHaveBeenCalledTimes(1);
  });
  it.each([['Вектор', 'Сигнал'], ['Сигнал', 'Маршрут'], ['Маршрут', 'Вектор']])('motorics: %s → %s needs no Stop button', async (from, to) => {
    unmount = mountMotorics(root, ctx); choose(from); await flush(); start().click(); await flush();
    choose(from); await flush(); expect(db.putSession).not.toHaveBeenCalled();
    choose(to); await flush(); expect(db.putSession).toHaveBeenCalledTimes(1);
    expect(start().disabled).toBe(false); start().click(); await flush(); expect(start().disabled).toBe(true);
    unmount(); unmount = undefined; await flush(); expect(db.putSession).toHaveBeenCalledTimes(2);
  });
});
