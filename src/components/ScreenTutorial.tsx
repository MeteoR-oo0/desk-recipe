import { useEffect, useRef, useState } from "react";
import { X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import type { Translation } from "../lib/i18n";
import { placeTutorial, type GuideRect } from "../lib/tutorialPlacement";
import "../screen-tutorial.css";

export function ScreenTutorial({ t, step, onStep, onClose }: { t: Translation; step: number; onStep: (n: number) => void; onClose: () => void }) {
  const [compact, setCompact] = useState(false);
  const cardRef=useRef<HTMLElement>(null);
  const [layout,setLayout]=useState<{rect:GuideRect|null;position:{left:number;top:number}}>({rect:null,position:{left:12,top:80}});
  const titles = [t.guidePhotoTitle, t.guideAddTitle, t.guideMoveTitle, t.guideArrowTitle, t.guideResizeTitle, t.guideStyleTitle, t.guideLoopTitle, t.guideExportTitle];
  const descriptions = [t.screenPhoto, t.screenAdd, t.screenMove, t.screenArrow, t.screenResize, t.screenStyle, t.screenLoop, t.screenExport];
  useEffect(() => {
    let frame = 0, revealed=false;
    const update = () => {
      const mobile = window.matchMedia("(max-width: 800px)").matches;
      const key = ["upload", mobile ? "mobile-add" : "desktop-add", "canvas", "canvas", "canvas", "typography", "arrow", "export"][step];
      const el = Array.from(document.querySelectorAll<HTMLElement>(`[data-guide="${key}"]`)).find((e) => e.getBoundingClientRect().width > 0);
      const viewport={width:window.visualViewport?.width ?? window.innerWidth,height:window.visualViewport?.height ?? window.innerHeight};
      let rect:GuideRect|null=null;
      if (el) {
        if(!revealed) {el.scrollIntoView({block:"nearest",inline:"nearest"});revealed=true;}
        const anchorEl=mobile && (key==="typography" || key==="arrow") ? el.closest<HTMLElement>(".mobile-inspector") ?? el : el;
        const r=anchorEl.getBoundingClientRect();
        let left=Math.max(0,r.left),top=Math.max(0,r.top),right=Math.min(viewport.width,r.right),bottom=Math.min(viewport.height,r.bottom);
        for(let parent=anchorEl.parentElement;parent;parent=parent.parentElement) {
          const style=getComputedStyle(parent), bounds=parent.getBoundingClientRect();
          if(/auto|scroll|hidden|clip/.test(style.overflowX)) {left=Math.max(left,bounds.left);right=Math.min(right,bounds.right);}
          if(/auto|scroll|hidden|clip/.test(style.overflowY)) {top=Math.max(top,bounds.top);bottom=Math.min(bottom,bounds.bottom);}
        }
        if(right>left && bottom>top) rect={left,top,width:right-left,height:bottom-top};
      }
      const card=cardRef.current?.getBoundingClientRect();
      const position=placeTutorial(rect,{width:card?.width ?? 300,height:card?.height ?? 180},viewport);
      setLayout(previous=>JSON.stringify(previous)===JSON.stringify({rect,position})?previous:{rect,position});
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    const grid = document.querySelector(".editor-grid"); if (grid) observer.observe(grid);
    const mutation=new MutationObserver(schedule);
    if(grid) mutation.observe(grid,{childList:true,subtree:true});
    if(cardRef.current) observer.observe(cardRef.current);
    window.addEventListener("resize", schedule); window.visualViewport?.addEventListener("resize",schedule); document.addEventListener("scroll", schedule, true);
    // Panel layout and image decoding can change after the guide step switches.
    const timer = setInterval(schedule, 350);
    schedule();
    return () => { cancelAnimationFrame(frame); clearInterval(timer); observer.disconnect(); mutation.disconnect(); window.removeEventListener("resize", schedule); window.visualViewport?.removeEventListener("resize",schedule); document.removeEventListener("scroll", schedule, true); };
  }, [step]);
  return <div className="screen-guide">
    {layout.rect && <div className="screen-guide-highlight" style={layout.rect} aria-hidden="true"/>}
    <section ref={cardRef} style={layout.position} className={"screen-guide-card" + (compact ? " is-compact" : "")} aria-label={t.tutorial}>
      <div className="screen-guide-heading"><span>{t.tutorial} · {step + 1}/8</span><div><button aria-label={compact ? t.guideExpand : t.guideCompact} onClick={() => setCompact(!compact)}>{compact ? <ChevronDown size={18}/> : <ChevronUp size={18}/>}</button><button aria-label={t.close} onClick={onClose}><X size={18}/></button></div></div>
      <h2 aria-live="polite">{titles[step]}</h2>
      {!compact && <><p>{descriptions[step]}</p>{step === 0 && <small>{t.guideActual}</small>}</>}
      <div className="screen-guide-actions"><button disabled={step === 0} onClick={() => onStep(step - 1)} aria-label={t.guidePrevious}><ChevronLeft size={17}/></button><button className="guide-skip" onClick={onClose}>{t.guideSkip}</button><button className="primary" onClick={() => step === 7 ? onClose() : onStep(step + 1)}>{step === 7 ? t.guideFinish : t.guideNext}<ChevronRight size={17}/></button></div>
    </section>
  </div>;
}
