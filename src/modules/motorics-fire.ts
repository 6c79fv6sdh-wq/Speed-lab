/** Bounded decorative sampling, independent of the recorded pointer measurements. */
export const MAX_FIRE_PARTICLES = 18;
const PARTICLE_SPACING = [14, 22, 17, 25, 19];
interface Point { x: number; y: number }
export interface FireAnchor extends Point { angle: number }

export function traceFireAnchors(points: readonly Point[]): FireAnchor[] {
  const anchors: FireAnchor[] = [];
  let travelled = 0;
  let next = 8;
  for (let i = points.length - 1; i > 0 && anchors.length < MAX_FIRE_PARTICLES; i--) {
    const end = points[i];
    const start = points[i - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) continue;
    while (next <= travelled + length && anchors.length < MAX_FIRE_PARTICLES) {
      const fraction = (next - travelled) / length;
      anchors.push({ x: end.x - dx * fraction, y: end.y - dy * fraction, angle: Math.atan2(dy, dx) * 180 / Math.PI });
      next += PARTICLE_SPACING[(anchors.length - 1) % PARTICLE_SPACING.length];
    }
    travelled += length;
  }
  return anchors;
}
