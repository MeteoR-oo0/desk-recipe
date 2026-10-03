import type { ProductLabel, TextEffects, LabelFrame } from "../types/project";
import type { Box } from "./arrowGeometry";
export type AppearanceObstacle = Box & {id?:string;framePadding?:number};
export function frameObstacles(boxes: AppearanceObstacle[], currentId: string): Box[] {
  return boxes.map(b=>{
    const padding = b.id === currentId ? 0 : b.framePadding ?? 0;
    return {x:b.x-padding,y:b.y-padding,width:b.width+padding*2,height:b.height+padding*2};
  });
}

export const DEFAULT_TEXT_EFFECTS: Required<TextEffects> = {
  shadowEnabled: true, shadowColor: "#000000", shadowBlur: 5,
  shadowOpacity: 0.4, shadowOffsetX: 0, shadowOffsetY: 0,
  outlineEnabled: false, outlineColor: "#202a25", outlineWidth: 1,
};
export function textEffects(label: ProductLabel) { return { ...DEFAULT_TEXT_EFFECTS, ...label.textEffects }; }
export function arrowEffects(label: ProductLabel) { return {...DEFAULT_TEXT_EFFECTS,shadowEnabled:false,...label.arrowEffects}; }
export function applyFrameToAll(labels: ProductLabel[], source: ProductLabel) {
  const frame=frameSettings(source);
  return labels.map(label=>({...label,frame:{...frame},boxWidth:source.boxWidth??330,boxExtraHeight:source.boxExtraHeight??0}));
}
export function frameSettings(label: ProductLabel): Required<LabelFrame> {
  const style = label.frame?.style ?? "none";
  return { style, fillColor: style === "glass" ? "#ffffff" : "#202a25", opacity: style === "glass" ? 0.22 : 0.65, borderColor: "#ffffff", borderWidth: style === "fill" ? 0 : 1, radius: 12, blur: 10, ...label.frame };
}
export function rgba(color: string, opacity: number) {
  return `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},${opacity})`;
}
const finite = (n: unknown, lo: number, hi: number) => typeof n === "number" && Number.isFinite(n) && n >= lo && n <= hi;
const color = (v: unknown) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
export function validAppearance(label: { textEffects?: unknown; arrowEffects?: unknown; frame?: unknown; arrowEnd?: unknown; arrowEndSize?: unknown }) {
  if(label.arrowEnd!==undefined && !["arrow","open-circle","filled-circle","none"].includes(label.arrowEnd as string)) return false;
  if(label.arrowEndSize!==undefined && !finite(label.arrowEndSize,6,48)) return false;
  const f = label.frame as Record<string, unknown> | undefined;
  for(const value of [label.textEffects,label.arrowEffects]) {
    const e=value as Record<string,unknown>|undefined;
    if(e===undefined) continue;
    if (!e || typeof e !== "object" || Array.isArray(e)) return false;
    for (const k of ["shadowEnabled", "outlineEnabled"]) if (e[k] !== undefined && typeof e[k] !== "boolean") return false;
    for (const k of ["shadowColor", "outlineColor"]) if (e[k] !== undefined && !color(e[k])) return false;
    for (const [k, lo, hi] of [["shadowBlur",0,30], ["shadowOpacity",0,1], ["shadowOffsetX",-20,20], ["shadowOffsetY",-20,20], ["outlineWidth",0,8]] as const)
      if (e[k] !== undefined && !finite(e[k],lo,hi)) return false;
  }
  if (f !== undefined) {
    if (!f || typeof f !== "object" || Array.isArray(f) || !["none","fill","outline","glass"].includes(f.style as string)) return false;
    for (const k of ["fillColor","borderColor"]) if (f[k] !== undefined && !color(f[k])) return false;
    for (const [k,lo,hi] of [["opacity",0,1], ["borderWidth",0,8], ["radius",0,60], ["blur",0,30]] as const)
      if (f[k] !== undefined && !finite(f[k],lo,hi)) return false;
  }
  return true;
}
