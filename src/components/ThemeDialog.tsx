import { Sun, Moon, Monitor } from "lucide-react";
import { Modal } from "./Modal";
import type { Translation } from "../lib/i18n";
import type { Language } from "../types/project";
import { palettes, type ThemePreference } from "../lib/theme";
export function ThemeDialog({t,language,value,onChange,onClose}:{t:Translation;language:Language;value:ThemePreference;onChange:(value:ThemePreference)=>void;onClose:()=>void}) {
  return <Modal title={t.appearance} closeText={t.close} onClose={onClose}><div className="theme-settings">
    <p>{t.appearanceHint}</p><h3>{t.themeMode}</h3>
    <div className="theme-modes" role="group" aria-label={t.themeMode}>{([
      ["light",t.lightTheme,Sun],["dark",t.darkTheme,Moon],["system",t.systemTheme,Monitor],
    ] as const).map(([mode,name,Icon])=><button key={mode} aria-pressed={value.mode===mode} className={value.mode===mode?"active":""} onClick={()=>onChange({...value,mode})}><Icon size={18}/>{name}</button>)}</div>
    <h3>{t.mainColor}</h3><div className="theme-palettes" role="group" aria-label={t.mainColor}>{palettes.map(p=><button key={p.id} aria-pressed={value.color===p.id} className={value.color===p.id?"active":""} onClick={()=>onChange({...value,color:p.id})}><span style={{background:p.color}}/>{p[language]}</button>)}</div>
    <div className="theme-example"><span className="theme-example-icon">Aa</span><div><strong>{t.app}</strong><p>{t.themePreview}</p></div></div>
    <button className="primary" onClick={onClose}>{t.done}</button>
  </div></Modal>;
}
