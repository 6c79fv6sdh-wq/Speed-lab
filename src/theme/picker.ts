import { el, segmented } from '../core/ui';
import { availableUiThemes, currentUiTheme, setUiTheme } from './manager';
import './picker.css';
/** Keep the usual settings click; a hold/context menu/ArrowDown opens only
 * appearance controls, so the current exercise never has to unmount. */
export function installQuickThemePicker(trigger: HTMLButtonElement): () => void {
  let timer: number | undefined;
  let suppressClick = false;
  let origin: { x: number; y: number } | null = null;
  let dialog: HTMLDialogElement | null = null;
  const cancel = () => { window.clearTimeout(timer); timer = undefined; origin = null; };
  const close = () => { dialog?.close(); dialog?.remove(); dialog = null; };
  const open = () => {
    if (dialog) return;
    const picker = segmented(availableUiThemes().map(t => ({ value: t.id, label: t.label })), currentUiTheme(), value => {
      setUiTheme(value);
      close();
    });
    const title = el('h2', { id: 'ui-theme-dialog-title' }, ['Тема интерфейса']);
    const dismiss = el('button', { type: 'button', class: 'btn' }, ['Закрыть']);
    dismiss.addEventListener('click', close);
    dialog = el('dialog', { class: 'ui-theme-dialog', 'aria-labelledby': title.id }, [title, picker.root, dismiss]);
    dialog.addEventListener('cancel', () => { dialog?.remove(); dialog = null; });
    document.body.append(dialog);
    dialog.showModal();
  };
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || !event.isPrimary) return;
    cancel(); suppressClick = false; origin = { x: event.clientX, y: event.clientY };
    timer = window.setTimeout(() => { suppressClick = true; open(); }, 450);
  };
  const move = (event: PointerEvent) => {
    if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8) cancel();
  };
  const click = (event: MouseEvent) => {
    if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
  };
  const context = (event: MouseEvent) => { event.preventDefault(); cancel(); suppressClick = true; open(); };
  const key = (event: KeyboardEvent) => { if (event.key === 'ArrowDown') { event.preventDefault(); open(); } };
  trigger.title = 'Настройки · удерживай или нажми ↓ для смены темы';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.addEventListener('pointerdown', down);
  trigger.addEventListener('pointermove', move);
  trigger.addEventListener('pointerup', cancel);
  trigger.addEventListener('pointercancel', cancel);
  trigger.addEventListener('pointerleave', cancel);
  trigger.addEventListener('click', click, true);
  trigger.addEventListener('contextmenu', context);
  trigger.addEventListener('keydown', key);
  return () => {
    cancel(); close();
    trigger.removeEventListener('pointerdown', down); trigger.removeEventListener('pointermove', move);
    trigger.removeEventListener('pointerup', cancel); trigger.removeEventListener('pointercancel', cancel);
    trigger.removeEventListener('pointerleave', cancel); trigger.removeEventListener('click', click, true);
    trigger.removeEventListener('contextmenu', context); trigger.removeEventListener('keydown', key);
  };
}
