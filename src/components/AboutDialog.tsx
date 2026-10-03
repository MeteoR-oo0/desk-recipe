import { useState } from "react";
import { Camera, Code2, HardDrive, Sparkles, ExternalLink, CircleHelp } from "lucide-react";
import { Modal } from "./Modal";
import { LegalDialog } from "./LegalDialog";
import { legalText, type LegalPage } from "../lib/legal";
import type { Language } from "../types/project";
import type { Translation } from "../lib/i18n";
import "../about.css";

export function AboutDialog({ t, language, onClose, onHelp }: { t: Translation; language: Language; onClose: () => void; onHelp: () => void }) {
  const [page, setPage] = useState<LegalPage | null>(null);
  const [documentLanguage, setDocumentLanguage] = useState(language);
  if (page) return <LegalDialog page={page} language={documentLanguage} onLanguage={setDocumentLanguage} onBack={() => setPage(null)} onClose={onClose}/>;
  return <Modal title={t.about} closeText={t.close} onClose={onClose}>
    <div className="about-content">
      <div className="about-brand"><span><Camera size={26}/></span><div><strong>{t.app}</strong><small>DESK RECIPE STUDIO</small></div></div>
      <p className="about-creator"><span>{t.aboutCreator}</span><strong>めてお</strong><span>@Meteor_oo0</span></p>
      <p className="about-intro">{t.aboutDescription}</p>
      <section className="about-credit"><span><Code2 size={18}/>Made with Codex</span><p>{t.aboutCredit}</p></section>
      <section className="about-section"><h3><Sparkles size={17}/>{t.aboutFeaturesTitle}</h3><p>{t.aboutFeatures}</p></section>
      <section className="about-section"><h3><HardDrive size={17}/>{t.aboutStorageTitle}</h3><p>{t.aboutStorage}</p><p>{t.aboutTransfer}</p></section>
      <div className="about-actions"><button onClick={onHelp}><CircleHelp size={17}/>{t.tutorial}</button><a href="https://github.com/MeteoR-oo0/desk-recipe" target="_blank" rel="noopener noreferrer">{t.aboutSource}<ExternalLink size={15}/></a></div>
      <nav className="about-legal" aria-label={language === "ja" ? "ポリシーと免責事項" : "Policies and disclaimer"}>
        <button onClick={() => setPage("privacy")}>{legalText[language].privacy.title}</button>
        <button onClick={() => setPage("disclaimer")}>{legalText[language].disclaimer.title}</button>
      </nav>
      <button className="primary about-close" onClick={onClose}>{t.close}</button>
    </div>
  </Modal>;
}
