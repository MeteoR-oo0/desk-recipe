import {useEffect,useState} from "react";
import {Download} from "lucide-react";
import {Modal} from "./Modal";
import type {ProjectData,ProductLabel} from "../types/project";
import type {Translation} from "../lib/i18n";
import {drawProductTable,tableBlob} from "../lib/productTable";
import {downloadBlob} from "../lib/project";
import {priceTotal} from "../lib/priceTotal";
import "../product-table.css";
export function ProductTableDialog({p,t,onClose,onPatch,onMove,onNumber,onEnd}:{p:ProjectData;t:Translation;onClose:()=>void;onPatch:(id:string,changes:Partial<ProductLabel>,key?:string)=>void;onMove:(id:string,to:number)=>void;onNumber:()=>void;onEnd:()=>void}) {
  const [format,setFormat]=useState<"png"|"jpeg">("png"),[showTotal,setShowTotal]=useState(true),[preview,setPreview]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false),[file,setFile]=useState<{url:string;name:string}|null>(null);
  useEffect(()=>{let active=true;const timer=setTimeout(()=>{void(async()=>{try{const image=await tableBlob(await drawProductTable(p,t,showTotal),"png");if(active){setPreview(URL.createObjectURL(image));setError(false);}}catch{if(active)setError(true);}})();},200);return()=>{active=false;clearTimeout(timer);};},[p.labels,t,showTotal]);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
  useEffect(()=>()=>{if(file)URL.revokeObjectURL(file.url);},[file]);
  useEffect(()=>setFile(null),[p.labels,format,showTotal]);
  const sum=priceTotal(p.labels);
  return <Modal title={t.tableTitle} closeText={t.close} onClose={()=>{if(!busy){onEnd();onClose();}}}>
    <div className="product-table-dialog"><p>{t.tableDescription}</p>
      <div className="table-tools"><button disabled={busy||!p.labels.length} onClick={onNumber}>{t.assignNumbers}</button><label className="switch-row"><span>{t.showTotalPrice}</span><input className="switch" type="checkbox" disabled={busy} checked={showTotal} onChange={e=>setShowTotal(e.target.checked)}/></label></div>
      <div className="product-table-scroll"><table><thead><tr>{[t.labelNumber,t.brand,t.productName,t.price,t.order].map(v=><th key={v}>{v}</th>)}</tr></thead><tbody>{p.labels.map((l,i)=><tr key={l.id}>
        <td><input aria-label={`${t.labelNumber}: ${l.productName}`} disabled={busy} inputMode="numeric" placeholder={String(i+1)} value={l.labelNumber??""} maxLength={4} onChange={e=>onPatch(l.id,{labelNumber:e.target.value.normalize("NFKC").replace(/[^0-9]/g,"")},"number")} onBlur={onEnd}/></td>
        {(["brand","productName","price"] as const).map(k=><td key={k}><input aria-label={`${t[k]}: ${l.productName}`} disabled={busy} value={l[k]} maxLength={k==="productName"?120:80} onChange={e=>onPatch(l.id,{[k]:e.target.value},k)} onBlur={onEnd}/></td>)}
        <td><select aria-label={`${t.order}: ${l.productName}`} disabled={busy} value={i} onChange={e=>onMove(l.id,+e.target.value)}>{p.labels.map((item,n)=><option key={item.id} value={n}>{n+1}</option>)}</select></td>
      </tr>)}</tbody>{showTotal&&<tfoot><tr><th colSpan={3}>{t.totalPrice}</th><td colSpan={2}>¥{sum.total.toLocaleString("ja-JP",{maximumFractionDigits:2})}</td></tr></tfoot>}</table></div>
      {!p.labels.length&&<p>{t.selectLabelHint}</p>}
      <p className="field-note">{t.tablePriceNote}</p>
      {preview&&<img className="product-table-preview" src={preview} alt={t.tablePreview}/>}
      <div className="segmented">{(["png","jpeg"] as const).map(f=><button key={f} disabled={busy} className={f===format?"active":""} onClick={()=>setFormat(f)}>{f.toUpperCase()}</button>)}</div>
      {error&&<p role="alert" className="table-error">{t.tableExportError}</p>}
      <button className="primary" disabled={busy||!p.labels.length} onClick={async()=>{setBusy(true);try{const image=await tableBlob(await drawProductTable(p,t,showTotal),format),name="desk-recipe-products."+(format==="png"?"png":"jpg");downloadBlob(image,name);setFile({url:URL.createObjectURL(image),name});setError(false);}catch{setError(true);}finally{setBusy(false);}}}><Download size={17}/>{busy?t.exporting:t.exportTable}</button>
      {file&&<a className="download-link" href={file.url} download={file.name}><Download size={17}/>{t.download}</a>}
    </div>
  </Modal>;
}
