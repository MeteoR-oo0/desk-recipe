import { useState } from "react";
import { Modal } from "./Modal";
import type { Translation } from "../lib/i18n";
export function ResetDialog({t,onClose,onReset}:{t:Translation;onClose:()=>void;onReset:(sample:boolean)=>void}) {
  const [sample,setSample]=useState(false);
  return <Modal title={t.reset} closeText={t.close} onClose={onClose}><div className="theme-settings">
    <p>{t.resetHint}</p><fieldset className="reset-options"><legend>{t.resetTarget}</legend>
      <label><input type="radio" name="reset-target" checked={!sample} onChange={()=>setSample(false)}/><span>{t.resetKeepPhoto}</span></label>
      <label><input type="radio" name="reset-target" checked={sample} onChange={()=>setSample(true)}/><span>{t.resetRestoreSample}</span></label>
    </fieldset><p>{t.resetUndo}</p><div className="modal-actions"><button onClick={onClose}>{t.cancel}</button><button className="primary" onClick={()=>onReset(sample)}>{t.confirmReset}</button></div>
  </div></Modal>;
}
