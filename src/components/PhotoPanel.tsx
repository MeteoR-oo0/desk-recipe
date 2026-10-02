import { Camera, Check, ImagePlus } from "lucide-react";
import type { ProjectData, AspectRatio } from "../types/project";
import type { Translation } from "../lib/i18n";
export function PhotoPanel({
  p,
  t,
  onUpdate,
  onEnd,
  onUpload,
}: {
  p: ProjectData;
  t: Translation;
  onUpdate: (fn: (p: ProjectData) => ProjectData, key?: string) => void;
  onEnd: () => void;
  onUpload: () => void;
}) {
  return (
    <>
      <div className="section-heading">
        <h2>{t.imageSettings}</h2>
        <span className="step-number">01</span>
      </div>
      <section className="form-section">
        <label>{t.photo}</label>
        <button className="upload-card" onClick={onUpload}>
          <div className="upload-icon">
            <ImagePlus size={23} />
          </div>
          <strong>{t.upload}</strong>
          <span>{t.uploadHint}</span>
        </button>
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
                const height = Math.round(1200 / a),
                  dy = (height - v.canvas.height) / 2;
                return {
                  ...v,
                  canvas: { width: 1200, height, aspectRatio: r },
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
            {["Original", "16:9", "4:3", "1:1", "4:5", "9:16"].map((r) => (
              <option key={r} value={r}>
                {r === "Original" ? t.original : r}
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="form-section">
        <h3>{t.globalPrice}</h3>
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
      </section>
      <section className="form-section">
        <h3>{t.background}</h3>
        {(["brightness", "contrast", "overlay"] as const).map((key) => (
          <label className="range-label" key={key}>
            {t[key]}
            <output>
              {p.adjustment[key]}
              {key === "overlay" ? "%" : ""}
            </output>
            <input
              type="range"
              min={key === "overlay" ? 0 : -50}
              max={key === "overlay" ? 70 : 50}
              value={p.adjustment[key]}
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
      </section>
    </>
  );
}
