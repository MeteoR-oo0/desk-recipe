import type {SplitSettings} from "../types/project";
import type {Translation} from "../lib/i18n";
export function SplitControls({value,t,onChange,compact=false,disabled=false}:{value:SplitSettings;t:Translation;onChange:(value:SplitSettings)=>void;compact?:boolean;disabled?:boolean}) {
  return <div className={"split-controls"+(compact?" is-compact":"")}>
    <label><span className={compact?"sr-only":undefined}>{t.saveLayout}</span><select aria-label={t.saveLayout} title={t.saveLayout} disabled={disabled} value={value.count} onChange={e=>onChange({...value,count:+e.target.value as SplitSettings["count"],showGuides:true})}>
      <option value={1}>{t.singleImage}</option>{([2,3,4] as const).map(count=><option value={count} key={count}>{t.xSplit.replace("{count}",String(count))}</option>)}
    </select></label>
    {value.count>1&&<>
      {!compact&&<label className="split-guide-toggle"><input type="checkbox" disabled={disabled} checked={value.showGuides} onChange={e=>onChange({...value,showGuides:e.target.checked})}/>{t.splitGuides}</label>}
      {!compact&&<label className="range-label">{t.splitCorrection}<output>{value.gapPercent.toFixed(1)}%</output><input type="range" aria-label={t.splitCorrection} disabled={disabled} min={0} max={6} step={0.1} value={value.gapPercent} onChange={e=>onChange({...value,gapPercent:+e.target.value})}/></label>}
      {!compact&&<p className="field-note">{t.splitCorrectionHint}</p>}
    </>}
  </div>;
}
