export function moveLabel<T extends {id:string}>(labels: readonly T[], id: string, position: number): T[] | readonly T[] {
  const from=labels.findIndex(l=>l.id===id);
  if(from<0 || !Number.isFinite(position)) return labels;
  const to=Math.max(0,Math.min(labels.length-1,Math.trunc(position)));
  if(from===to) return labels;
  const next=[...labels], [item]=next.splice(from,1);next.splice(to,0,item);return next;
}
export function reorderDestination(from: number, target: number, after: boolean) {
  const slot = target + (after ? 1 : 0);
  return slot > from ? slot - 1 : slot;
}
export function numberedBrand(label: {brand:string;labelNumber?:string}) {
  return label.labelNumber ? `${label.labelNumber}${label.brand ? " "+label.brand : ""}` : label.brand;
}
export const validLabelNumber = (value:unknown) => value===undefined || (typeof value==="string" && /^\d{0,4}$/.test(value));
import type {NumberStyle} from "../types/project";
export function formatLabelNumber(position:number,style:NumberStyle="none") {
  if(style==="none") return "";
  if(style==="dot") return `${position}.`;
  if(style==="paren") return `${position})`;
  if(style==="circle") {
    if(position>=1 && position<=20) return String.fromCodePoint(0x2460+position-1);
    if(position<=35) return String.fromCodePoint(0x3251+position-21);
    if(position<=50) return String.fromCodePoint(0x32b1+position-36);
    return `(${position})`;
  }
  return String(position);
}
