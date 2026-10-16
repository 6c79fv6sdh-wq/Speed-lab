import type { ExportBundle, MeasurementRecord, OpeningNodeStat, SessionRecord } from './db';
import type { GameRecord } from './games';
import { buildPgn } from './games';
import { fenOf, makeSan, moveFromUci, posFromFen } from './chess';
import { normalizeCalibration } from './settings';
import { nameKeyOf, validateName, type Profile } from './profiles';

export const MAX_BACKUP_BYTES = 30 * 1024 * 1024;
const modules = new Set(['motorics', 'premove', 'reaction', 'openings', 'scramble']);
type Row = Record<string, unknown>;
function fail(path: string): never { throw new Error(`Некорректное поле: ${path}`); }
function object(value: unknown, path: string): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path);
  return value as Row;
}
function str(value: unknown, path: string, empty = false): string {
  if (typeof value !== 'string' || (!empty && !value.length) || value.length > 100_000) fail(path);
  return value;
}
function num(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) fail(path);
  return value;
}
function entries(value: unknown, path: string): Row[] {
  if (!Array.isArray(value) || value.length > 100_000) fail(path);
  const seen = new Set<string>();
  return value.map((v, i) => {
    const row = object(v, `${path}[${i}]`);
    const id = str(row.id, `${path}[${i}].id`);
    if (seen.has(id)) fail(`${path}[${i}].id (повтор)`);
    seen.add(id);
    return row;
  });
}
function owner(row: Row, path: string): void {
  if (row.profileId !== undefined) str(row.profileId, `${path}.profileId`);
}
function calibration(value: unknown, path: string) {
  const row = object(value, path);
  num(row.boardSize, `${path}.boardSize`);
  if (!['select', 'drag', 'both'].includes(String(row.inputMode))) fail(`${path}.inputMode`);
  if (typeof row.coordinates !== 'boolean') fail(`${path}.coordinates`);
  if (!['ipad-mouse', 'ipad-finger', 'pc-mouse'].includes(String(row.deviceProfile))) fail(`${path}.deviceProfile`);
  str(row.pointerLabel, `${path}.pointerLabel`, true);
  return normalizeCalibration(row);
}
function measurement(row: Row, i: number): MeasurementRecord {
  const path = `measurements[${i}]`; owner(row, path);
  if (!modules.has(String(row.module))) fail(`${path}.module`);
  str(row.sessionId, `${path}.sessionId`); str(row.mode, `${path}.mode`);
  num(row.ts, `${path}.ts`); object(row.data, `${path}.data`);
  return { ...row, calibration: calibration(row.calibration, `${path}.calibration`) } as unknown as MeasurementRecord;
}
function session(row: Row, i: number): SessionRecord {
  const path = `sessions[${i}]`; owner(row, path);
  if (!modules.has(String(row.module))) fail(`${path}.module`);
  str(row.mode, `${path}.mode`); num(row.startedAt, `${path}.startedAt`);
  if (row.endedAt !== null && num(row.endedAt, `${path}.endedAt`) < (row.startedAt as number)) fail(`${path}.endedAt`);
  const summary = object(row.summary, `${path}.summary`);
  for (const [key, value] of Object.entries(summary)) {
    if (value !== null && typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value))) fail(`${path}.summary.${key}`);
  }
  return { ...row, calibration: calibration(row.calibration, `${path}.calibration`) } as unknown as SessionRecord;
}
function node(row: Row, i: number): OpeningNodeStat {
  const path = `openingNodes[${i}]`; owner(row, path);
  str(row.repertoireId, `${path}.repertoireId`); str(row.path, `${path}.path`, true);
  str(row.expectedSan, `${path}.expectedSan`); num(row.updatedAt, `${path}.updatedAt`);
  if (!Array.isArray(row.samples) || row.samples.length > 100_000) fail(`${path}.samples`);
  row.samples.forEach((v, n) => num(v, `${path}.samples[${n}]`));
  return row as unknown as OpeningNodeStat;
}
function profile(value: unknown): Profile {
  const row = object(value, 'profile'); str(row.id, 'profile.id');
  const name = str(row.name, 'profile.name');
  if (!validateName(name).ok || row.nameKey !== nameKeyOf(name)) fail('profile.name');
  num(row.createdAt, 'profile.createdAt'); num(row.lastSeenAt, 'profile.lastSeenAt');
  return row as unknown as Profile;
}
function game(row: Row, i: number): GameRecord {
  const path = `games[${i}]`; str(row.profileId, `${path}.profileId`);
  num(row.startedAt, `${path}.startedAt`); num(row.updatedAt, `${path}.updatedAt`);
  if (!['white', 'black'].includes(String(row.userColor))) fail(`${path}.userColor`);
  if (!['live', 'finished'].includes(String(row.status))) fail(`${path}.status`);
  if (!['*', '1-0', '0-1', '1/2-1/2'].includes(String(row.result))) fail(`${path}.result`);
  str(row.resultLabel, `${path}.resultLabel`, true);
  const bot = object(row.bot, `${path}.bot`);
  for (const key of ['id', 'name', 'kind']) str(bot[key], `${path}.bot.${key}`);
  if (bot.rating !== null) num(bot.rating, `${path}.bot.rating`);
  const tc = object(row.timeControl, `${path}.timeControl`);
  str(tc.id, `${path}.timeControl.id`); str(tc.label, `${path}.timeControl.label`);
  if (tc.initialMs !== null) num(tc.initialMs, `${path}.timeControl.initialMs`);
  num(tc.incrementMs, `${path}.timeControl.incrementMs`);
  if (row.clockLeftMs !== null) {
    const clocks = object(row.clockLeftMs, `${path}.clockLeftMs`);
    num(clocks.white, `${path}.clockLeftMs.white`); num(clocks.black, `${path}.clockLeftMs.black`);
  }
  if (!Array.isArray(row.moves) || row.moves.length > 10_000) fail(`${path}.moves`);
  try {
    const pos = posFromFen(str(row.initialFen, `${path}.initialFen`));
    for (const [n, value] of row.moves.entries()) {
      const move = object(value, `${path}.moves[${n}]`);
      num(move.spentMs, `${path}.moves[${n}].spentMs`);
      if (move.clockLeftMs !== null) num(move.clockLeftMs, `${path}.moves[${n}].clockLeftMs`);
      str(move.san, `${path}.moves[${n}].san`);
      const parsed = moveFromUci(str(move.uci, `${path}.moves[${n}].uci`));
      if (!pos.isLegal(parsed)) fail(`${path}.moves[${n}].uci`);
      move.san = makeSan(pos, parsed);
      pos.play(parsed);
    }
    if (fenOf(pos) !== fenOf(posFromFen(str(row.fen, `${path}.fen`)))) fail(`${path}.fen`);
  } catch (e) { throw new Error(`${path}: ${(e as Error).message}`); }
  const result = row as unknown as GameRecord;
  return { ...result, pgn: buildPgn(result) };
}

/** Validate the entire file before any IndexedDB write; v1 remains readable. */
export function parseBundle(text: string): ExportBundle {
  if (text.length > MAX_BACKUP_BYTES || new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new Error('Файл больше 30 МБ');
  const raw = object(JSON.parse(text), 'JSON');
  if (raw.app !== 'sciencechess-hyperlab') throw new Error('Чужой формат: поле app не совпадает');
  const sessions = entries(raw.sessions, 'sessions').map(session);
  const measurements = entries(raw.measurements, 'measurements').map(measurement);
  if (raw.version !== 1 && raw.version !== 2) throw new Error('Неподдерживаемая версия резервной копии');
  const openingNodes = entries(raw.openingNodes ?? [], 'openingNodes').map(node);
  const games = entries(raw.games ?? [], 'games').map(game);
  const source = raw.profile === undefined ? undefined : profile(raw.profile);
  if (raw.version === 2 && (!source || !Array.isArray(raw.games))) fail('profile/games');
  if (source && [...sessions, ...measurements, ...openingNodes, ...games].some(r => r.profileId !== source.id)) fail('profileId');
  return {
    app: 'sciencechess-hyperlab', version: raw.version,
    exportedAt: num(raw.exportedAt, 'exportedAt'),
    calibration: calibration(raw.calibration, 'calibration'),
    profile: source, sessions, measurements, openingNodes, games,
  };
}
