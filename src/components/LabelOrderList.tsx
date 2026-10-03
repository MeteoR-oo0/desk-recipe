import {ChevronRight} from "lucide-react";
import type {ProductLabel} from "../types/project";
import type {Translation} from "../lib/i18n";
import "../product-table.css";
import {formatLabelNumber} from "../lib/labelOrder";
import {ReorderGrip} from "./ReorderGrip";
export function LabelOrderList({labels,selectedId,t,onSelect,onMove,numberStyle}:{numberStyle:NonNullable<import("../types/project").ProjectData["numberStyle"]>;labels:ProductLabel[];selectedId:string|null;t:Translation;onSelect:(id:string)=>void;onMove:(id:string,to:number)=>void}) {
  return <div className="label-order-list">{labels.map((l,i)=><div key={l.id} data-label-id={l.id} className={"label-order-row"+(l.id===selectedId?" selected":"")} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");if(labels.some(l=>l.id===id)) onMove(id,i);}}>
    <ReorderGrip label={l} labels={labels} t={t} onMove={onMove}/>
    <button className="label-list-item" onClick={()=>onSelect(l.id)}><span className="label-index">{formatLabelNumber(i+1,numberStyle)}</span><span><small>{l.brand}</small><strong>{l.productName||t.productName}</strong></span><ChevronRight size={14}/></button>
  </div>)}</div>;
}
