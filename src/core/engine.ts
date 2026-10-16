/**
 * Обёртка над Stockfish 18 Lite (однопоточная WASM-сборка).
 *
 * Однопоточная выбрана намеренно: многопоточная требует SharedArrayBuffer,
 * а для него нужны заголовки COOP/COEP, которых на GitHub Pages не выставить.
 *
 * Движок живёт в Web Worker, чтобы поиск не морозил интерфейс.
 * Файлы лежат в public/engine и подтягиваются при первом обращении:
 * в предзагрузку service worker их не кладём, иначе первое открытие
 * сайта весило бы 7 МБ. После первого использования они кешируются.
 *
 * Stockfish распространяется под GPLv3, см. public/engine/LICENSE-stockfish.txt.
 */

export const ENGINE_NAME = 'Stockfish 18 Lite';

/** Границы UCI_Elo у этой сборки. */
export const ELO_MIN = 1320;
export const ELO_MAX = 3190;

export function clampElo(elo: number): number {
  return Math.min(ELO_MAX, Math.max(ELO_MIN, Math.round(elo)));
}

export interface SearchLimits {
  /** Сколько миллисекунд думать. */
  movetimeMs?: number;
  /** Ограничение по глубине вместо времени. */
  depth?: number;
}

/** Один вариант из анализа позиции. */
export interface AnalysisLine {
  move: string;
  /** Оценка в сантипешках с точки зрения того, чей ход в переданной позиции. */
  score: number;
  /** Мат в N полуходов той стороне, чей ход. undefined — форсированного мата не нашли. */
  mate?: number;
}

/** Анализ позиции: fen + сколько смотреть → варианты ходов с оценкой. */
export type Analyser = (
  fen: string,
  opts: { depth: number; multipv: number },
) => Promise<AnalysisLine[]>;

type Listener = (line: string) => void;

function engineUrl(): URL {
  // База считается от документа, чтобы работало и в подкаталоге GitHub Pages.
  const base = new URL(import.meta.env.BASE_URL || './', document.baseURI);
  return new URL('engine/stockfish-18-lite-single.js', base);
}

export class Engine {
  private worker: Worker | null = null;
  private listeners: Listener[] = [];
  private buffer: string[] = [];
  private booting: Promise<void> | null = null;
  private currentElo: number | null = null;
  private currentMultiPv = 1;
  private initialized = false;
  private generation = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private cancellations = new Set<() => void>();

  /** Готов ли движок принимать команды. */
  get ready(): boolean {
    return this.worker !== null && this.initialized;
  }

  /** Загружен ли WASM (первый вызов тянет 7 МБ). */
  async start(): Promise<void> {
    if (this.ready) return;
    if (this.booting) return this.booting;

    const generation = this.generation;
    const boot = (async () => {
      const worker = new Worker(engineUrl());
      this.worker = worker;
      worker.onmessage = (e: MessageEvent) => {
        if (generation !== this.generation) return;
        const line = typeof e.data === 'string' ? e.data : String(e.data);
        this.buffer.push(line);
        if (this.buffer.length > 400) this.buffer.splice(0, 200);
        for (const l of [...this.listeners]) l(line);
      };
      worker.onerror = worker.onmessageerror = () => {
        if (generation === this.generation) this.destroy();
      };
      this.send('uci');
      await this.until(/uciok/, 60000);
      this.send('setoption name Threads value 1');
      this.send('setoption name Hash value 16');
      this.send('isready');
      await this.until(/readyok/, 60000);
      if (generation !== this.generation) throw new Error('Запуск движка отменён');
      this.initialized = true;
    })();
    this.booting = boot;

    try {
      await boot;
    } catch (error) {
      if (generation === this.generation) this.destroy();
      throw error;
    } finally {
      if (this.booting === boot) this.booting = null;
    }
  }

  private send(cmd: string): void {
    this.worker?.postMessage(cmd);
  }

  /**
   * Ждёт строку по образцу. Сначала смотрит уже полученные строки:
   * ответ движка может опередить подписку.
   */
  private until(re: RegExp, timeoutMs = 30000): Promise<RegExpExecArray> {
    for (const line of this.buffer) {
      const m = re.exec(line);
      if (m) return Promise.resolve(m);
    }
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        off();
        reject(new Error(`движок молчит: ${re}`));
      }, timeoutMs);
      const fn: Listener = (line) => {
        const m = re.exec(line);
        if (m) {
          window.clearTimeout(timer);
          off();
          resolve(m);
        }
      };
      const cancel = () => {
        window.clearTimeout(timer);
        off();
        reject(new Error('Движок остановлен'));
      };
      const off = () => {
        this.cancellations.delete(cancel);
        const i = this.listeners.indexOf(fn);
        if (i >= 0) this.listeners.splice(i, 1);
      };
      this.cancellations.add(cancel);
      this.listeners.push(fn);
    });
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const generation = this.generation;
    const result = this.queue.then(async () => {
      if (generation !== this.generation) throw new Error('Поиск отменён');
      try { return await operation(); }
      catch (error) {
        if (generation === this.generation) this.destroy();
        throw error;
      }
    });
    this.queue = result.catch(() => undefined);
    return result;
  }

  setStrength(elo: number | null): Promise<void> { return this.enqueue(() => this.setStrengthNow(elo)); }
  newGame(): Promise<void> { return this.enqueue(() => this.newGameNow()); }
  bestMove(fen: string, limits: SearchLimits = {}): Promise<string | null> {
    return this.enqueue(() => this.bestMoveNow(fen, limits));
  }
  analyse(fen: string, limits: SearchLimits & { multipv?: number } = {}): Promise<AnalysisLine[]> {
    return this.enqueue(() => this.analyseNow(fen, limits));
  }

  /** elo = null — играть в полную силу. */
  private async setStrengthNow(elo: number | null): Promise<void> {
    await this.start();
    if (this.currentElo === elo) return;
    this.buffer.length = 0;
    if (elo === null) {
      this.send('setoption name UCI_LimitStrength value false');
    } else {
      this.send('setoption name UCI_LimitStrength value true');
      this.send(`setoption name UCI_Elo value ${clampElo(elo)}`);
    }
    this.send('isready');
    await this.until(/readyok/);
    this.currentElo = elo;
  }

  private async newGameNow(): Promise<void> {
    await this.start();
    this.buffer.length = 0;
    this.send('ucinewgame');
    this.send('isready');
    await this.until(/readyok/);
  }

  /** Лучший ход в позиции. Возвращает UCI либо null, если ходов нет. */
  private async bestMoveNow(fen: string, limits: SearchLimits = {}): Promise<string | null> {
    await this.start();
    this.buffer.length = 0;
    if (this.currentMultiPv !== 1) {
      this.send('setoption name MultiPV value 1');
      this.currentMultiPv = 1;
    }
    this.send(`position fen ${fen}`);
    const limit = limits.depth ? `depth ${limits.depth}` : `movetime ${limits.movetimeMs ?? 100}`;
    this.send(`go ${limit}`);
    const m = await this.until(/^bestmove (\S+)/, 60000);
    const uci = m[1];
    return uci === '(none)' ? null : uci;
  }

  /**
   * Несколько вариантов с оценкой — а не просто лучший ход. Нужно
   * «слепому» боту (core/blind-bot.ts): он сам решает, брать ли лучший
   * вариант, поэтому ему нужны варианты и оценки, а не готовое решение
   * движка.
   *
   * Парсим строки `info ... multipv N score cp/mate V ... pv MOVE ...`,
   * которые движок шлёт по ходу поиска, и на `bestmove` берём последнюю
   * (то есть самую свежую и глубокую) строку на каждый multipv-индекс.
   */
  private async analyseNow(fen: string, limits: SearchLimits & { multipv?: number } = {}): Promise<AnalysisLine[]> {
    await this.start();
    const multipv = Math.max(1, limits.multipv ?? 1);
    if (multipv !== this.currentMultiPv) {
      this.send(`setoption name MultiPV value ${multipv}`);
      this.currentMultiPv = multipv;
    }
    this.buffer.length = 0;
    this.send(`position fen ${fen}`);

    const lines = new Map<number, AnalysisLine>();
    const onLine = (line: string) => {
      const m =
        /^info .*\bmultipv (\d+) .*?\bscore (cp|mate) (-?\d+) .*?\bpv (\S+)/.exec(line);
      if (!m) return;
      const idx = Number(m[1]);
      const kind = m[2];
      const value = Number(m[3]);
      lines.set(idx, {
        move: m[4],
        score: kind === 'cp' ? value : value > 0 ? 10000 : -10000,
        mate: kind === 'mate' ? value : undefined,
      });
    };
    this.listeners.push(onLine);

    const limit = limits.depth ? `depth ${limits.depth}` : `movetime ${limits.movetimeMs ?? 100}`;
    this.send(`go ${limit}`);
    try {
      await this.until(/^bestmove/, 60000);
    } finally {
      const i = this.listeners.indexOf(onLine);
      if (i >= 0) this.listeners.splice(i, 1);
    }
    return [...lines.entries()].sort(([a], [b]) => a - b).map(([, v]) => v);
  }

  /** Прервать текущий поиск. */
  stop(): void {
    this.send('stop');
  }

  destroy(): void {
    this.generation++;
    this.initialized = false;
    for (const cancel of [...this.cancellations]) cancel();
    this.booting = null;
    this.currentMultiPv = 1;
    try {
      this.send('quit');
    } catch {
      // Воркер мог уже умереть — это не повод падать.
    }
    this.worker?.terminate();
    this.worker = null;
    this.listeners = [];
    this.buffer = [];
    this.currentElo = null;
  }
}

/**
 * Один общий экземпляр на приложение: 7 МБ WASM незачем грузить дважды.
 */
let shared: Engine | null = null;

export function sharedEngine(): Engine {
  if (!shared) shared = new Engine();
  return shared;
}

export function engineSupported(): boolean {
  return typeof Worker !== 'undefined' && typeof WebAssembly === 'object';
}
