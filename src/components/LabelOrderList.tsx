import {GripVertical,ChevronRight} from "lucide-react";
import type {ProductLabel} from "../types/project";
import type {Translation} from "../lib/i18n";
import "../product-table.css";
export function LabelOrderList({labels,selectedId,t,onSelect,onMove}:{labels:ProductLabel[];selectedId:string|null;t:Translation;onSelect:(id:string)=>void;onMove:(id:string,to:number)=>void}) {
  return <div className="label-order-list">{labels.map((l,i)=><div key={l.id} className={"label-order-row"+(l.id===selectedId?" selected":"")} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");if(labels.some(l=>l.id===id)) onMove(id,i);}}>
    <span className="label-grip" draggable onDragStart={e=>{e.dataTransfer.setData("text/plain",l.id);e.dataTransfer.effectAllowed="move";}} title={t.reorderHint}><GripVertical size={16}/></span>
    <button className="label-list-item" onClick={()=>onSelect(l.id)}><span className="label-index">{l.labelNumber||String(i+1).padStart(2,"0")}</span><span><small>{l.brand}</small><strong>{l.productName||t.productName}</strong></span><ChevronRight size={14}/></button>
    <select aria-label={`${t.order}: ${l.productName||t.productName}`} value={i} onChange={e=>onMove(l.id,+e.target.value)}>{labels.map((item,n)=><option key={item.id} value={n}>{n+1}</option>)}</select>
  </div>)}</div>;
}
