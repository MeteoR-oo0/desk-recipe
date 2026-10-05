import { createPortal } from "react-dom";
import { ChevronRight, GripVertical, Eye, EyeOff } from "lucide-react";
import type { ProductLabel } from "../types/project";
import type { LabelReorder } from "../hooks/useLabelReorder";

export function ReorderOverlay({ reorder, label, number, table = false, showPrices = true }: {
  reorder: LabelReorder; label?: ProductLabel; number: string; table?: boolean; showPrices?: boolean;
}) {
  const { drag } = reorder;
  if (!drag || !label) return null;
  const grip = <span className="label-grip"><GripVertical size={16}/></span>;
  return createPortal(<div aria-hidden="true"
    className={`reorder-overlay reorder-grabbed ${table ? "reorder-table-ghost" : "label-order-row"}`}
    style={{ left: drag.bounds.left, top: drag.bounds.top, width: drag.bounds.width, height: drag.bounds.height,
      transform: `translate3d(${drag.offsetX}px, ${drag.offsetY}px, 0)`,
      ...(table ? { gridTemplateColumns: drag.columns.map(width => `${width}px`).join(" ") } : {}) }}>
    {table ? <>
      {number && <span>{number}</span>}
      <span>{label.brand}</span><span>{label.productName}</span>
      {showPrices && <span>{label.price}</span>}
      <span>{grip}</span>
    </> : <>
      {grip}<div className="label-list-item"><span className="label-index">{number}</span>
        <span><small>{label.brand}</small><strong>{label.productName}</strong></span><ChevronRight size={14}/>
      </div>
      <span className={"label-visibility"+(label.hidden?" is-hidden":"")}>{label.hidden?<EyeOff size={18}/>:<Eye size={18}/>}</span>
    </>}
  </div>, document.body);
}
