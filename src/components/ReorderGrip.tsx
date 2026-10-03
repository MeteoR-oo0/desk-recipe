import {GripVertical} from "lucide-react";
import type {ProductLabel} from "../types/project";
import type {Translation} from "../lib/i18n";
import type {LabelReorder} from "../hooks/useLabelReorder";
export function ReorderGrip({label,labels,t,onMove,reorder,disabled=false}:{label:ProductLabel;labels:ProductLabel[];t:Translation;onMove:(id:string,to:number)=>void;reorder:LabelReorder;disabled?:boolean}) {
  return <button type="button" className="label-grip" disabled={disabled} aria-pressed={reorder.drag?.id === label.id} aria-label={`${t.reorderHint}: ${label.productName}`} title={t.reorderHint}
    onKeyDown={e=>{const i=labels.findIndex(l=>l.id===label.id);if(e.key==="ArrowUp"||e.key==="ArrowDown"){e.preventDefault();onMove(label.id,i+(e.key==="ArrowUp"?-1:1));}}}
    onPointerDown={e=>reorder.start(e,label.id)} onPointerMove={reorder.preview} onPointerUp={reorder.finish}
    onPointerCancel={reorder.cancel} onLostPointerCapture={reorder.cancel}><GripVertical size={16}/></button>;
}
