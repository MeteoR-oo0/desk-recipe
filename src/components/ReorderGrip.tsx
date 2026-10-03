import {useRef} from "react";
import {GripVertical} from "lucide-react";
import type {ProductLabel} from "../types/project";
import type {Translation} from "../lib/i18n";
export function ReorderGrip({label,labels,t,onMove,disabled=false}:{label:ProductLabel;labels:ProductLabel[];t:Translation;onMove:(id:string,to:number)=>void;disabled?:boolean}) {
  const touch=useRef<{pointer:number;startY:number;position:number;moved:boolean}|null>(null);
  return <button type="button" className="label-grip" disabled={disabled} aria-label={`${t.reorderHint}: ${label.productName}`} title={t.reorderHint}
    onKeyDown={e=>{const i=labels.findIndex(l=>l.id===label.id);if(e.key==="ArrowUp"||e.key==="ArrowDown"){e.preventDefault();onMove(label.id,i+(e.key==="ArrowUp"?-1:1));}}}
    onPointerDown={e=>{if(!e.isPrimary||e.button!==0)return;touch.current={pointer:e.pointerId,startY:e.clientY,position:labels.findIndex(l=>l.id===label.id),moved:false};e.currentTarget.setPointerCapture(e.pointerId);}}
    onPointerMove={e=>{const start=touch.current;if(!start||start.pointer!==e.pointerId)return;if(Math.abs(e.clientY-start.startY)>8){start.moved=true;const row=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>("[data-label-id]");const position=labels.findIndex(l=>l.id===row?.dataset.labelId);if(position>=0)start.position=position;}}}
    onPointerUp={e=>{const start=touch.current;if(!start||start.pointer!==e.pointerId)return;touch.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(start.moved)onMove(label.id,start.position);}}
    onPointerCancel={()=>{touch.current=null;}}><GripVertical size={16}/></button>;
}
