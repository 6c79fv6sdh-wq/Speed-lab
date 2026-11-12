/** Visual preferences only. No pointer sampling, scoring or exercise state. */
export const TRACE_STYLES={fire:'Огненная',ice:'Ледяная',wind:'Ветреная'} as const;
export type TraceStyle=keyof typeof TRACE_STYLES;
export const traceStyle=(value:unknown):TraceStyle=>typeof value==='string'&&Object.hasOwn(TRACE_STYLES,value)?value as TraceStyle:'fire';
export const TRACE_DECORATIONS={
 ice:['M0 -9 4 0 0 9 -4 0Z','M-7 0H7 M0 -7V7 M-4 -4 4 4 M-4 4 4 -4'],
 wind:['M-12 -4 C-5 -10 5 -10 10 -4 C14 1 7 4 5 0','M-15 3 C-6 -2 2 -2 8 3','M-8 9 C-3 5 5 5 12 8'],
} as const;
