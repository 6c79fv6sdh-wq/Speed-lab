/* Parser-blocking theme bootstrap: one registry, no UI or chess dependencies. */
(function () {
  'use strict';
  var themes = Object.freeze([
    { id: 'classic', label: 'Classic Dark' },
    { id: 'brilliant', label: 'Brilliant Dark' }
  ]);
  var key = 'chesslab.theme';
  function resolve(value) {
    return themes.some(function (theme) { return theme.id === value; }) ? value : 'classic';
  }
  function apply(value, persist) {
    var theme = resolve(value);
    var previous = document.documentElement.getAttribute('data-ui-theme');
    document.documentElement.setAttribute('data-ui-theme', theme);
    var saved = true;
    if (persist) {
      try { localStorage.setItem(key, theme); } catch (_) { saved = false; }
    }
    if (theme !== previous) window.dispatchEvent(new CustomEvent('chesslab-theme-change', { detail: theme }));
    return saved;
  }
  var stored = null;
  try { stored = localStorage.getItem(key); } catch (_) {}
  apply(stored, stored !== null && resolve(stored) !== stored);
  window.chesslabUiTheme = Object.freeze({ themes: themes, apply: apply });
  window.addEventListener('storage', function (event) {
    if (event.key === key) apply(event.newValue, false);
  });
})();
