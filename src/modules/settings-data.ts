import { MAX_BACKUP_BYTES } from '../core/backup';
import type { AppContext, Unmount } from '../main';
import { el, panel } from '../core/ui';
import { clearMeasurements, exportBundle, importBundle, parseBundle, requestPersistentStorage, storageStatus } from '../core/db';

export function mountDataSettings(root: HTMLElement, ctx: AppContext, onImport: () => void): Unmount {
  let disposed = false;
  const storageHost = el('div', {});
  const ioStatus = el('div', { class: 'prompt' }, ['']);
  const jsonArea = el('textarea', {
    placeholder: 'Сюда попадает экспорт. Сюда же можно вставить JSON для импорта.',
    'aria-label': 'Резервная копия истории в JSON',
  }) as HTMLTextAreaElement;

  function showError(error: unknown): void {
    if (disposed) return;
    ioStatus.textContent = `Не удалось выполнить действие: ${error instanceof Error ? error.message : String(error)}`;
    ioStatus.className = 'prompt verdict-bad';
  }

  async function render(): Promise<void> { await renderStorage(); }

  async function renderStorage(): Promise<void> {
    const st = await storageStatus();
    if (disposed) return;
    const mb = (v: number | null) => (v === null ? '—' : `${(v / 1024 / 1024).toFixed(1)} МБ`);
    storageHost.innerHTML = '';
    storageHost.append(
      el('div', { class: 'stats' }, [
        el('div', { class: 'stat' }, [
          el('span', { class: 'stat-k' }, ['Постоянное хранение']),
          el('span', { class: 'stat-v' }, [
            !st.supported ? 'не поддерживается' : st.persistent ? 'включено' : 'выключено',
          ]),
        ]),
        el('div', { class: 'stat' }, [
          el('span', { class: 'stat-k' }, ['Занято']),
          el('span', { class: 'stat-v' }, [mb(st.usageBytes)]),
        ]),
      ]),
    );
    if (st.supported && !st.persistent) {
      const ask = el('button', { class: 'btn', type: 'button' }, ['Запросить постоянное хранение']);
      ask.addEventListener('click', () => {
        void requestPersistentStorage().then(() => renderStorage()).catch(showError);
      });
      storageHost.append(
        ask,
        el('p', { class: 'hint' }, [
          'Браузер может удалить локальную историю. Скачивай резервную копию, особенно перед сменой устройства или адреса сайта.',
        ]),
      );
    }
  }

  // --- Экспорт и импорт.
  const exportBtn = el('button', { class: 'btn', type: 'button' }, ['Экспорт в поле']);
  exportBtn.addEventListener('click', () => {
    void (async () => {
      const bundle = await exportBundle();
      jsonArea.value = JSON.stringify(bundle, null, 2);
      ioStatus.textContent = `Выгружено: сессий ${bundle.sessions.length}, замеров ${bundle.measurements.length}, партий ${bundle.games.length}.`;
      ioStatus.className = 'prompt verdict-ok';
    })().catch(showError);
  });

  const downloadBtn = el('button', { class: 'btn', type: 'button' }, ['Скачать файл']);
  downloadBtn.addEventListener('click', () => {
    void (async () => {
      const bundle = await exportBundle();
      const text = JSON.stringify(bundle, null, 2);
      jsonArea.value = text;
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = el('a', { href: url, download: `hyperlab-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      ioStatus.textContent = 'Файл отдан браузеру.';
      ioStatus.className = 'prompt verdict-ok';
    })().catch(showError);
  });

  const importAreaBtn = el('button', { class: 'btn primary', type: 'button' }, ['Импорт из поля']);
  importAreaBtn.addEventListener('click', () => {
    void doImport(jsonArea.value);
  });

  const fileInput = el('input', { type: 'file', accept: 'application/json,.json' }) as HTMLInputElement;
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      showError(new Error('Файл больше 30 МБ'));
      fileInput.value = '';
      return;
    }
    void file.text().then((text) => {
      if (disposed) return;
      jsonArea.value = text;
      return doImport(text);
    }).catch(showError);
    fileInput.value = '';
  });

  const importFileBtn = el('button', { class: 'btn', type: 'button' }, ['Импорт из файла']);
  importFileBtn.addEventListener('click', () => fileInput.click());

  async function doImport(text: string): Promise<void> {
    try {
      const bundle = parseBundle(text);
      const res = await importBundle(bundle);
      await ctx.setCalibration(bundle.calibration, false);
      onImport();
      ioStatus.textContent = `В твой профиль импортировано: сессий ${res.sessions}, замеров ${res.measurements}, узлов ${res.openingNodes}, партий ${res.games}. Настройки применены.`;
      ioStatus.className = 'prompt verdict-ok';
      await render();
    } catch (e) {
      ioStatus.textContent = `Импорт не прошёл: ${(e as Error).message}`;
      ioStatus.className = 'prompt verdict-bad';
    }
  }

  const clearBtn = el('button', { class: 'btn danger', type: 'button' }, ['Очистить измерения']);
  let armed = false;
  clearBtn.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      clearBtn.textContent = 'Точно очистить? Нажми ещё раз';
      window.setTimeout(() => {
        armed = false;
        clearBtn.textContent = 'Очистить измерения';
      }, 4000);
      return;
    }
    void (async () => {
      await clearMeasurements();
      armed = false;
      clearBtn.textContent = 'Очистить измерения';
      ioStatus.textContent = 'Измерения удалены. Настройки калибровки сохранены.';
      ioStatus.className = 'prompt verdict-ok';
      await render();
    })().catch(showError);
  });

  root.append(
    panel('Хранение на этом устройстве', [storageHost]),
    panel('Экспорт и импорт', [
      el('div', { class: 'row' }, [exportBtn, downloadBtn, importAreaBtn, importFileBtn, fileInput]),
      jsonArea, ioStatus,
      el('div', { class: 'row' }, [clearBtn]),
      el('p', { class: 'hint' }, [
        'Копия включает историю и партии текущего профиля. Импорт переносит её в твой активный профиль и применяет настройки из файла. ',
        'Очистка удаляет сессии, замеры и статистику дебютных узлов. Настройки калибровки остаются.',
      ]),
    ]),
  );
  void render().catch(showError);
  return () => { disposed = true; };
}
