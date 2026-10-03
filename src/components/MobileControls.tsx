import { useEffect, useRef, type ReactNode } from "react";
import { Image, Plus, Layers, Hand, MousePointer2, X, Type, MoveUpRight, Square, ChevronRight, Copy, ClipboardPaste, Trash2, Globe, CircleHelp, Info, Undo2, Redo2 } from "lucide-react";
import type { ProductLabel, ProjectData, Language } from "../types/project";
import type { Translation } from "../lib/i18n";
import "../mobile-editor.css";
import { PriceSummary } from "./PriceSummary";
import { LabelOrderList } from "./LabelOrderList";

export type MobilePanel = "photo" | "labels" | "edit" | "more" | null;
export type LabelSection = "content" | "type" | "arrow" | "box";
export function MobileControls({ p, t, lang, selected, panel, onPanel, section, onSection, mode, onMode, onSelect, onAdd, onDuplicate, onCopy, onPaste, onDelete, onLanguage, onHelp, onAbout, onTable, onMove, canUndo, canRedo, onUndo, onRedo, editing, settings, projectActions }: {
  p: ProjectData; t: Translation; lang: Language; selected?: ProductLabel;
  panel: MobilePanel; onPanel: (p: MobilePanel) => void;
  section: LabelSection; onSection: (s: LabelSection) => void;
  mode: "select" | "add" | "pan"; onMode: (m: "select" | "add" | "pan") => void;
  onSelect: (id: string | null) => void; onAdd: () => void;
  onDuplicate: () => void; onCopy: () => void; onPaste: () => void; onDelete: () => void;
  onLanguage: () => void; onHelp: () => void;
  onAbout: () => void;
  onTable: () => void; onMove: (id:string,to:number) => void;
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void;
  editing: ReactNode; settings: ReactNode; projectActions: ReactNode;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = 0; }, [panel, section, selected?.id]);
  const categories = [
    ["content", t.editContent, Type], ["type", t.typography, Type],
    ["arrow", t.arrow, MoveUpRight], ["box", t.boxSize, Square],
  ] as const;
  function edit(s: LabelSection) { onSection(s); onPanel("edit"); onMode("select"); }
  const title = panel === "photo" ? t.imageSettings : panel === "labels" ? t.labels : panel === "more" ? t.more : selected?.productName || t.labelSettings;
  return <div className="mobile-controls">
    {panel && <section className="mobile-inspector" aria-label={title}>
      <div className="mobile-inspector-heading">
        <h2>{title}</h2>
        <button className="inspector-done" aria-label={t.done} onClick={() => onPanel(null)}><span>{t.done}</span><X size={18}/></button>
      </div>
      {panel === "edit" && selected && <nav className="inspector-categories" aria-label={t.labelSettings}>
        {categories.map(([s, name]) => <button key={s} aria-pressed={section === s} className={section === s ? "active" : ""} onClick={() => onSection(s)}>{name}</button>)}
      </nav>}
      <div className="mobile-inspector-scroll" ref={scroll}>
        {panel === "photo" && settings}
        {panel === "edit" && editing}
        {panel === "labels" && <div className="mobile-label-list">
          <PriceSummary p={p} t={t}/>
          <p className="field-note">{t.listHint}</p>
          <button className="table-open" onClick={onTable}>{t.tableTitle}</button>
          <p className="field-note">{t.reorderHint}</p>
          <LabelOrderList labels={p.labels} selectedId={selected?.id ?? null} t={t} onMove={onMove} onSelect={id=>{onSelect(id);onPanel(null);onMode("select");}}/>
          <button className="primary" onClick={onAdd}><Plus size={18}/>{t.addLabel}</button>
        </div>}
        {panel === "more" && <div className="mobile-more">
          <button onClick={() => { onPanel(null); onAbout(); }}><Info size={18}/>{t.about}</button>
          <div className="mobile-more-history"><button disabled={!canUndo} onClick={onUndo}><Undo2 size={18}/>{t.undo}</button><button disabled={!canRedo} onClick={onRedo}><Redo2 size={18}/>{t.redo}</button></div>
          {selected && <section className="mobile-label-actions" aria-label={t.labelSettings}>
            <strong>{selected.productName}</strong>
            <div>
              <button onClick={onCopy}><Copy size={18}/>{t.copy}</button>
              <button onClick={() => { onDuplicate(); onPanel(null); }}><Copy size={18}/>{t.duplicate}</button>
              <button className="danger" onClick={() => { onDelete(); onPanel(null); }}><Trash2 size={18}/>{t.remove}</button>
            </div>
          </section>}
          <button onClick={onPaste}><ClipboardPaste size={18}/>{t.paste}</button>
          {projectActions}
          <button onClick={onLanguage}><Globe size={18}/>{lang === "ja" ? "English" : "日本語"}</button>
          <button onClick={() => { onPanel(null); onHelp(); }}><CircleHelp size={18}/>{t.tutorial}</button>
          <p className="local-note">{t.localNote}</p>
        </div>}
      </div>
    </section>}
    {!panel && selected && mode !== "add" && <div className="mobile-selection" data-guide="mobile-selection">
      <div className="mobile-selection-name"><strong>{selected.productName || t.productName}</strong><button aria-label={t.deselect} onClick={() => onSelect(null)}><X size={17}/></button></div>
      <div className="mobile-quick-tools">{categories.map(([s, name, Icon]) => <button key={s} onClick={() => edit(s)}><Icon size={18}/>{name}</button>)}</div>
    </div>}
    {mode === "add" && <div className="mobile-add-prompt"><span>{t.addHint}</span><button onClick={() => onMode("select")}>{t.cancel}</button></div>}
    <nav className="mobile-dock" aria-label={t.editor}>
      <button aria-pressed={panel === "photo"} onClick={() => { onMode("select"); onPanel(panel === "photo" ? null : "photo"); }}><Image size={21}/><span>{t.imageTab}</span></button>
      <button className="mobile-add-button" data-guide="mobile-add" aria-pressed={mode === "add"} onClick={onAdd}><Plus size={22}/><span>{t.addLabel}</span></button>
      <button aria-pressed={panel === "labels"} onClick={() => { onMode("select"); onPanel(panel === "labels" ? null : "labels"); }}><Layers size={21}/><span>{t.labelList}</span></button>
      <button aria-pressed={mode === "pan"} onClick={() => { onPanel(null); onMode(mode === "pan" ? "select" : "pan"); }}>{mode === "pan" ? <MousePointer2 size={21}/> : <Hand size={21}/>}<span>{mode === "pan" ? t.select : t.pan}</span></button>
    </nav>
  </div>;
}
