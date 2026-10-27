/** A short, dry wooden click, synthesized locally with no downloads. */
const KEY = 'chesslab.move-sound';
let enabled: boolean | undefined;
let context: AudioContext | undefined;
let buffer: AudioBuffer | undefined;
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
    if (context?.state === 'closed') { context = undefined; buffer = undefined; }
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
  document.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  document.addEventListener('keydown', unlock, { capture: true });
}
export function playMoveSound(): void {
  if (!moveSoundEnabled() || document.hidden) return;
  const ctx = audio();
  // Never queue a delayed click that could play when a later gesture unlocks audio.
  if (!ctx || ctx.state !== 'running') return;
  try {
    if (!buffer) {
      const samples = moveClickSamples(ctx.sampleRate);
      buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
      buffer.getChannelData(0).set(samples);
    }
    try { previous?.stop(); } catch { /* Already ended. */ }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => source.disconnect();
    previous = source;
    source.start();
  } catch { /* Sound must never interrupt a move. */ }
}
