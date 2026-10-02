import {
  Camera,
  Undo2,
  Redo2,
  Download,
  Globe,
  ChevronRight,
} from "lucide-react";
import type { Language, ProjectData } from "../types/project";
import type { Translation } from "../lib/i18n";
export function EditorHeader({
  p,
  t,
  lang,
  canUndo,
  canRedo,
  busy,
  ready,
  onUndo,
  onRedo,
  onLanguageChange,
  onExport,
}: {
  p: ProjectData;
  t: Translation;
  lang: Language;
  canUndo: boolean;
  canRedo: boolean;
  busy: boolean;
  ready: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onLanguageChange: () => void;
  onExport: () => void;
}) {
  return (
    <header className="app-header">
      <div className="brandmark">
        <span className="brand-icon">
          <Camera size={21} />
        </span>
        <div>
          <h1>
            {t.app}
            <span className="beta">STUDIO</span>
          </h1>
          <span className="brand-caption">{t.editor}</span>
        </div>
      </div>
      <div className="project-heading">
        {t.untitled}
        <ChevronRight size={13} />
        <span>{p.photo.id.startsWith("sample") ? t.sample : p.photo.name}</span>
      </div>
      <div className="header-actions">
        <div className="history-buttons">
          <button
            title={t.undo}
            aria-label={t.undo}
            disabled={!canUndo}
            onClick={onUndo}
          >
            <Undo2 size={19} />
          </button>
          <button
            title={t.redo}
            aria-label={t.redo}
            disabled={!canRedo}
            onClick={onRedo}
          >
            <Redo2 size={19} />
          </button>
        </div>
        <button className="language-button" onClick={() => onLanguageChange()}>
          <Globe size={16} />
          {lang === "ja" ? "EN" : "日本語"}
        </button>
        <button
          className="primary header-export"
          disabled={busy || !ready}
          onClick={() => onExport()}
        >
          <Download size={17} />
          {t.export}
        </button>
      </div>
    </header>
  );
}
