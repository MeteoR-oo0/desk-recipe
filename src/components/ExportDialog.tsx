import {useEffect,useState} from "react";
import {Download} from "lucide-react";
import {Modal} from "./Modal";
import {SplitControls} from "./SplitControls";
import type {ProjectData,SplitSettings} from "../types/project";
import type {Translation} from "../lib/i18n";
import {exportDimensions} from "../lib/project";
import {splitSettings,splitGeometry,type ExportResult,type ExportFile} from "../lib/splitImage";
import {splitWarnings} from "../lib/splitWarnings";
type Preview = {files:(ExportFile&{url:string})[];zipUrl?:string};
export function ExportDialog({p,t,onClose,onExport,onSplit}:{p:ProjectData;t:Translation;onClose:()=>void;onSplit:(s:SplitSettings)=>void;onExport:(f:"png"|"jpeg",r:"standard"|"original")=>Promise<ExportResult|undefined>}) {
  const [format,setFormat]=useState<"png"|"jpeg">("png"),[resolution,setResolution]=useState<"standard"|"original">("standard"),[busy,setBusy]=useState(false),[preview,setPreview]=useState<Preview|null>(null),[error,setError]=useState(false);
  const split=splitSettings(p.exportSplit),d=exportDimensions(p,resolution),geometry=splitGeometry(d.width,split),warnings=splitWarnings(p);
  useEffect(()=>()=>{preview?.files.forEach(file=>URL.revokeObjectURL(file.url));if(preview?.zipUrl)URL.revokeObjectURL(preview.zipUrl);},[preview]);
  useEffect(()=>{setPreview(null);setError(false);},[format,resolution,split.count,split.gapPercent]);
  const prepare=async()=>{
    setBusy(true);setError(false);
    try {
      const result=await onExport(format,resolution);
      if(!result){setError(true);return;}
      setPreview({files:result.files.map(file=>({...file,url:URL.createObjectURL(file.blob)})),zipUrl:result.archive?URL.createObjectURL(result.archive):undefined});
    } catch {setError(true);} finally {setBusy(false);}
  };
  return <Modal hideKicker title={t.exportTitle} closeText={t.close} onClose={()=>{if(!busy)onClose();}}>
    <div className="split-export-dialog">
      <SplitControls t={t} value={split} onChange={onSplit} disabled={busy}/>
      <div className="export-options">
        <label>{t.format}<div className="segmented">{(["png","jpeg"] as const).map(f=><button key={f} aria-label={f.toUpperCase()} disabled={busy} aria-pressed={format===f} className={format===f?"active":""} onClick={()=>setFormat(f)}>{f.toUpperCase()}</button>)}</div></label>
        <label>{t.resolution}<select disabled={busy} value={resolution} onChange={e=>setResolution(e.target.value as typeof resolution)}><option value="standard">{t.standard} — 1920px</option><option value="original">{t.source}</option></select></label>
      </div>
      <p className="export-dimensions">{split.count===1?`${d.width} × ${d.height}px`:t.splitPixels.replace("{width}",String(Math.max(1,Math.round(geometry.tileWidth)))).replace("{height}",String(d.height))} · {format.toUpperCase()}</p>
      {warnings.length>0&&<p role="status" className="split-warning">{t.splitWarning.replace("{count}",String(warnings.length))}</p>}
      {split.count>1&&<p className="field-note">{t.splitOrder.replace("{count}",String(split.count))}</p>}
      {preview&&<>
        {split.count>1&&<h3>{t.splitPreview}</h3>}
        <div className="split-joined-preview" style={{gridTemplateColumns:`repeat(${split.count}, minmax(0,1fr))`,columnGap:`${100*(split.gapPercent/100)/(split.count+(split.count-1)*split.gapPercent/100)}%`}}>
          {preview.files.map((file,i)=><img key={file.name} src={file.url} alt={split.count===1?t.exportTitle:`${t.splitPreview} ${i+1}`} />)}
        </div>
        {preview.files.length>1&&<div className="split-file-downloads">{preview.files.map((file,i)=><a className="download-link" key={file.name} href={file.url} download={file.name}><Download size={15}/>{t.splitFile.replace("{index}",String(i+1))}<small>{file.width} × {file.height}px</small></a>)}</div>}
      </>}
      <p className="field-note">{t.exportNote}</p>
      {error&&<p role="alert" className="field-error">{t.splitExportError}</p>}
      <div className="modal-actions"><button disabled={busy} onClick={onClose}>{t.cancel}</button>
        {preview?<a className="primary download-link" href={preview.zipUrl??preview.files[0].url} download={preview.zipUrl?`recipe-maker-x-${split.count}-images.zip`:preview.files[0].name}><Download size={16}/>{preview.zipUrl?t.downloadZip:t.download}</a>
          :<button disabled={busy} className="primary" onClick={()=>void prepare()}><Download size={16}/>{busy?t.exporting:t.prepareImages}</button>}
      </div>
    </div>
  </Modal>;
}
