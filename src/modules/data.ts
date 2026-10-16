import type { AppContext, Unmount } from '../main';
import { disclosure, el, panel, table } from '../core/ui';
import { fmtMs, fmtNum, fmtPct } from '../core/stats';
import {
  allMeasurements,
  allOpeningNodes,
  allSessions,
  type MeasurementRecord,
  type ModuleId,
  type OpeningNodeStat,
  type SessionRecord,
} from '../core/db';
import {
  MODULE_LABELS,
  motoricsBreakdown,
  slowestNodes,
  summarizeAll,
  summarizeModule,
  type SummaryRow,
} from './data-summary';
import { REPERTOIRES } from '../data/repertoire';
import { PREMOVE_MODE_LABELS } from '../data/premove-positions';

function sessionModeLabel(session: SessionRecord): string {
  const mode = session.mode.split(':')[0];
  const labels: Record<string, string> = {
    'source-target': 'Вектор', signal: 'Сигнал',
    ...PREMOVE_MODE_LABELS,
    'free-capture': 'Что висит?', 'mate-in-1': 'Мат в 1', 'safe-check': 'Шах',
    'delta-from': 'Откуда', 'delta-to': 'Куда', 'knight-scan': 'Скан конём', snapshot: 'Snapshot',
  };
  if (mode.startsWith('route-')) return 'Маршрут';
  return labels[mode] ?? REPERTOIRES.find(r => r.id === session.mode)?.label ?? MODULE_LABELS[session.module];
}

function summaryTable(rows: SummaryRow[], firstHeader: string, detailed = true): HTMLElement {
  return table(
    [firstHeader, 'Попыток', detailed ? 'Медиана' : 'Время', ...(detailed ? ['P90'] : []), 'Точность'],
    rows.map((r) => [
      r.key,
      String(r.attempts),
      fmtMs(r.medianMs),
      ...(detailed ? [fmtMs(r.p90Ms)] : []),
      r.accuracy === null ? '—' : fmtPct(r.accuracy),
    ]),
  );
}

export function mountData(root: HTMLElement, _ctx: AppContext): Unmount {
  let disposed = false;
  root.append(el('h1', {}, ['Прогресс']));

  const overviewHost = el('div', {});
  const detailedOverviewHost = el('div', {});
  const perModuleHost = el('div', {});
  const motoricsHost = el('div', {});
  const openingsHost = el('div', {});
  const sessionsHost = el('div', {});
  const errorHost = el('p', { role: 'alert' });
  function showError(error: unknown): void {
    if (!disposed) errorHost.textContent = error instanceof Error ? error.message : String(error);
  }

  async function render(): Promise<void> {
    const [measurements, sessions, nodes] = await Promise.all([
      allMeasurements(),
      allSessions(),
      allOpeningNodes(),
    ]);
    if (disposed) return;
    renderOverview(measurements);

    renderPerModule(measurements);
    renderMotorics(measurements);
    renderOpenings(nodes);
    renderSessions(sessions);
  }

  function renderOverview(measurements: MeasurementRecord[]): void {
    overviewHost.innerHTML = '';
    const rows = summarizeAll(measurements);
    overviewHost.append(summaryTable(rows, 'Модуль', false));
    detailedOverviewHost.replaceChildren(summaryTable(rows, 'Модуль'));
    if (!rows.length) {
      overviewHost.append(el('p', { class: 'hint' }, ['Замеров пока нет. Пройди любую сессию.']));
    }
  }

  function renderPerModule(measurements: MeasurementRecord[]): void {
    perModuleHost.innerHTML = '';
    for (const mod of Object.keys(MODULE_LABELS) as ModuleId[]) {
      const rows = summarizeModule(measurements, mod);
      if (!rows.length) continue;
      perModuleHost.append(el('h3', {}, [MODULE_LABELS[mod]]), summaryTable(rows, 'Режим'));
    }
  }

  function renderMotorics(measurements: MeasurementRecord[]): void {
    motoricsHost.innerHTML = '';
    const axes: Array<[string, 'boardSize' | 'distance' | 'direction']> = [
      ['По размеру доски', 'boardSize'],
      ['По расстоянию в клетках', 'distance'],
      ['По направлению', 'direction'],
    ];
    let any = false;
    for (const [title, axis] of axes) {
      const rows = motoricsBreakdown(measurements, axis);
      if (!rows.length) continue;
      any = true;
      motoricsHost.append(
        el('h3', {}, [title]),
        table(
          [title.replace('По ', ''), 'Попыток', 'Медиана', 'P90', 'Без промахов', 'Эффект.', 'Коррекций'],
          rows.map((r) => [
            r.key,
            String(r.attempts),
            fmtMs(r.medianMs),
            fmtMs(r.p90Ms),
            r.accuracy === null ? '—' : fmtPct(r.accuracy),
            fmtNum(r.pathEfficiency, 2),
            fmtNum(r.corrections, 1),
          ]),
        ),
      );
    }
    if (!any) motoricsHost.append(el('p', { class: 'hint' }, ['Замеров моторики пока нет.']));
  }

  function renderOpenings(nodes: OpeningNodeStat[]): void {
    openingsHost.innerHTML = '';
    const rows = slowestNodes(nodes);
    const label = (id: string) => REPERTOIRES.find((r) => r.id === id)?.label ?? id;
    openingsHost.append(
      table(
        ['Репертуар', 'Позиция до хода', 'Ход', 'Замеров', 'Медиана'],
        rows.map((r) => [
          label(r.repertoireId),
          r.path || '(начало)',
          r.expectedSan,
          String(r.samples),
          fmtMs(r.medianMs),
        ]),
      ),
    );
  }

  function renderSessions(sessions: SessionRecord[]): void {
    sessionsHost.innerHTML = '';
    const rows = [...sessions]
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, 25)
      .map((s) => [
        new Date(s.startedAt).toLocaleString('ru-RU'),
        MODULE_LABELS[s.module] ?? s.module,
        sessionModeLabel(s),
        String(s.summary.reps ?? s.summary.attempts ?? s.summary.nodes ?? s.summary.moves ?? '—'),
        String(s.summary.outcomeLabel ?? ''),
      ]);
    sessionsHost.append(table(['Начало', 'Модуль', 'Режим', 'Замеров', 'Исход'], rows));
  }

  root.append(
    errorHost,
    panel('Сводка по модулям', [overviewHost]),
    panel('Последние сессии', [sessionsHost]),
    disclosure('Подробная статистика', [
      panel('Сводка по модулям', [detailedOverviewHost]),
      panel('По режимам', [perModuleHost]),
      panel('Моторика в разрезах', [motoricsHost]),
      panel('Дебюты: самые медленные узлы', [openingsHost]),
    ]),
  );
  void render().catch(showError);
  return () => { disposed = true; };
}
