import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Check,
} from "lucide-react";
import { Modal } from "./Modal";
import { CanvasEditor, type CanvasHandle } from "./CanvasEditor";
import { FontPicker } from "./FontPicker";
import {
  initialProject,
  makeLabel,
  type ProductLabel,
  type ProjectData,
} from "../types/project";
import type { Translation } from "../lib/i18n";
import "../tutorial.css";
function demoLabel(): ProductLabel {
  return {
    ...makeLabel(70, 65),
    id: "tutorial-label",
    brand: "Brand",
    productName: "Product Name",
    price: "¥19,800",
    showPrice: false,
    boxWidth: 240,
    fontSizeBrand: 17,
    fontSizeProduct: 32,
    fontSizePrice: 17,
    textColor: "#205640",
    arrowColor: "#377460",
    arrowWidth: 3,
    arrowTargetX: 350,
    arrowTargetY: 280,
  };
}
function demoProject(): ProjectData {
  return {
    ...initialProject(),
    canvas: { width: 600, height: 360, aspectRatio: "16:9" as const },
    labels: [],
    adjustment: { brightness: 0, contrast: 0, overlay: 0 },
  };
}
export function Tutorial({
  t,
  onClose,
}: {
  t: Translation;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0),
    [project, setProject] = useState(demoProject),
    [zoom, setZoom] = useState(1.25),
    [mode, setMode] = useState<"select" | "add">("select");
  const handle = useRef<CanvasHandle>({ stage: null, image: null }),
    progressRef = useRef<HTMLDivElement>(null);
  const titles = [
    t.guidePhotoTitle,
    t.guideAddTitle,
    t.guideMoveTitle,
    t.guideArrowTitle,
    t.guideResizeTitle,
    t.guideStyleTitle,
    t.guideLoopTitle,
    t.guideExportTitle,
  ];
  const descriptions = [
    t.guidePhoto,
    t.guideAdd,
    t.guideMove,
    t.guideArrow,
    t.guideResize,
    t.guideStyle,
    t.guideLoop,
    t.guideExport,
  ];
  useEffect(() => {
    setMode("select");
    if (step >= 2)
      setProject((p) => ({
        ...p,
        labels: p.labels.length ? p.labels : [demoLabel()],
      }));
    if (step === 6)
      setProject((p) => ({
        ...p,
        labels: [{ ...(p.labels[0] ?? demoLabel()), arrowType: "swirl" }],
      }));
  }, [step]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const modal = progressRef.current?.closest(".modal");
      if (modal) modal.scrollTop = 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [step]);
  const change = (patch: Partial<ProductLabel>) =>
    setProject((p) => ({
      ...p,
      labels: p.labels.map((l) => ({ ...l, ...patch })),
    }));
  const reset = () => {
    setProject({
      ...demoProject(),
      labels: [{ ...demoLabel(), arrowType: step === 6 ? "swirl" : "curve" }],
    });
    setZoom(1.25);
    handle.current.resetView?.();
  };
  const finish = () => {
    try {
      localStorage.setItem("desk-recipe-tutorial-v1", "seen");
    } catch {}
    onClose();
  };
  return (
    <Modal title={titles[step]} closeText={t.close} onClose={finish}>
      <div
        ref={progressRef}
        className="tutorial-progress"
        aria-label={t.tutorial}
      >
        <span aria-live="polite">
          {step + 1} / {titles.length}
        </span>
        <div>
          {titles.map((title, index) => (
            <span key={title} className={index <= step ? "done" : ""} />
          ))}
        </div>
      </div>
      <p className="tutorial-description">{descriptions[step]}</p>
      {step === 0 ? (
        <div className="tutorial-photo">
          <img src={project.photo.previewSrc} alt={t.sample} />
          <span>{t.guidePracticeNote}</span>
        </div>
      ) : step === 7 ? (
        <div className="tutorial-export-example">
          <div>
            <strong>PNG / JPEG</strong>
            <span>1920px+</span>
          </div>
          <p>{t.guideSave}</p>
        </div>
      ) : (
        <>
          <div className="tutorial-demo-toolbar">
            <span>{t.guidePractice}</span>
            {step === 1 ? (
              <button
                className={mode === "add" ? "active" : ""}
                onClick={() => setMode("add")}
              >
                <Plus size={15} />
                {t.addLabel}
              </button>
            ) : (
              <button onClick={reset} aria-label={t.guideReset}>
                <RotateCcw size={15} />
                {t.guideReset}
              </button>
            )}
          </div>
          <div className="tutorial-demo" aria-label={t.guidePractice}>
            <CanvasEditor
              project={project}
              selectedId={project.labels[0]?.id ?? null}
              onSelect={() => {}}
              onChange={(_, patch) => change(patch)}
              onAdd={(x, y) => {
                setProject((p) => ({
                  ...p,
                  labels: [
                    {
                      ...demoLabel(),
                      x: Math.max(0, Math.min(330, x)),
                      y: Math.max(0, Math.min(190, y)),
                    },
                  ],
                }));
                setMode("select");
              }}
              mode={mode}
              zoom={zoom}
              onZoom={setZoom}
              handle={handle}
            />
          </div>
          {step === 3 && (
            <div className="tutorial-handle-legend">
              <span>
                <i className="square" />
                {t.guideStartHandle}
              </span>
              <span>
                <i className="round" />
                {t.guideTargetHandle}
              </span>
            </div>
          )}
          {step === 4 && (
            <div className="tutorial-handle-legend">
              <span>
                <i className="resize" />
                {t.guideResizeHandle}
              </span>
            </div>
          )}
          {step === 5 && (
            <div className="tutorial-demo-form">
              <FontPicker
                value={project.labels[0]?.fontFamily ?? "Zen Maru Gothic"}
                t={t}
                onChange={(fontFamily) => change({ fontFamily })}
              />
              <label className="switch-row">
                <span>{t.showPrice}</span>
                <input
                  type="checkbox"
                  className="switch"
                  checked={project.labels[0]?.showPrice ?? false}
                  onChange={(e) => change({ showPrice: e.target.checked })}
                />
              </label>
            </div>
          )}
          {step === 6 && (
            <>
              <div className="tutorial-handle-legend">
                <span>
                  <i className="diamond" />
                  {t.loopHint}
                </span>
              </div>
              <label className="tutorial-loop-size">
                {t.loopSize}
                <input
                  aria-label={t.loopSize}
                  type="range"
                  min="24"
                  max="180"
                  step="2"
                  value={(project.labels[0]?.loopRadius ?? 30) * 2}
                  onChange={(e) => change({ loopRadius: +e.target.value / 2 })}
                />
              </label>
            </>
          )}
          <p className="tutorial-practice-note">{t.guidePracticeNote}</p>
        </>
      )}
      <div className="tutorial-mobile-note">{t.guideMobile}</div>
      <div className="tutorial-navigation">
        <button onClick={finish}>{t.guideSkip}</button>
        <div>
          <button
            aria-label={t.guidePrevious}
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            className="primary"
            onClick={() =>
              step === titles.length - 1 ? finish() : setStep((s) => s + 1)
            }
          >
            {step === titles.length - 1 ? <Check size={17} /> : null}
            {step === titles.length - 1 ? t.guideFinish : t.guideNext}
            {step < titles.length - 1 && <ChevronRight size={17} />}
          </button>
        </div>
      </div>
    </Modal>
  );
}
