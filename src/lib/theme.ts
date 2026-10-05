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
