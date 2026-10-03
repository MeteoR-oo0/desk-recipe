import {useEffect,useState} from "react";
import {Download} from "lucide-react";
import {Modal} from "./Modal";
import type {ProjectData,ProductLabel} from "../types/project";
import type {Translation} from "../lib/i18n";
import {drawProductTable,tableBlob} from "../lib/productTable";
import {downloadBlob} from "../lib/project";
import {priceTotal} from "../lib/priceTotal";
import "../product-table.css";
import {NumberStylePicker} from "./NumberStylePicker";
import {formatLabelNumber} from "../lib/labelOrder";
import {ReorderGrip} from "./ReorderGrip";
import {useLabelReorder} from "../hooks/useLabelReorder";
export function ProductTableDialog({p,t,onClose,onPatch,onMove,onNumberStyle,onPrices,onEnd}:{p:ProjectData;t:Translation;onClose:()=>void;onPatch:(id:string,changes:Partial<ProductLabel>,key?:string)=>void;onMove:(id:string,to:number)=>void;onNumberStyle:(s:NonNullable<ProjectData["numberStyle"]>)=>void;onPrices:(show:boolean)=>void;onEnd:()=>void}) {
  const [format,setFormat]=useState<"png"|"jpeg">("png"),[preview,setPreview]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false),[file,setFile]=useState<{url:string;name:string}|null>(null);
  const showPrices=p.tableShowPrices!==false,showTotal=p.showTotalPrice!==false,numbered=(p.numberStyle??"none")!=="none";
  useEffect(()=>{let active=true;const timer=setTimeout(()=>{void(async()=>{try{const image=await tableBlob(await drawProductTable(p,t,showPrices),"png");if(active){setPreview(URL.createObjectURL(image));setError(false);}}catch{if(active)setError(true);}})();},200);return()=>{active=false;clearTimeout(timer);};},[p.labels,p.numberStyle,t,showPrices,showTotal]);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
  useEffect(()=>()=>{if(file)URL.revokeObjectURL(file.url);},[file]);
  useEffect(()=>setFile(null),[p.labels,p.numberStyle,format,showPrices,showTotal]);
  const sum=priceTotal(p.labels);
  const reorder=useLabelReorder(p.labels,onMove);
  return <Modal title={t.tableTitle} closeText={t.close} onClose={()=>{if(!busy){onEnd();onClose();}}}>
    <div className="product-table-dialog"><p>{t.tableDescription}</p>
      <div className="table-tools"><NumberStylePicker t={t} value={p.numberStyle??"none"} disabled={busy} onChange={onNumberStyle}/><label className="switch-row"><span>{t.showPrice}</span><input className="switch" type="checkbox" disabled={busy} checked={showPrices} onChange={e=>onPrices(e.target.checked)}/></label></div>
      <span className="sr-only" role="status">{reorder.drag?t.reorderGrabbed:""}</span>
      <div className="product-table-scroll" data-reorder-list="table"><table><thead><tr>{[...(numbered?[t.labelNumber]:[]),t.brand,t.productName,...(showPrices?[t.price]:[]),t.order].map(v=><th key={v}>{v}</th>)}</tr></thead><tbody>{p.labels.map((l,i)=><tr key={l.id} data-label-id={l.id} className={reorder.rowClass(l.id)}>
        {numbered&&<td className="table-col-number">{formatLabelNumber(i+1,p.numberStyle)}</td>}
        {(["brand","productName",...(showPrices?["price" as const]:[])] as const).map(k=><td key={k} className={"table-col-"+k}><input aria-label={`${t[k]}: ${l.productName}`} disabled={busy} value={l[k]} maxLength={k==="productName"?120:80} onChange={e=>onPatch(l.id,{[k]:e.target.value},k)} onBlur={onEnd}/></td>)}
        <td className="table-col-order"><ReorderGrip label={l} labels={p.labels} t={t} onMove={onMove} reorder={reorder} disabled={busy}/></td>
      </tr>)}</tbody>{showTotal&&<tfoot><tr><th colSpan={(numbered?1:0)+2}>{t.totalPrice}</th><td colSpan={showPrices?2:1}>¥{sum.total.toLocaleString("ja-JP",{maximumFractionDigits:2})}</td></tr></tfoot>}</table></div>
      {!p.labels.length&&<p>{t.selectLabelHint}</p>}
      <p className="field-note">{t.tablePriceNote}</p>
      {preview&&<img className="product-table-preview" src={preview} alt={t.tablePreview}/>}
      <div className="segmented">{(["png","jpeg"] as const).map(f=><button key={f} disabled={busy} className={f===format?"active":""} onClick={()=>setFormat(f)}>{f.toUpperCase()}</button>)}</div>
      {error&&<p role="alert" className="table-error">{t.tableExportError}</p>}
      <button className="primary" disabled={busy||!p.labels.length} onClick={async()=>{setBusy(true);try{const image=await tableBlob(await drawProductTable(p,t,showPrices),format),name="desk-recipe-products."+(format==="png"?"png":"jpg");downloadBlob(image,name);setFile({url:URL.createObjectURL(image),name});setError(false);}catch{setError(true);}finally{setBusy(false);}}}><Download size={17}/>{busy?t.exporting:t.exportTable}</button>
      {file&&<a className="download-link" href={file.url} download={file.name}><Download size={17}/>{t.download}</a>}
    </div>
  </Modal>;
}
