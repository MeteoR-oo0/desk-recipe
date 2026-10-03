import { ArrowLeft, ExternalLink } from "lucide-react";
import { Modal } from "./Modal";
import { legalText, type LegalPage } from "../lib/legal";
import type { Language } from "../types/project";

export function LegalDialog({ page, language, onLanguage, onBack, onClose }: {
  page: LegalPage; language: Language; onLanguage: (language: Language) => void;
  onBack: () => void; onClose: () => void;
}) {
  const copy = legalText[language], document = copy[page];
  return <Modal key={`${page}-${language}`} title={document.title} closeText={copy.close} onClose={onClose}>
    <article className="legal-content" lang={language}>
      <div className="legal-navigation">
        <button onClick={onBack}><ArrowLeft size={16}/>{copy.back}</button>
        <div className="segmented" role="group" aria-label={copy.language}>
          <button className={language === "ja" ? "active" : ""} aria-pressed={language === "ja"} onClick={() => onLanguage("ja")}>日本語</button>
          <button className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => onLanguage("en")}>English</button>
        </div>
      </div>
      <p className="legal-date">{copy.date}</p>
      <p>{document.introduction}</p>
      {document.sections.map(section => <section key={section.title}>
        <h3>{section.title}</h3>
        {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        {section.links && <ul className="legal-links">{section.links.map(link => <li key={link.href}>
          <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}<ExternalLink size={14}/></a>
        </li>)}</ul>}
      </section>)}
      <button className="primary about-close" onClick={onBack}>{copy.back}</button>
    </article>
  </Modal>;
}
