/** Keep each failed write available for retry, including failures in several modules. */
const retries = new Set<() => Promise<void>>();

export function reportStorageError(error: unknown, retry?: () => Promise<void>): void {
  console.error('Не удалось сохранить данные', error);
  if (typeof document === 'undefined') return;
  let notice = document.getElementById('storage-error');
  if (!notice) {
    retries.clear();
    notice = document.createElement('div');
    notice.id = 'storage-error';
    notice.setAttribute('role', 'alert');
    document.body.append(notice);
  }
  if (retry) retries.add(retry);
  render(notice);
}

function render(notice: HTMLElement): void {
  notice.replaceChildren();
  const text = document.createElement('span');
  text.textContent = 'Не удалось сохранить историю на устройстве. Проверь свободное место и скачай резервную копию. Не закрывай страницу с несохранённой партией.';
  notice.append(text);
  if (!retries.size) return;
  const button = document.createElement('button');
  button.className = 'btn';
  button.textContent = 'Повторить сохранение';
  button.addEventListener('click', () => {
    button.disabled = true;
    void (async () => {
      for (const retry of [...retries]) {
        try { await retry(); retries.delete(retry); }
        catch (error) { console.error('Повторное сохранение не удалось', error); }
      }
      if (retries.size) render(notice);
      else notice.remove();
    })();
  });
  notice.append(button);
}
