import { useState } from "react";
import { Camera, Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";
import type { Translation } from "../lib/i18n";
import "../x-post-preview.css";

export function XPostPreview({ files, t }: { files: { url: string; name: string }[]; t: Translation }) {
  const [mode, setMode] = useState<"scroll" | "grid">("scroll");
  if (!files.length) return null;
  return <section className="x-post-preview" aria-label={t.splitPostPreview}>
    <div className="x-post-preview-heading">
      <h3>{t.splitPostPreview}</h3>
      <div className="segmented x-post-preview-modes" role="group" aria-label={t.splitPostPreview}>
        <button type="button" aria-pressed={mode === "scroll"} className={mode === "scroll" ? "active" : ""} onClick={() => setMode("scroll")}>{t.splitPreviewScroll}</button>
        <button type="button" aria-pressed={mode === "grid"} className={mode === "grid" ? "active" : ""} onClick={() => setMode("grid")}>{t.splitPreviewGrid}</button>
      </div>
    </div>
    <div className="x-post-card">
      <div className="x-post-card-header">
        <span className="x-post-avatar" aria-hidden="true"><Camera size={20}/></span>
        <div><strong>{t.app}</strong><span>@preview</span></div>
      </div>
      <div className={`x-post-images x-post-${mode} x-post-count-${files.length}`} tabIndex={mode === "scroll" ? 0 : undefined} aria-label={t.splitPostPreview}>
        {files.map((file, index) => <figure className="x-post-tile" key={file.name}>
          <img src={file.url} alt={`${index + 1}. ${file.name}`} loading="lazy"/>
          <span className="x-post-order" aria-hidden="true">{index + 1}</span>
        </figure>)}
      </div>
      <div className="x-post-card-footer" aria-hidden="true"><MessageCircle size={17}/><Repeat2 size={18}/><Heart size={17}/><Share2 size={17}/></div>
    </div>
    <p className="field-note x-post-preview-note">{t.splitDisplayNote}</p>
  </section>;
}
