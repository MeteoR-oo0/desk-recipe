import { useEffect, useRef, useState } from "react";
import { Download, Plus, ChevronRight } from "lucide-react";
import { EditorHeader } from "./components/EditorHeader";
import { EditorWorkspace } from "./components/EditorWorkspace";
import { makeLabel, type Language, type ProductLabel } from "./types/project";
import { getText } from "./lib/i18n";
import { useProjectState } from "./hooks/useProjectState";
import { useWebMCP } from "./hooks/useWebMCP";
import { useInstall } from "./hooks/useInstall";
import { blobToDataURL, downloadBlob, parseProject } from "./lib/project";
import { exportImage } from "./lib/exportImage";
import { ExportDialog } from "./components/ExportDialog";
import { Modal } from "./components/Modal";
import { parseClipboardLabel, serializeLabel } from "./lib/clipboard";
import { type CanvasHandle } from "./components/CanvasEditor";
import { LabelPanel } from "./components/LabelPanel";
import { PhotoPanel } from "./components/PhotoPanel";
export default function App() {
  const [lang, setLang] = useState<Language>(() => {
      try {
        return localStorage.getItem("desk-recipe-language") === "en"
          ? "en"
          : "ja";
      } catch {
        return "ja";
      }
    }),
    [selectedId, setSelectedId] = useState<string | null>("keyboard"),
    [mode, setMode] = useState<"select" | "add" | "pan">("select"),
    [zoom, setZoom] = useState(1),
    [tab, setTab] = useState("label");
  const history = useProjectState(),
    p = history.value,
    t = getText(lang),
    handle = useRef<CanvasHandle>({ stage: null, image: null });
  const selected = p.labels.find((l) => l.id === selectedId),
    patch = (id: string, patch: Partial<ProductLabel>, key?: string) =>
      history.update(
        (v) => ({
          ...v,
          labels: v.labels.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        }),
        key ? `${id}:${key}` : undefined,
      );
  const add = (x: number, y: number, info: Partial<ProductLabel> = {}) => {
    if (!history.ready) throw Error("Project is loading");
    const l = {
      ...makeLabel(
        Math.max(0, Math.min(p.canvas.width - 330, x)),
        Math.max(0, Math.min(p.canvas.height - 100, y)),
      ),
      ...info,
    };
    l.arrowTargetX = Math.min(p.canvas.width, l.arrowTargetX);
    l.arrowTargetY = Math.min(p.canvas.height, l.arrowTargetY);
    history.update((v) => ({ ...v, labels: [...v.labels, l] }));
    setSelectedId(l.id);
    setMode("select");
    setTab("label");
    return l.id;
  };
  const duplicate = () => {
    if (selected) {
      const l = {
        ...selected,
        id: crypto.randomUUID(),
        x: selected.x + 32,
        y: selected.y + 32,
        arrowTargetX: selected.arrowTargetX + 32,
        arrowTargetY: selected.arrowTargetY + 32,
        loopPosition: selected.loopPosition
          ? { x: selected.loopPosition.x + 32, y: selected.loopPosition.y + 32 }
          : undefined,
      };
      history.update((v) => ({ ...v, labels: [...v.labels, l] }));
      setSelectedId(l.id);
    }
  };
  const remove = () => {
    history.update((v) => ({
      ...v,
      labels: v.labels.filter((l) => l.id !== selectedId),
    }));
    setSelectedId(null);
  };
  const photoInput = useRef<HTMLInputElement>(null),
    projectInput = useRef<HTMLInputElement>(null),
    [dialog, setDialog] = useState<"export" | "help" | null>(null),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState<{ text: string; error?: boolean } | null>(
      null,
    ),
    install = useInstall();
  useEffect(() => {
    try {
      localStorage.setItem("desk-recipe-language", lang);
    } catch {}
    document.documentElement.lang = lang;
    document.title =
      lang === "ja"
        ? "デスクレシピ — フォトエディター"
        : "Desk Recipe — Photo editor";
  }, [lang]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const editing = (e.target as HTMLElement).closest(
        "input,textarea,select,[contenteditable]",
      );
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !editing) {
        e.preventDefault();
        e.shiftKey ? history.redo() : history.undo();
      }
      if (e.key === "Escape") setMode("select");
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !editing &&
        selectedId &&
        !dialog
      ) {
        e.preventDefault();
        remove();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [history.undo, history.redo, selectedId, dialog]);
  useWebMCP(
    p,
    add,
    (id, changes) => patch(id, changes),
    (mode) => history.update((v) => ({ ...v, priceMode: mode })),
  );
  const upload = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setToast({ text: t.uploadError, error: true });
      return;
    }
    setBusy(true);
    try {
      await history.setPhoto(file, file.name);
      setSelectedId(null);
      setZoom(1);
      setMode("add");
      setTab("photo");
    } catch {
      setToast({ text: t.photoError, error: true });
    } finally {
      setBusy(false);
    }
  };
  const saveJSON = async () => {
    setBusy(true);
    try {
      const original = await history.getOriginal(
          p.photo.id,
          p.photo.previewSrc,
        ),
        image = await blobToDataURL(original);
      downloadBlob(
        new Blob([JSON.stringify({ project: p, image }, null, 2)], {
          type: "application/json",
        }),
        "desk-recipe.json",
      );
      setToast({ text: t.projectSaved });
    } catch {
      setToast({ text: t.saveError, error: true });
    } finally {
      setBusy(false);
    }
  };
  const openJSON = async (file: File) => {
    setBusy(true);
    try {
      const data = parseProject(await file.text()),
        blob = await fetch(data.image).then((r) => r.blob());
      await history.setPhoto(blob, data.project.photo.name, data.project);
      setSelectedId(data.project.labels[0]?.id ?? null);
      setZoom(1);
      setToast({ text: t.opened });
    } catch {
      setToast({ text: t.projectError, error: true });
    } finally {
      setBusy(false);
    }
  };
  const doExport = async (
    format: "png" | "jpeg",
    resolution: "standard" | "original",
  ) => {
    try {
      if (!handle.current.stage) throw Error("Not ready");
      const original = await history.getOriginal(
          p.photo.id,
          p.photo.previewSrc,
        ),
        blob = await exportImage(
          handle.current.stage,
          p,
          original,
          format,
          resolution,
        );
      downloadBlob(blob, "desk-recipe." + (format === "jpeg" ? "jpg" : "png"));
      setToast({ text: t.exportDone });
      return blob;
    } catch {
      setToast({ text: t.exportError, error: true });
    }
  };
  const labelClipboard = useRef<{ label: ProductLabel; count: number } | null>(
    null,
  );
  const pasteLabel = (label: ProductLabel) => {
    if (labelClipboard.current?.label.id !== label.id)
      labelClipboard.current = { label, count: 0 };
    const count = ++labelClipboard.current!.count,
      dx = 32 * count,
      dy = 32 * count,
      l = {
        ...label,
        id: crypto.randomUUID(),
        x: Math.max(
          0,
          Math.min(p.canvas.width - (label.boxWidth ?? 330), label.x + dx),
        ),
        y: Math.max(0, Math.min(p.canvas.height - 100, label.y + dy)),
        arrowTargetX: Math.max(
          0,
          Math.min(p.canvas.width, label.arrowTargetX + dx),
        ),
        arrowTargetY: Math.max(
          0,
          Math.min(p.canvas.height, label.arrowTargetY + dy),
        ),
        loopPosition: label.loopPosition
          ? { x: label.loopPosition.x + dx, y: label.loopPosition.y + dy }
          : undefined,
      };
    history.update((v) => ({ ...v, labels: [...v.labels, l] }));
    setSelectedId(l.id);
    setTab("label");
    setToast({ text: t.pasted });
  };
  const copyLabel = async () => {
    if (!selected) return;
    labelClipboard.current = { label: { ...selected }, count: 0 };
    try {
      await navigator.clipboard.writeText(serializeLabel(selected));
      setToast({ text: t.copied });
    } catch {
      setToast({ text: t.copiedLocal });
    }
  };
  const pasteFromClipboard = async () => {
    if (labelClipboard.current) {
      pasteLabel(labelClipboard.current.label);
      return;
    }
    let label: ProductLabel | null = null;
    try {
      label = parseClipboardLabel(await navigator.clipboard.readText());
    } catch {}
    if (label) pasteLabel(label);
    else setToast({ text: t.pasteError, error: true });
  };
  useEffect(() => {
    const isEditing = (e: Event) =>
      !!(e.target as HTMLElement)?.closest(
        "input,textarea,select,[contenteditable]",
      );
    const copy = (e: ClipboardEvent) => {
      if (!selected || isEditing(e) || dialog) return;
      e.preventDefault();
      labelClipboard.current = { label: { ...selected }, count: 0 };
      e.clipboardData?.setData("text/plain", serializeLabel(selected));
      setToast({ text: t.copied });
    };
    const paste = (e: ClipboardEvent) => {
      if (isEditing(e) || dialog) return;
      const label =
        parseClipboardLabel(e.clipboardData?.getData("text/plain") ?? "") ??
        labelClipboard.current?.label;
      if (label) {
        e.preventDefault();
        pasteLabel(label);
      }
    };
    window.addEventListener("copy", copy);
    window.addEventListener("paste", paste);
    return () => {
      window.removeEventListener("copy", copy);
      window.removeEventListener("paste", paste);
    };
  }, [selected, p.canvas, dialog, t]);
  const projectActions = (
    <div className="project-actions">
      <button disabled={busy} onClick={saveJSON}>
        {t.saveProject}
      </button>
      <button disabled={busy} onClick={() => projectInput.current?.click()}>
        {t.openProject}
      </button>
      {install.available && (
        <button onClick={install.install}>{t.install}</button>
      )}
    </div>
  );
  const settings = (
    <PhotoPanel
      p={p}
      t={t}
      onUpdate={history.update}
      onEnd={history.endGroup}
      onUpload={() => photoInput.current?.click()}
    />
  );
  const editing = (
    <LabelPanel
      label={selected}
      t={t}
      priceMode={p.priceMode}
      priceFormat={p.priceFormat}
      onChange={(p, k) => selected && patch(selected.id, p, k)}
      onDuplicate={duplicate}
      onDelete={remove}
      onCopy={() => void copyLabel()}
      onPaste={() => void pasteFromClipboard()}
      onEnd={history.endGroup}
    />
  );
  return (
    <div className="app-shell">
      <input
        ref={photoInput}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />
      <input
        ref={projectInput}
        type="file"
        hidden
        accept=".json,application/json"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void openJSON(f);
          e.target.value = "";
        }}
      />
      <EditorHeader
        p={p}
        t={t}
        lang={lang}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        busy={busy}
        ready={history.ready}
        onUndo={history.undo}
        onRedo={history.redo}
        onLanguageChange={() => setLang(lang === "ja" ? "en" : "ja")}
        onExport={() => setDialog("export")}
      />
      <main className="editor-grid" inert={!history.ready || busy}>
        <aside className="left-sidebar">
          {settings}
          <section className="label-list">
            <div className="section-heading">
              <h3>{t.labels}</h3>
              <span className="count">{p.labels.length}</span>
            </div>
            {p.labels.map((l, i) => (
              <button
                className={
                  "label-list-item " + (selectedId === l.id ? "selected" : "")
                }
                key={l.id}
                onClick={() => {
                  setSelectedId(l.id);
                  setTab("label");
                }}
              >
                <span className="label-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <small>{l.brand}</small>
                  <strong>{l.productName || "Product Name"}</strong>
                </span>
                <ChevronRight size={14} />
              </button>
            ))}
            <button className="subtle add-list" onClick={() => setMode("add")}>
              <Plus size={15} />
              {t.addLabel}
            </button>
          </section>
          {projectActions}
          <p className="local-note">{t.localNote}</p>
        </aside>
        <EditorWorkspace
          p={p}
          t={t}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          mode={mode}
          setMode={setMode}
          zoom={zoom}
          setZoom={setZoom}
          handle={handle}
          patch={patch}
          add={add}
          status={history.status}
          onHelp={() => setDialog("help")}
        />
        <aside className="right-sidebar">{editing}</aside>
        <div className="mobile-sheet">
          <div className="sheet-grip" />
          <nav className="mobile-tabs">
            {(["photo", "label", "export"] as const).map((v, i) => (
              <button
                key={v}
                className={tab === v ? "active" : ""}
                onClick={() => setTab(v)}
              >
                {[t.imageTab, t.editTab, t.exportTab][i]}
              </button>
            ))}
          </nav>
          <div className="mobile-sheet-content">
            {tab === "photo" ? (
              settings
            ) : tab === "label" ? (
              editing
            ) : (
              <div className="mobile-export">
                <button className="primary" onClick={() => setDialog("export")}>
                  <Download size={17} />
                  {t.export}
                </button>
                {projectActions}
                <p className="local-note">{t.localNote}</p>
              </div>
            )}
          </div>
        </div>
      </main>
      {dialog === "export" && (
        <ExportDialog
          p={p}
          t={t}
          onClose={() => setDialog(null)}
          onExport={doExport}
        />
      )}{" "}
      {dialog === "help" && (
        <Modal
          title={t.helpTitle}
          closeText={t.close}
          onClose={() => setDialog(null)}
        >
          <ol className="help-steps">
            {[t.help1, t.help2, t.help3, t.help4].map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>
            {t.shortcuts}: Ctrl / ⌘ + Z · Ctrl / ⌘ + Shift + Z · Ctrl / ⌘ + C /
            V
          </p>
        </Modal>
      )}
      {toast && (
        <div className={"toast " + (toast.error ? "error" : "")} role="status">
          {toast.text}
        </div>
      )}
      {(busy || !history.ready) && (
        <div className="busy-indicator" role="status">
          {history.ready ? t.saving : t.loading}
        </div>
      )}
    </div>
  );
}
