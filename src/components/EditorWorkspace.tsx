import {
  Plus,
  MousePointer2,
  Hand,
  Minus,
  Maximize,
  Layers,
  CircleHelp,
} from "lucide-react";
import type { ProjectData, ProductLabel } from "../types/project";
import type { Translation } from "../lib/i18n";
import { CanvasEditor, type CanvasHandle } from "./CanvasEditor";
import { PriceSummary } from "./PriceSummary";
export function EditorWorkspace({
  p,
  t,
  selectedId,
  setSelectedId,
  mode,
  setMode,
  zoom,
  setZoom,
  handle,
  patch,
  add,
  status,
  onHelp,
}: {
  p: ProjectData;
  t: Translation;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  mode: "select" | "add" | "pan";
  setMode: (v: "select" | "add" | "pan") => void;
  zoom: number;
  setZoom: (v: number) => void;
  handle: React.RefObject<CanvasHandle>;
  patch: (id: string, patch: Partial<ProductLabel>) => void;
  add: (x: number, y: number) => void;
  status: "saving" | "saved" | "error";
  onHelp: () => void;
}) {
  return (
    <section className="workspace">
      <div className="workspace-toolbar">
        <div className="tools">
          <button
            className={mode === "select" ? "active" : ""}
            aria-label={t.select}
            title={t.select}
            onClick={() => setMode("select")}
          >
            <MousePointer2 size={17} />
          </button>
          <button
            className={mode === "pan" ? "active" : ""}
            aria-label={t.pan}
            title={t.pan}
            onClick={() => setMode("pan")}
          >
            <Hand size={17} />
          </button>
          <span className="toolbar-divider" />
          <button
            className={"add-tool " + (mode === "add" ? "active" : "")}
            data-guide="desktop-add"
            onClick={() => setMode("add")}
          >
            <Plus size={17} />
            {t.addLabel}
          </button>
        </div>
        <div className="zoom-tools">
          <button
            aria-label={t.zoomOut}
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          >
            <Minus size={15} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label={t.zoomIn}
            onClick={() => setZoom(Math.min(4, zoom + 0.25))}
          >
            <Plus size={15} />
          </button>
          <button
            title={t.fit}
            aria-label={t.fit}
            onClick={() => handle.current.resetView?.()}
          >
            <Maximize size={15} />
          </button>
        </div>
      </div>
      <div className="canvas-area">
        <div className="mobile-canvas-tools"><div className="mobile-cost-status"><span className="status-dot" role="img" aria-label={status === "saved" ? t.saved : status === "saving" ? t.saving : t.saveError} title={status === "saved" ? t.saved : status === "saving" ? t.saving : t.saveError}/><PriceSummary p={p} t={t} compact/></div><div className="zoom-tools"><button aria-label={t.zoomOut} onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}><Minus size={16}/></button><span>{Math.round(zoom * 100)}%</span><button aria-label={t.zoomIn} onClick={() => setZoom(Math.min(6, zoom + 0.25))}><Plus size={16}/></button><button aria-label={t.fit} onClick={() => handle.current.resetView?.()}><Maximize size={16}/></button></div></div>
        <div className="canvas-caption">
          <span>
            {p.canvas.aspectRatio}
            <span className="dot-separator">·</span>
            {p.photo.id.startsWith("sample") ? t.sample : p.photo.name}
          </span>
          <span>
            <Layers size={13} />
            {p.labels.length} {t.labels}
          </span>
        </div>
        <CanvasEditor
          project={p}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onChange={patch}
          onAdd={add}
          mode={mode}
          zoom={zoom}
          onZoom={setZoom}
          handle={handle}
        />
        <div className="canvas-tip">
          <MousePointer2 size={14} />
          <span>{mode === "add" ? t.addHint : t.hint}</span>
        </div>
      </div>
      <div className="workspace-footer">
        <span>
          <span className="status-dot" />
          {status === "saved"
            ? t.saved
            : status === "saving"
              ? t.saving
              : t.saveError}
        </span>
        <button className="help-button" onClick={() => onHelp()}>
          <CircleHelp size={15} />
          {t.help}
        </button>
      </div>
    </section>
  );
}
