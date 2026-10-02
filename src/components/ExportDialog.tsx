import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Modal } from "./Modal";
import type { ProjectData } from "../types/project";
import type { Translation } from "../lib/i18n";
import { exportDimensions } from "../lib/project";
export function ExportDialog({
  p,
  t,
  onClose,
  onExport,
}: {
  p: ProjectData;
  t: Translation;
  onClose: () => void;
  onExport: (
    f: "png" | "jpeg",
    r: "standard" | "original",
  ) => Promise<Blob | undefined>;
}) {
  const [format, setFormat] = useState<"png" | "jpeg">("png"),
    [resolution, setResolution] = useState<"standard" | "original">("standard"),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState<string | null>(null),
    d = exportDimensions(p, resolution);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  return (
    <Modal
      title={t.exportTitle}
      closeText={t.close}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p>{t.exportDesc}</p>
      {preview && (
        <img className="export-preview" src={preview} alt={t.exportTitle} />
      )}
      <section className="form-section">
        <label>
          {t.format}
          <div className="segmented">
            {(["png", "jpeg"] as const).map((f) => (
              <button
                aria-label={f.toUpperCase()}
                className={f === format ? "active" : ""}
                key={f}
                onClick={() => {
                  setFormat(f);
                  setPreview(null);
                }}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </label>
        <label>
          {t.resolution}
          <select
            value={resolution}
            onChange={(e) => {
              setResolution(e.target.value as typeof resolution);
              setPreview(null);
            }}
          >
            <option value="standard">{t.standard} — 1920px</option>
            <option value="original">{t.source}</option>
          </select>
        </label>
        <div className="export-dimensions">
          <strong>
            {d.width} <span>×</span> {d.height}
          </strong>
          <span>px · {format.toUpperCase()}</span>
        </div>
      </section>
      <p className="field-note">{t.exportNote}</p>
      <div className="modal-actions">
        <button disabled={busy} onClick={onClose}>
          {t.cancel}
        </button>
        {preview ? (
          <a
            className="primary download-link"
            href={preview}
            download={"desk-recipe." + (format === "jpeg" ? "jpg" : "png")}
          >
            <Download size={16} />
            {t.download}
          </a>
        ) : (
          <button
            disabled={busy}
            className="primary"
            onClick={async () => {
              setBusy(true);
              try {
                const blob = await onExport(format, resolution);
                if (blob) setPreview(URL.createObjectURL(blob));
              } finally {
                setBusy(false);
              }
            }}
          >
            <Download size={16} />
            {busy ? t.exporting : t.download}
          </button>
        )}
      </div>
    </Modal>
  );
}
