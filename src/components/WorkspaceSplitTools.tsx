import {useEffect,useId,useRef,useState} from "react";
import {TriangleAlert,X} from "lucide-react";
import type {SplitSettings} from "../types/project";
import type {Translation} from "../lib/i18n";
import {SplitControls} from "./SplitControls";
export function WorkspaceSplitTools({value,t,onChange,warningCount}:{value:SplitSettings;t:Translation;onChange:(s:SplitSettings)=>void;warningCount:number}) {
  return <div className="workspace-split-tools"><SplitControls compact value={value} t={t} onChange={onChange}/>{value.count>1&&<SplitNotice value={value} t={t} onChange={onChange} warningCount={warningCount}/>}</div>;
}
function SplitNotice({value,t,onChange,warningCount}:{value:SplitSettings;t:Translation;onChange:(s:SplitSettings)=>void;warningCount:number}) {
  const [open,setOpen]=useState(false),root=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null),id=useId();
  const warning=warningCount?t.splitWarning.replace("{count}",String(warningCount)):"";
  useEffect(()=>{
    if(!open)return;
    const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setOpen(false);button.current?.focus({preventScroll:true});}};
    document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);
    return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);};
  },[open]);
  return <div className="split-notice" ref={root}>
    <button ref={button} className={"split-notice-button"+(warningCount?" has-warning":"")} aria-label={t.splitNotice} aria-expanded={open} aria-controls={id} title={warning||t.splitNotice} onClick={()=>setOpen(v=>!v)}><TriangleAlert size={18}/></button>
    {open&&<div className="split-notice-popover" role="dialog" aria-label={t.splitNotice} id={id}>
      <div className="split-notice-heading"><strong>{t.splitNotice}</strong><button aria-label={t.close} onClick={()=>{setOpen(false);button.current?.focus({preventScroll:true});}}><X size={16}/></button></div>
      {warning&&<p className="split-notice-warning">{warning}</p>}
      <p>{t.splitGuideHint}</p>
      <p>{t.splitDisplayNote}</p>
      <label className="split-guide-toggle"><input type="checkbox" checked={value.showGuides} onChange={e=>onChange({...value,showGuides:e.target.checked})}/>{t.splitGuides}</label>
    </div>}
  </div>;
}
