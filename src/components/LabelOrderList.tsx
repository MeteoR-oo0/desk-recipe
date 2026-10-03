import {ChevronRight} from "lucide-react";
import type {ProductLabel} from "../types/project";
import type {Translation} from "../lib/i18n";
import "../product-table.css";
import {formatLabelNumber} from "../lib/labelOrder";
import {ReorderGrip} from "./ReorderGrip";
import {useLabelReorder} from "../hooks/useLabelReorder";
export function LabelOrderList({labels,selectedId,t,onSelect,onMove,numberStyle}:{numberStyle:NonNullable<import("../types/project").ProjectData["numberStyle"]>;labels:ProductLabel[];selectedId:string|null;t:Translation;onSelect:(id:string)=>void;onMove:(id:string,to:number)=>void}) {
  const reorder=useLabelReorder(labels,onMove);
  return <div className="label-order-list" data-reorder-list="labels"><span className="sr-only" role="status">{reorder.drag?t.reorderGrabbed:""}</span>{labels.map((l,i)=><div key={l.id} data-label-id={l.id} className={"label-order-row"+(l.id===selectedId?" selected":"")+reorder.rowClass(l.id)}>
    <ReorderGrip label={l} labels={labels} t={t} onMove={onMove} reorder={reorder}/>
    <button className="label-list-item" onClick={()=>onSelect(l.id)}><span className="label-index">{formatLabelNumber(i+1,numberStyle)}</span><span><small>{l.brand}</small><strong>{l.productName||t.productName}</strong></span><ChevronRight size={14}/></button>
  </div>)}</div>;
}
