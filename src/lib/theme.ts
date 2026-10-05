export const palettes = [
  { id:"green", color:"#377460", ja:"グリーン", en:"Green" },
  { id:"blue", color:"#326bc0", ja:"ブルー", en:"Blue" },
  { id:"purple", color:"#7951b6", ja:"パープル", en:"Purple" },
  { id:"rose", color:"#b34e75", ja:"ローズ", en:"Rose" },
  { id:"orange", color:"#b65f24", ja:"オレンジ", en:"Orange" },
  { id:"graphite", color:"#526171", ja:"グラファイト", en:"Graphite" },
] as const;
export type ThemePreference = { mode:"light"|"dark"|"system"; color:typeof palettes[number]["id"] };
export const defaultTheme: ThemePreference = {mode:"light",color:"green"};
export function parseTheme(value: string | null): ThemePreference {
  try { const parsed=JSON.parse(value??"null");
    return parsed&&["light","dark","system"].includes(parsed.mode)&&palettes.some(p=>p.id===parsed.color)
      ? {mode:parsed.mode,color:parsed.color} : {...defaultTheme};
  } catch {return {...defaultTheme};}
}
const mix = (a:string,b:string,weight:number) => "#"+[0,2,4].map(offset=>Math.round(parseInt(a.slice(offset+1,offset+3),16)*weight+parseInt(b.slice(offset+1,offset+3),16)*(1-weight)).toString(16).padStart(2,"0")).join("");
export function tableAppearance(preference:ThemePreference=defaultTheme,systemDark=false) {
  const dark=preference.mode==="dark"||(preference.mode==="system"&&systemDark), accent=palettes.find(p=>p.id===preference.color)!.color;
  const background=dark?"#1c222c":"#ffffff";
  return { background, row:dark?"#252d39":"#edf2f7", text:dark?"#e4eaf0":"#273642", muted:dark?"#afbac7":"#65747f",
    border:dark?"#384251":"#dce3eb", accent, accentText:mix(accent,dark?"#ffffff":"#182026",dark?0.48:0.8), accentSoft:mix(accent,background,dark?0.24:0.09) };
}
export type TableAppearance=ReturnType<typeof tableAppearance>;
