export function moveLabel<T extends {id:string}>(labels: readonly T[], id: string, position: number): T[] | readonly T[] {
  const from=labels.findIndex(l=>l.id===id);
  if(from<0 || !Number.isFinite(position)) return labels;
  const to=Math.max(0,Math.min(labels.length-1,Math.trunc(position)));
  if(from===to) return labels;
  const next=[...labels], [item]=next.splice(from,1);next.splice(to,0,item);return next;
}
export function numberedBrand(label: {brand:string;labelNumber?:string}) {
  return label.labelNumber ? `${label.labelNumber}${label.brand ? " · "+label.brand : ""}` : label.brand;
}
export const validLabelNumber = (value:unknown) => value===undefined || (typeof value==="string" && /^\d{0,4}$/.test(value));
