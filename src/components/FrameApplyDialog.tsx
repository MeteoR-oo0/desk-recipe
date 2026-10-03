import type {ProductLabel} from "../types/project";
import type {Translation} from "../lib/i18n";
import {frameSettings} from "../lib/labelAppearance";
import {Modal} from "./Modal";
export function FrameApplyDialog({label,count,t,onClose,onConfirm}:{label:ProductLabel;count:number;t:Translation;onClose:()=>void;onConfirm:()=>void}) {
  const f=frameSettings(label),style=t[f.style==="none"?"frameNone":f.style==="fill"?"frameFill":f.style==="outline"?"frameOutline":"frameGlass"];
  return <Modal title={t.applyFrameAll} closeText={t.close} onClose={onClose}>
    <p className="frame-confirm-source">{label.productName}</p>
    <p>{t.applyFrameDescription.replace("{count}",String(count))}</p>
    <dl className="frame-confirm-settings"><dt>{t.frameDesign}</dt><dd>{style}</dd><dt>{t.boxWidth}</dt><dd>{label.boxWidth??330}px</dd><dt>{t.boxHeight}</dt><dd>{label.boxExtraHeight??0}px</dd><dt>{t.cornerRadius}</dt><dd>{f.radius}px</dd><dt>{t.frameColor}</dt><dd>{f.fillColor}</dd><dt>{t.frameOpacity}</dt><dd>{Math.round(f.opacity*100)}%</dd><dt>{t.frameBorderColor}</dt><dd>{f.borderColor}</dd><dt>{t.frameBorderWidth}</dt><dd>{f.borderWidth}px</dd>{f.style==="glass"&&<><dt>{t.glassBlur}</dt><dd>{f.blur}px</dd></>}</dl>
    <p>{t.applyFrameNote}</p><div className="modal-actions"><button onClick={onClose}>{t.cancel}</button><button className="primary" onClick={onConfirm}>{t.confirmApply}</button></div>
  </Modal>;
}
