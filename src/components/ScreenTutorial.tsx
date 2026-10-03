import { useEffect, useState } from "react";
import { X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import type { Translation } from "../lib/i18n";
import "../screen-tutorial.css";

export function ScreenTutorial({ t, step, onStep, onClose }: { t: Translation; step: number; onStep: (n: number) => void; onClose: () => void }) {
  const [compact, setCompact] = useState(false);
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const titles = [t.guidePhotoTitle, t.guideAddTitle, t.guideMoveTitle, t.guideArrowTitle, t.guideResizeTitle, t.guideStyleTitle, t.guideLoopTitle, t.guideExportTitle];
  const descriptions = [t.screenPhoto, t.screenAdd, t.screenMove, t.screenArrow, t.screenResize, t.screenStyle, t.screenLoop, t.screenExport];
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const mobile = window.matchMedia("(max-width: 800px)").matches;
      const key = ["upload", mobile ? "mobile-add" : "desktop-add", "canvas", "canvas", "canvas", "typography", "arrow", "export"][step];
      const el = Array.from(document.querySelectorAll<HTMLElement>(`[data-guide="${key}"]`)).find((e) => e.getBoundingClientRect().width > 0);
      if (el) { const r = el.getBoundingClientRect(); setRect({ left: r.left, top: r.top, width: r.width, height: r.height }); }
      else setRect(null);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    const grid = document.querySelector(".editor-grid"); if (grid) observer.observe(grid);
    window.addEventListener("resize", schedule); document.addEventListener("scroll", schedule, true);
    // Panel layout and image decoding can change after the guide step switches.
    const timer = setInterval(schedule, 350);
    schedule();
    return () => { cancelAnimationFrame(frame); clearInterval(timer); observer.disconnect(); window.removeEventListener("resize", schedule); document.removeEventListener("scroll", schedule, true); };
  }, [step]);
  return <div className="screen-guide">
    {rect && <div className="screen-guide-highlight" style={rect} aria-hidden="true"/>}
    <section className={"screen-guide-card" + (compact ? " is-compact" : "")} aria-label={t.tutorial}>
      <div className="screen-guide-heading"><span>{t.tutorial} · {step + 1}/8</span><div><button aria-label={compact ? t.guideExpand : t.guideCompact} onClick={() => setCompact(!compact)}>{compact ? <ChevronDown size={18}/> : <ChevronUp size={18}/>}</button><button aria-label={t.close} onClick={onClose}><X size={18}/></button></div></div>
      <h2 aria-live="polite">{titles[step]}</h2>
      {!compact && <><p>{descriptions[step]}</p>{step === 0 && <small>{t.guideActual}</small>}</>}
      <div className="screen-guide-actions"><button disabled={step === 0} onClick={() => onStep(step - 1)} aria-label={t.guidePrevious}><ChevronLeft size={17}/></button><button className="guide-skip" onClick={onClose}>{t.guideSkip}</button><button className="primary" onClick={() => step === 7 ? onClose() : onStep(step + 1)}>{step === 7 ? t.guideFinish : t.guideNext}<ChevronRight size={17}/></button></div>
    </section>
  </div>;
}
