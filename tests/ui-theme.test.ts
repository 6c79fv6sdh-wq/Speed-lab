import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {availableUiThemes,currentUiTheme,initializeUiTheme,resolveUiTheme,setUiTheme} from '../src/theme/manager';
const bootstrap=readFileSync('public/ui-theme.js','utf8');
const boot=(code=bootstrap)=>new Function(code)();
beforeEach(()=>{localStorage.clear();document.documentElement.removeAttribute('data-ui-theme');delete window.chesslabUiTheme;vi.spyOn(window,'addEventListener').mockImplementation(()=>{});});
afterEach(()=>{vi.restoreAllMocks();delete window.chesslabUiTheme;document.documentElement.removeAttribute('data-ui-theme');});
describe('independent interface themes',()=>{
 it('defaults to Classic and safely repairs an unsupported saved value',()=>{boot();expect(currentUiTheme()).toBe('classic');localStorage.setItem('chesslab.theme','unknown');boot();expect(currentUiTheme()).toBe('classic');expect(localStorage.getItem('chesslab.theme')).toBe('classic');});
 it('switches immediately, persists on reload and never touches board settings or application state',()=>{
  localStorage.setItem('calibration','unchanged');boot();const child=document.createElement('div');document.body.append(child);const style=document.documentElement.style;style.setProperty('--sq-light','#f0d9b5');
  expect(setUiTheme('brilliant')).toBe(true);expect(currentUiTheme()).toBe('brilliant');boot();expect(currentUiTheme()).toBe('brilliant');expect(style.getPropertyValue('--sq-light')).toBe('#f0d9b5');expect(child.isConnected).toBe(true);expect(localStorage.getItem('calibration')).toBe('unchanged');setUiTheme('classic');expect(currentUiTheme()).toBe('classic');child.remove();style.removeProperty('--sq-light');
 });
 it('keeps working in memory if localStorage reads and writes are blocked',()=>{vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw Error('blocked');});vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('blocked');});expect(()=>boot()).not.toThrow();expect(currentUiTheme()).toBe('classic');expect(setUiTheme('brilliant')).toBe(false);expect(currentUiTheme()).toBe('brilliant');});
 it('falls back after removal from the single registry, even with a saved Brilliant choice',()=>{
  localStorage.setItem('chesslab.theme','brilliant');boot(bootstrap.replace("{ id: 'classic', label: 'Classic Dark' },\n    { id: 'brilliant', label: 'Brilliant Dark' }","{ id: 'classic', label: 'Classic Dark' }"));initializeUiTheme();expect(currentUiTheme()).toBe('classic');expect(availableUiThemes().map(t=>t.id)).toEqual(['classic']);expect(localStorage.getItem('chesslab.theme')).toBe('classic');
 });
 it('rejects a missing stylesheet and a missing bootstrap without loading anything',()=>{
  expect(resolveUiTheme('brilliant',[{id:'classic',label:'Classic Dark'}])).toBe('classic');document.documentElement.setAttribute('data-ui-theme','brilliant');initializeUiTheme();expect(currentUiTheme()).toBe('classic');expect(availableUiThemes()).toHaveLength(1);
 });
});
it('Brilliant text and controls meet WCAG AA palette contrast',()=>{
 const css=readFileSync('src/theme/themes/brilliant.css','utf8');
 const token=(name:string)=>css.match(new RegExp(`--${name}: (#[0-9a-f]{6});`))![1];
 const lum=(hex:string)=>{const c=hex.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
 for(const [fg,bg] of [['text-primary','bg-panel'],['text-secondary','control-bg'],['text-muted','bg-panel'],['text-primary','control-bg-active'],['text-on-accent','accent-primary'],['state-success','bg-panel'],['state-error','bg-panel'],['state-warning','bg-panel']]){
  const a=lum(token(fg)),b=lum(token(bg));expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05),`${fg} / ${bg}`).toBeGreaterThanOrEqual(4.5);
 }
});
