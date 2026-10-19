import type { Api } from 'chessground/api';

interface TouchOptions {
  scroll: boolean;
  onTap?: (clientX: number, clientY: number) => void;
}

/** Let the browser scroll; only a drag starting on an available piece owns the gesture. */
export function installTouchInput(wrap: HTMLElement, api: Api, options: () => TouchOptions) {
  let gesture: { id: number; x: number; y: number; moved: boolean; fen: string; orientation: string } | null = null;
  const keyAt = (x: number, y: number) => {
    api.state.dom.bounds.clear();
    return api.getKeyAtDomPos([x, y]);
  };
  function startsDrag(x: number, y: number): boolean {
    const state = api.state;
    const key = keyAt(x, y);
    const piece = key ? state.pieces.get(key) : undefined;
    return !state.viewOnly && state.draggable.enabled && !!piece &&
      (state.movable.color === 'both' || state.movable.color === piece.color) &&
      (state.turnColor === piece.color || state.premovable.enabled);
  }
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'touch' && options().scroll && !startsDrag(event.clientX, event.clientY)) {
      // Exercise handlers must not submit an answer at the start of a swipe.
      event.stopPropagation();
    }
  };
  const onStart = (event: TouchEvent) => {
    gesture = null;
    if (!options().scroll) return;
    if (event.touches.length !== 1) { api.cancelMove(); event.stopPropagation(); return; }
    const touch = event.touches[0];
    if (startsDrag(touch.clientX, touch.clientY)) return;
    gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY, moved: false,
      fen: api.getFen(), orientation: api.state.orientation };
    // Skip Chessground's preventDefault on scrollable areas. No synthetic
    // mouse events: a short tap is submitted through its public selection API.
    event.stopPropagation();
  };
  const onMove = (event: TouchEvent) => {
    if (!gesture) return;
    const touch = Array.from(event.touches).find(touch => touch.identifier === gesture!.id);
    if (!touch || event.touches.length !== 1 || Math.hypot(touch.clientX - gesture.x, touch.clientY - gesture.y) > 8) gesture.moved = true;
    event.stopPropagation();
  };
  const onEnd = (event: TouchEvent) => {
    const current = gesture;
    if (!current) return;
    gesture = null;
    event.stopPropagation();
    const touch = Array.from(event.changedTouches).find(touch => touch.identifier === current.id);
    if (!touch || current.moved || Math.hypot(touch.clientX - current.x, touch.clientY - current.y) > 8) return;
    if (event.cancelable) event.preventDefault(); // suppress the compatibility mouse click
    if (!wrap.isConnected || !options().scroll || api.getFen() !== current.fen || api.state.orientation !== current.orientation) return;
    const key = keyAt(touch.clientX, touch.clientY);
    if (!key) return;
    options().onTap?.(touch.clientX, touch.clientY);
    if (!api.state.viewOnly) {
      const queued = api.state.premovable.current;
      api.selectSquare(key);
      if (queued && api.state.premovable.current === queued) api.cancelPremove();
    }
  };
  const onCancel = () => { gesture = null; };
  wrap.addEventListener('pointerdown', onPointerDown, true);
  wrap.addEventListener('touchstart', onStart, { capture: true, passive: true });
  wrap.addEventListener('touchmove', onMove, { capture: true, passive: true });
  wrap.addEventListener('touchend', onEnd, { capture: true, passive: false });
  wrap.addEventListener('touchcancel', onCancel, true);
  return {
    refresh() {
      const state = api.state;
      wrap.dataset.touchScroll = String(options().scroll);
      wrap.dataset.touchDragColor = !state.viewOnly && state.draggable.enabled
        ? state.movable.color ?? '' : '';
    },
    dispose() {
      gesture = null;
      wrap.removeEventListener('pointerdown', onPointerDown, true);
      wrap.removeEventListener('touchstart', onStart, true);
      wrap.removeEventListener('touchmove', onMove, true);
      wrap.removeEventListener('touchend', onEnd, true);
      wrap.removeEventListener('touchcancel', onCancel, true);
    },
  };
}
