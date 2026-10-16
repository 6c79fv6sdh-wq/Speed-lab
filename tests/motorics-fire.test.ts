import { describe, expect, it } from 'vitest';
import { MAX_FIRE_PARTICLES, traceFireAnchors } from '../src/modules/motorics-fire';

describe('decorative fire sampling', () => {
  it('caps particles even on a long trace and leaves the measurements unchanged', () => {
    const points = Object.freeze([Object.freeze({x:0,y:0}), Object.freeze({x:10000,y:0})]);
    const anchors = traceFireAnchors(points);
    expect(anchors).toHaveLength(MAX_FIRE_PARTICLES);
    expect(anchors[0]).toEqual({x:9992,y:0,angle:0});
    expect(points[1].x).toBe(10000);
  });

  it('uses travelled distance through bends, regardless of input event density', () => {
    const anchors = traceFireAnchors([{x:0,y:0},{x:30,y:0},{x:30,y:30}]);
    expect(anchors).toHaveLength(3);
    expect(anchors[0].x).toBe(30);
    expect(anchors[0].y).toBeCloseTo(22);
    expect(anchors[0].angle).toBe(90);
    expect(anchors[2].x).toBeCloseTo(16);
    expect(anchors[2].y).toBe(0);
    expect(anchors[2].angle).toBe(0);
    const dense = [{x:0,y:0},{x:10,y:0},{x:20,y:0},{x:30,y:0},{x:30,y:10},{x:30,y:20},{x:30,y:30}];
    expect(traceFireAnchors(dense)).toEqual(anchors);
  });

  it('handles a stationary pointer and repeated samples without invalid coordinates', () => {
    expect(traceFireAnchors([])).toEqual([]);
    expect(traceFireAnchors([{x:1,y:1},{x:1,y:1}])).toEqual([]);
    expect(traceFireAnchors([{x:0,y:0},{x:30,y:0},{x:30,y:0}])[0]).toEqual({x:22,y:0,angle:0});
  });
});
