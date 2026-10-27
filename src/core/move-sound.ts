/** A short, dry wooden click, synthesized locally with no downloads. */
const KEY = 'chesslab.move-sound';
let enabled: boolean | undefined;
let context: AudioContext | undefined;
type SoundKind = 'move' | 'choice' | 'answer';
let buffers: Partial<Record<SoundKind, AudioBuffer>> = {};
let lastInteraction = -Infinity;
let gesture: { id: number; x: number; y: number; kind?: 'choice' | 'answer' } | undefined;
let previous: AudioBufferSourceNode | undefined;
let listening = false;

export function moveSoundEnabled(): boolean {
  if (enabled === undefined) {
    try { enabled = localStorage.getItem(KEY) !== 'off'; } catch { enabled = true; }
  }
  return enabled;
}
export function setMoveSoundEnabled(value: boolean): void {
  enabled = value;
  if (!value) { try { previous?.stop(); } catch { /* Already ended. */ } }
  try { localStorage.setItem(KEY, value ? 'on' : 'off'); } catch { /* Keep the session preference. */ }
}
export function moveClickSamples(rate: number): Float32Array {
  const data = new Float32Array(Math.ceil(rate * .075));
  let seed = 43, lastNoise = 0;
  for (let i = 0; i < data.length; i++) {
    const t = i / rate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    const attack = Math.min(1, t / .0006);
    const tail = Math.min(1, (data.length - 1 - i) / (rate * .004));
    data[i] = .32 * attack * tail * (
      .5 * Math.sin(2 * Math.PI * 640 * t) * Math.exp(-t / .016) +
      .35 * Math.sin(2 * Math.PI * 1880 * t) * Math.exp(-t / .006) +
      .12 * (noise - lastNoise) * Math.exp(-t / .003));
    lastNoise = noise;
  }
  return data;
}
function audio(): AudioContext | undefined {
  if (!moveSoundEnabled() || typeof AudioContext === 'undefined') return;
  try {
    if (context?.state === 'closed') { context = undefined; buffers = {}; }
    return context ??= new AudioContext({ latencyHint: 'interactive' });
  } catch { return; }
}
/** Unlock during a real gesture, before Chessground's deferred move callback. */
export function initializeMoveSound(): void {
  if (listening) return;
  listening = true;
  const unlock = () => {
    const ctx = audio();
    if (ctx && ctx.state !== 'running' && ctx.state !== 'closed') void ctx.resume().catch(() => {});
  };
  document.addEventListener('pointerdown', event => {
    unlock();
    if (event.isPrimary && event.button === 0) gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }, { capture: true, passive: true });
  document.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const pending = gesture;gesture = undefined;
    if (pending.kind && Math.hypot(event.clientX - pending.x, event.clientY - pending.y) <= 10) playInteractionSound(pending.kind);
  }, { capture: true, passive: true });
  document.addEventListener('pointercancel', () => { gesture = undefined; }, { capture: true });
  window.addEventListener('blur', () => { gesture = undefined; });
  document.addEventListener('keydown', unlock, { capture: true });
  const usable = (node: Element) => !node.closest(':disabled,[aria-disabled="true"],[inert]');
  document.addEventListener('click', event => {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    const target = event.target.closest('button,a[href],summary,[role="button"]');
    // Pointer-driven exercise boards emit at their accepted-action boundary.
    if (!target || target.matches('.ks-board') || !usable(target)) return;
    const kind = target instanceof HTMLButtonElement && target.type === 'submit' ? 'answer' : 'choice';
    // Let exercise handlers take their response timestamp before creating audio.
    queueMicrotask(() => playInteractionSound(kind, false));
  }, { capture: true });
  const values = new WeakMap<HTMLInputElement, string>();
  document.addEventListener('input', event => {
    const target = event.target;
    if (!event.isTrusted || !(target instanceof HTMLInputElement) || target.type !== 'range' || !usable(target)) return;
    if (values.get(target) === target.value) return;
    values.set(target, target.value);playInteractionSound('choice', false);
  }, { capture: true });
  document.addEventListener('change', event => {
    const target = event.target;
    if (!event.isTrusted || !(target instanceof HTMLInputElement || target instanceof HTMLSelectElement) || !usable(target)) return;
    if (target instanceof HTMLSelectElement || ['checkbox', 'radio', 'number'].includes(target.type)) playInteractionSound('choice', false);
  }, { capture: true });
}
/** Coalesce pointer-up, compatibility click and input/change from one action. */
export function playInteractionSound(kind: 'choice' | 'answer' = 'choice', deferUntilRelease = true): void {
  if (gesture && deferUntilRelease) { gesture.kind = kind;return; }
  const now = performance.now();
  if (now - lastInteraction < 40) return;
  lastInteraction = now;
  playSound(kind);
}
export function playMoveSound(): void { lastInteraction = performance.now();playSound('move'); }
function playSound(kind: SoundKind): void {
  if (!moveSoundEnabled() || document.hidden) return;
  const ctx = audio();
  // Never queue a delayed click that could play when a later gesture unlocks audio.
  if (!ctx || ctx.state !== 'running') return;
  try {
    let buffer = buffers[kind];
    if (!buffer) {
      const samples = moveClickSamples(ctx.sampleRate);
      if (kind !== 'move') for (let i = 0; i < samples.length; i++) samples[i] *= kind === 'choice' ? .55 : .8;
      buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
      buffer.getChannelData(0).set(samples);buffers[kind] = buffer;
    }
    try { previous?.stop(); } catch { /* Already ended. */ }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    if (source.playbackRate) source.playbackRate.value = kind === 'choice' ? 1.3 : kind === 'answer' ? .9 : 1;
    source.connect(ctx.destination);
    source.onended = () => source.disconnect();
    previous = source;
    source.start();
  } catch { /* Sound must never interrupt a move. */ }
}
