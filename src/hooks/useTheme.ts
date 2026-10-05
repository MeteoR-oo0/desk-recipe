import { useEffect, useLayoutEffect, useState, useMemo } from "react";
import { palettes, parseTheme, tableAppearance, type ThemePreference } from "../lib/theme";
export function useTheme() {
  const [preference,setPreference]=useState<ThemePreference>(()=>{try{return parseTheme(localStorage.getItem("recipe-maker-appearance"));}catch{return parseTheme(null);}});
  const [systemDark,setSystemDark]=useState(()=>window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(()=>{const media=window.matchMedia("(prefers-color-scheme: dark)");const changed=()=>setSystemDark(media.matches);media.addEventListener("change",changed);return()=>media.removeEventListener("change",changed);},[]);
  useLayoutEffect(()=>{
    const mode=preference.mode==="system"?(systemDark?"dark":"light"):preference.mode;
    const accent=palettes.find(p=>p.id===preference.color)!.color;
    document.documentElement.dataset.theme=mode;
    document.documentElement.style.setProperty("--accent",accent);
    document.documentElement.style.colorScheme=mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content",mode==="dark"?"#1c222c":accent);
    try{localStorage.setItem("recipe-maker-appearance",JSON.stringify(preference));}catch{}
  },[preference,systemDark]);
  const tableColors=useMemo(()=>tableAppearance(preference,systemDark),[preference,systemDark]);
  return {preference,setPreference,tableColors};
}
