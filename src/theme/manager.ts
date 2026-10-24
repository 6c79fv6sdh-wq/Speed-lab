export interface UiTheme { id: string; label: string }
interface ThemeBootstrap { themes: readonly UiTheme[]; apply(value: string, persist: boolean): boolean }
declare global { interface Window { chesslabUiTheme?: ThemeBootstrap } }
// Optional styles are discovered, not directly imported: deleting a theme file
// cannot leave a broken import or a request for a missing stylesheet.
const themeFiles = import.meta.glob('./themes/*.css', { eager: true });
export function availableUiThemes(): readonly UiTheme[] {
  return (window.chesslabUiTheme?.themes ?? [{ id: 'classic', label: 'Classic Dark' }])
    .filter(theme => theme.id === 'classic' || Object.hasOwn(themeFiles, `./themes/${theme.id}.css`));
}
export function resolveUiTheme(value: unknown, available: readonly UiTheme[] = availableUiThemes()): string {
  return available.some(theme => theme.id === value) ? String(value) : available[0]?.id ?? 'classic';
}
export function currentUiTheme(): string {
  return resolveUiTheme(document.documentElement.getAttribute('data-ui-theme'));
}
export function setUiTheme(value: string): boolean {
  const theme = resolveUiTheme(value);
  if (window.chesslabUiTheme) return window.chesslabUiTheme.apply(theme, true);
  document.documentElement.setAttribute('data-ui-theme', 'classic');
  return false;
}
export function initializeUiTheme(): void {
  const raw = document.documentElement.getAttribute('data-ui-theme');
  if (raw !== currentUiTheme()) setUiTheme(currentUiTheme());
}
