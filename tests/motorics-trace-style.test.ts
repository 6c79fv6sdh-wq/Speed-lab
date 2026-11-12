import {it,expect} from 'vitest';
import {traceStyle,TRACE_STYLES,TRACE_DECORATIONS} from '../src/modules/motorics-trace-style';
it('accepts only registered styles and safely falls back to the original fire',()=>{
 expect(Object.keys(TRACE_STYLES)).toEqual(['fire','ice','wind']);for(const style of Object.keys(TRACE_STYLES))expect(traceStyle(style)).toBe(style);for(const value of [null,undefined,'unknown','__proto__','toString',{},1])expect(traceStyle(value)).toBe('fire');
});
it('uses distinct fixed SVG geometry for crystals and air currents',()=>{expect(TRACE_DECORATIONS.ice).toHaveLength(2);expect(TRACE_DECORATIONS.wind).toHaveLength(3);expect(TRACE_DECORATIONS.ice.join('')).toContain('Z');expect(TRACE_DECORATIONS.wind.every(d=>d.includes('C')&&!d.includes('Z'))).toBe(true);});
