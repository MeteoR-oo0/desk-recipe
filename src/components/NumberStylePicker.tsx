import type {NumberStyle} from "../types/project";
import type {Translation} from "../lib/i18n";
export function NumberStylePicker({value,t,onChange,disabled=false}:{value:NumberStyle;t:Translation;onChange:(s:NumberStyle)=>void;disabled?:boolean}) {
  return <label className="number-style-picker">{t.numberStyle}<select disabled={disabled} value={value} onChange={e=>onChange(e.target.value as NumberStyle)}><option value="plain">1, 2, 3</option><option value="dot">1. 2. 3.</option><option value="paren">1) 2) 3)</option><option value="circle">① ② ③</option><option value="none">{t.frameNone}</option></select></label>;
}
