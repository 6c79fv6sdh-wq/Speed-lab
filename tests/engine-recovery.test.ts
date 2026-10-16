import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Engine } from '../src/core/engine';

class TestWorker {
  static instances: TestWorker[] = [];
  static handshake = true;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  commands: string[] = [];
  terminated = false;
  constructor() { TestWorker.instances.push(this); }
  emit(data: string) { this.onmessage?.({ data }); }
  postMessage(command: string) {
    this.commands.push(command);
    if (TestWorker.handshake && command === 'uci') this.emit('uciok');
    if (TestWorker.handshake && command === 'isready') this.emit('readyok');
  }
  terminate() { this.terminated = true; }
}
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
let engine: Engine;
beforeEach(() => {
  vi.useFakeTimers();
  TestWorker.instances = [];
  TestWorker.handshake = true;
  vi.stubGlobal('Worker', TestWorker);
  engine = new Engine();
});
afterEach(() => { engine.destroy(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('engine recovery and command ordering', () => {
  it('terminates a failed startup and permits a clean retry', async () => {
    TestWorker.handshake = false;
    const boot = engine.start();
    const rejected = expect(boot).rejects.toThrow(/молчит/);
    expect(engine.ready).toBe(false);
    await vi.advanceTimersByTimeAsync(60001);
    await rejected;
    expect(TestWorker.instances[0].terminated).toBe(true);
    expect(engine.ready).toBe(false);
    TestWorker.handshake = true;
    await engine.start();
    expect(TestWorker.instances).toHaveLength(2);
    expect(engine.ready).toBe(true);
  });

  it('serializes searches so each response belongs to its own position', async () => {
    const first = engine.bestMove('first position');
    const second = engine.bestMove('second position');
    await settle();
    const worker = TestWorker.instances[0];
    expect(worker.commands.filter(c => c.startsWith('position'))).toEqual(['position fen first position']);
    worker.emit('bestmove e2e4');
    expect(await first).toBe('e2e4');
    await settle();
    expect(worker.commands.filter(c => c.startsWith('position'))).toEqual(['position fen first position', 'position fen second position']);
    worker.emit('bestmove d2d4');
    expect(await second).toBe('d2d4');
  });

  it('rejects pending work immediately on destruction and restarts afterwards', async () => {
    const search = engine.bestMove('position');
    const rejected = expect(search).rejects.toThrow(/остановлен/);
    await settle();
    engine.destroy();
    await rejected;
    await engine.start();
    expect(engine.ready).toBe(true);
    expect(TestWorker.instances).toHaveLength(2);
  });
});
