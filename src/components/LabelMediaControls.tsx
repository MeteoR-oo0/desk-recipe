import { useRef } from "react";
import { ImagePlus, ClipboardPaste, Trash2 } from "lucide-react";
import type { ProductLabel } from "../types/project";
import type { Translation } from "../lib/i18n";
import { Slider, TextAppearanceControls } from "./AppearanceControls";

export function LabelMediaControls({ label, t, onChange, onEnd, onImage, onPasteImage }: {
  label: ProductLabel; t: Translation; onChange: (patch: Partial<ProductLabel>, key?: string) => void; onEnd: () => void;
  onImage: (file: File) => void; onPasteImage: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const image = label.image;
  return <div className="label-media-controls" data-image-target="label" data-image-label={label.id} tabIndex={0} aria-label={t.labelImage}>
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => {
      const file = event.target.files?.[0]; event.target.value = "";
      if (!file) return;
      onImage(file);
    }}/>
    {image && <img className="label-image-preview" src={image.src} alt={image.name}/>}
    <button onClick={() => input.current?.click()}><ImagePlus size={17}/>{image?t.replaceImage:t.addImage}</button>
    <button onClick={onPasteImage}><ClipboardPaste size={17}/>{t.pasteImage}</button>
    <p className="field-note">{t.labelImageImportHint}</p>
    {image && <>
      <p className="field-note">{t.imagePositionHint}</p>
      <div className="image-position-fields">{(["x", "y"] as const).map(axis => <label key={axis}>{axis === "x" ? t.imageX : t.imageY}
        <input type="number" min={-2000} max={2000} step={1} value={Math.round(image[axis])} onChange={event => {
          if (event.target.value !== "" && Number.isFinite(event.target.valueAsNumber)) onChange({ image: { ...image, [axis]: Math.max(-2000, Math.min(2000, event.target.valueAsNumber)) } }, `image:${axis}`);
        }} onBlur={onEnd}/></label>)}</div>
      <Slider name={t.imageSize} value={Math.round(image.width)} min={24} max={600} onChange={width=>onChange({image:{...image,width}},"image:width")} onEnd={onEnd}/>
      <Slider name={t.imageOpacity} value={Math.round(image.opacity*100)} max={100} unit="%" onChange={value=>onChange({image:{...image,opacity:value/100}},"image:opacity")} onEnd={onEnd}/>
      <TextAppearanceControls image label={label} t={t} onChange={onChange} onEnd={onEnd}/>
      <button className="danger" onClick={()=>onChange({image:undefined})}><Trash2 size={16}/>{t.removeImage}</button>
    </>}
  </div>;
}
