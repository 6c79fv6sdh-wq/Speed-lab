import {beforeEach,afterEach,it,expect,vi} from 'vitest';
beforeEach(()=>{localStorage.clear();vi.resetModules();});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
it('produces a short bounded click with silent endpoints at common sample rates',async()=>{
 const {moveClickSamples}=await import('../src/core/move-sound');
 for(const rate of [22050,44100,48000]){
  const data=moveClickSamples(rate);expect(data.length).toBe(Math.ceil(rate*.075));
  expect(data[0]).toBe(0);expect(Math.abs(data.at(-1)!)).toBe(0);
  expect(Math.max(...data.map(Math.abs))).toBeLessThan(.4);
  expect(data.some(v=>Math.abs(v)>.1)).toBe(true);
 }
});
it('defaults on, persists mute and survives unavailable local storage and audio',async()=>{
 const m=await import('../src/core/move-sound');expect(m.moveSoundEnabled()).toBe(true);
 m.setMoveSoundEnabled(false);expect(localStorage.getItem('chesslab.move-sound')).toBe('off');
 vi.resetModules();const reload=await import('../src/core/move-sound');expect(reload.moveSoundEnabled()).toBe(false);
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('blocked');});
 reload.setMoveSoundEnabled(true);expect(reload.moveSoundEnabled()).toBe(true);
 vi.stubGlobal('AudioContext',undefined);expect(()=>reload.playMoveSound()).not.toThrow();
});
it('unlocks on a gesture, reuses one buffer and never queues suspended or muted clicks',async()=>{
 const start=vi.fn(),stop=vi.fn(),createBuffer=vi.fn((_channels:number,n:number)=>({getChannelData:()=>new Float32Array(n)}));
 const ctx={state:'suspended',sampleRate:48000,destination:{},createBuffer,createBufferSource:()=>({connect:vi.fn(),disconnect:vi.fn(),start,stop}),resume:vi.fn(async()=>{ctx.state='running';})};
 vi.stubGlobal('AudioContext',vi.fn(function(){return ctx;}));
 const m=await import('../src/core/move-sound');m.playMoveSound();expect(start).not.toHaveBeenCalled();
 m.initializeMoveSound();m.initializeMoveSound();document.dispatchEvent(new Event('pointerdown'));await Promise.resolve();expect(ctx.resume).toHaveBeenCalledTimes(1);
 m.playMoveSound();m.playMoveSound();expect(start).toHaveBeenCalledTimes(2);expect(createBuffer).toHaveBeenCalledTimes(1);
 m.setMoveSoundEnabled(false);m.playMoveSound();expect(start).toHaveBeenCalledTimes(2);
 m.setMoveSoundEnabled(true);vi.spyOn(document,'hidden','get').mockReturnValue(true);m.playMoveSound();expect(start).toHaveBeenCalledTimes(2);
});
