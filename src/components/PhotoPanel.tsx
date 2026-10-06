import {PanelSection} from "./PanelSection";
import { Camera, Check, ImagePlus, ClipboardPaste } from "lucide-react";
import type { ProjectData, AspectRatio } from "../types/project";
import type { Translation } from "../lib/i18n";
import { PriceSummary } from "./PriceSummary";
export function PhotoPanel({
  p,
  t,
  onUpdate,
  onEnd,
  onUpload,
  onCrop,
  onPasteImage,
}: {
  p: ProjectData;
  t: Translation;
  onUpdate: (fn: (p: ProjectData) => ProjectData, key?: string) => void;
  onEnd: () => void;
  onUpload: () => void;
  onCrop: () => void;
  onPasteImage: () => void;
}) {
  return (
    <>
      <div className="section-heading">
        <h2>{t.imageSettings}</h2>
        <span className="step-number">01</span>
      </div>
      <PanelSection title={t.photo} defaultOpen>
        <label>{t.photo}</label>
        <button className="upload-card" data-guide="upload" data-image-target="photo" onClick={onUpload}>
          <div className="upload-icon">
            <ImagePlus size={23} />
          </div>
          <strong>{t.upload}</strong>
          <span>{t.uploadHint}</span>
        </button>
        <button data-image-target="photo" onClick={onPasteImage}><ClipboardPaste size={17}/>{t.pasteImage}</button>
        <p className="field-note">{t.photoImportHint}</p>
        <div className="photo-file">
          <Camera size={14} />
          <span>{p.photo.name}</span>
          <Check size={14} />
        </div>
        <label>
          {t.ratio}
          <select
            value={p.canvas.aspectRatio}
            onChange={(e) => {
              const r = e.target.value as AspectRatio,
                a =
                  r === "Original"
                    ? p.photo.width / p.photo.height
                    : +r.split(":")[0] / +r.split(":")[1];
              onUpdate((v) => {
                if(r==="Custom")return v;
                const height = Math.round(v.canvas.width / a),
                  dy = (height - v.canvas.height) / 2;
                return {
                  ...v,
                  canvas: { width: v.canvas.width, height, aspectRatio: r },
                  labels: v.labels.map((l) => ({
                    ...l,
                    y: Math.max(0, Math.min(height - 80, l.y + dy)),
                    arrowTargetY: Math.max(
                      0,
                      Math.min(height, l.arrowTargetY + dy),
                    ),
                  })),
                };
              });
            }}
          >
            {["Original", "Custom", "16:9", "4:3", "1:1", "4:5", "9:16"].map((r) => (
              <option key={r} value={r} disabled={r==="Custom"}>
                {r === "Original" ? t.original : r==="Custom"?t.cropFree:r}
              </option>
            ))}
          </select>
        </label>
        <button onClick={onCrop}>{t.cropTitle}</button>
      </PanelSection>
      <PanelSection title={t.globalPrice}>

        <label className="switch-row"><span>{t.showTotalPrice}</span><input type="checkbox" className="switch" checked={p.showTotalPrice !== false} onChange={e=>onUpdate(v=>({...v,showTotalPrice:e.target.checked}))}/></label>
        <PriceSummary p={p} t={t}/>
        <div className="segmented prices">
          {(["individual", "show", "hide"] as const).map((v, i) => (
            <button
              key={v}
              className={p.priceMode === v ? "active" : ""}
              onClick={() => onUpdate((p) => ({ ...p, priceMode: v }))}
            >
              {[t.individual, t.showAll, t.hideAll][i]}
            </button>
          ))}
        </div>
        <label>
          {t.priceFormat}
          <select
            value={p.priceFormat}
            onChange={(e) =>
              onUpdate((v) => ({
                ...v,
                priceFormat: e.target.value as typeof p.priceFormat,
              }))
            }
          >
            <option value="yen">¥19,800</option>
            <option value="suffix">19,800円</option>
            <option value="number">19,800</option>
          </select>
        </label>
      </PanelSection>
      <PanelSection title={t.background}>

        {(["brightness", "contrast", "overlay", "blur"] as const).map((key) => (
          <label className="range-label" key={key}>
            {t[key]}
            <output>
              {p.adjustment[key] ?? 0}
              {key === "overlay" ? "%" : key === "blur" ? "px" : ""}
            </output>
            <input
              type="range"
              aria-label={t[key]}
              min={key === "overlay" || key === "blur" ? 0 : -50}
              max={key === "overlay" ? 70 : key === "blur" ? 30 : 50}
              value={p.adjustment[key] ?? 0}
              onChange={(e) =>
                onUpdate(
                  (v) => ({
                    ...v,
                    adjustment: { ...v.adjustment, [key]: +e.target.value },
                  }),
                  key,
                )
              }
              onPointerUp={onEnd}
              onBlur={onEnd}
              onPointerCancel={onEnd}
              onKeyUp={onEnd}
            />
          </label>
        ))}
      </PanelSection>
    </>
  );
}
