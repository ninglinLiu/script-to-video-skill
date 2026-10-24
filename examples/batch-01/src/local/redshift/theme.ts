import {clamp01} from '../../upstream/anim';
import '../../upstream/vox/theme';

/** 红黑穿梭：克制的黑、冷白、洋红，文字用已有 OFL 本地字体。 */
export const R = {black: '#08080b', paper: '#f1f0ee', red: '#e6284e', pink: '#ffb5c3', silver: '#d9e4e8'};
export const RF = {en: 'Vox Anton', cn: 'Vox Heavy', serif: 'Vox Playfair', mono: 'Consolas, monospace'};
export const ramp = (f: number, a: number, b: number) => clamp01((f-a)/(b-a));
export const smooth = (v: number) => {const t=clamp01(v); return t*t*(3-2*t);};
export const out = (v: number) => 1-Math.pow(1-clamp01(v),4);
export type V3 = [number,number,number];
/** 三维旋转与透视投影，近裁剪保证穿越镜头时不会出现无穷值。 */
export const rotate = ([x,y,z]: V3, ay: number, ax: number, az=0): V3 => {
  const a=x*Math.cos(ay)+z*Math.sin(ay), b=-x*Math.sin(ay)+z*Math.cos(ay);
  const c=y*Math.cos(ax)-b*Math.sin(ax), d=y*Math.sin(ax)+b*Math.cos(ax);
  return [a*Math.cos(az)-c*Math.sin(az),a*Math.sin(az)+c*Math.cos(az),d];
};
export const project = ([x,y,z]: V3, focal=1150) => {const s=focal/Math.max(110,focal+z); return {x:x*s,y:y*s,s,z};};
