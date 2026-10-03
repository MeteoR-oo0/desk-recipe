import type { ProductLabel, TextEffects, LabelFrame } from "../types/project";
import type { Translation } from "../lib/i18n";
import { textEffects, frameSettings } from "../lib/labelAppearance";
import "../appearance.css";

type Props = { label: ProductLabel; t: Translation; onChange: (p: Partial<ProductLabel>, key?: string) => void; onEnd: () => void };
function Slider({ name, value, min = 0, max, step = 1, unit = "px", onChange, onEnd }: {name:string; value:number;min?:number;max:number;step?:number;unit?:string;onChange:(v:number)=>void;onEnd:()=>void}) {
  return <label className="range-label">{name}<output>{value}{unit}</output><input aria-label={name} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)} onPointerUp={onEnd} onPointerCancel={onEnd} onBlur={onEnd} onKeyUp={onEnd}/></label>;
}
export function TextAppearanceControls({label,t,onChange,onEnd}: Props) {
  const e = textEffects(label);
  const change = (p: Partial<TextEffects>, key?: string) => onChange({textEffects:{...e,...p}},key);
  return <div className="appearance-controls">
    <details><summary>{t.textShadow}</summary><div className="appearance-fields">
      <label className="switch-row"><span>{t.textShadow}</span><input type="checkbox" className="switch" checked={e.shadowEnabled} onChange={v=>change({shadowEnabled:v.target.checked})}/></label>
      {e.shadowEnabled && <>
        <label className="field-row">{t.shadowColor}<input type="color" value={e.shadowColor} onChange={v=>change({shadowColor:v.target.value},"shadowColor")} onBlur={onEnd}/></label>
        <Slider name={t.shadowBlur} value={e.shadowBlur} max={30} onChange={v=>change({shadowBlur:v},"shadowBlur")} onEnd={onEnd}/>
        <Slider name={t.shadowStrength} value={Math.round(e.shadowOpacity*100)} max={100} unit="%" onChange={v=>change({shadowOpacity:v/100},"shadowOpacity")} onEnd={onEnd}/>
        <Slider name={t.shadowX} value={e.shadowOffsetX} min={-20} max={20} onChange={v=>change({shadowOffsetX:v},"shadowX")} onEnd={onEnd}/>
        <Slider name={t.shadowY} value={e.shadowOffsetY} min={-20} max={20} onChange={v=>change({shadowOffsetY:v},"shadowY")} onEnd={onEnd}/>
      </>}
    </div></details>
    <details><summary>{t.textOutline}</summary><div className="appearance-fields">
      <label className="switch-row"><span>{t.textOutline}</span><input type="checkbox" className="switch" checked={e.outlineEnabled} onChange={v=>change({outlineEnabled:v.target.checked})}/></label>
      {e.outlineEnabled && <>
        <label className="field-row">{t.outlineColor}<input type="color" value={e.outlineColor} onChange={v=>change({outlineColor:v.target.value},"outlineColor")} onBlur={onEnd}/></label>
        <Slider name={t.outlineWidth} value={e.outlineWidth} min={0.5} max={8} step={0.5} onChange={v=>change({outlineWidth:v},"outlineWidth")} onEnd={onEnd}/>
      </>}
    </div></details>
  </div>;
}
export function FrameAppearanceControls({label,t,onChange,onEnd}: Props) {
  const f = frameSettings(label);
  const change = (p: Partial<LabelFrame>, key?: string) => onChange({frame:{...f,...p}},key);
  return <div className="appearance-controls">
    <h3>{t.frameDesign}</h3>
    <div className="frame-presets" aria-label={t.frameDesign}>
      {(["none","fill","outline","glass"] as const).map(style=><button key={style} aria-pressed={f.style===style} className={f.style===style?"active":""} onClick={()=>onChange({frame:{...frameSettings({...label,frame:undefined}),...label.frame,style,fillColor:label.frame?.fillColor ?? (style==="glass"?"#ffffff":"#202a25"),opacity:label.frame?.opacity ?? (style==="glass"?0.22:0.65),borderWidth:style==="outline" ? Math.max(1,label.frame?.borderWidth??1):label.frame?.borderWidth??(style==="fill"?0:1)}})}><span className={"frame-swatch frame-swatch--"+style} aria-hidden="true">Aa</span>{t[style==="none"?"frameNone":style==="fill"?"frameFill":style==="outline"?"frameOutline":"frameGlass"]}</button>)}
    </div>
    {f.style!=="none" && <>
      <Slider name={t.cornerRadius} value={f.radius} max={60} onChange={v=>change({radius:v},"cornerRadius")} onEnd={onEnd}/>
      {f.style==="glass" && <Slider name={t.glassBlur} value={f.blur} max={30} onChange={v=>change({blur:v},"glassBlur")} onEnd={onEnd}/>}
      <details><summary>{t.frameDetails}</summary><div className="appearance-fields">
        {f.style!=="outline" && <>
          <label className="field-row">{t.frameColor}<input type="color" value={f.fillColor} onChange={v=>change({fillColor:v.target.value},"frameColor")} onBlur={onEnd}/></label>
          <Slider name={t.frameOpacity} value={Math.round(f.opacity*100)} max={100} unit="%" onChange={v=>change({opacity:v/100},"frameOpacity")} onEnd={onEnd}/>
        </>}
        <label className="field-row">{t.frameBorderColor}<input type="color" value={f.borderColor} onChange={v=>change({borderColor:v.target.value},"frameBorderColor")} onBlur={onEnd}/></label>
        <Slider name={t.frameBorderWidth} value={f.borderWidth} max={8} step={0.5} onChange={v=>change({borderWidth:v},"frameBorderWidth")} onEnd={onEnd}/>
      </div></details>
    </>}
  </div>;
}
