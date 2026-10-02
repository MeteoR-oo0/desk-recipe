import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  ClipboardPaste,
  Trash2,
  MousePointer2,
} from "lucide-react";
import type { ProductLabel, PriceMode } from "../types/project";
import { loopGeometry } from "../lib/loopGeometry";
import { labelLayout, formatPrice } from "../lib/labelLayout";
import { FontPicker } from "./FontPicker";
import type { Translation } from "../lib/i18n";
export function LabelPanel({
  label,
  t,
  priceMode,
  priceFormat,
  onChange,
  onDuplicate,
  onDelete,
  onEnd,
  onCopy,
  onPaste,
}: {
  label: ProductLabel | undefined;
  t: Translation;
  priceMode: PriceMode;
  priceFormat: string;
  onChange: (patch: Partial<ProductLabel>, key?: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onEnd: () => void;
  onCopy: () => void;
  onPaste: () => void;
}) {
  if (!label)
    return (
      <div className="empty-label">
        <MousePointer2 size={26} />
        <h3>{t.selectLabel}</h3>
        <p>{t.selectLabelHint}</p>
        <button onClick={onPaste}>
          <ClipboardPaste size={16} />
          {t.paste}
        </button>
      </div>
    );
  const visiblePrice =
      priceMode === "show" || (priceMode === "individual" && label.showPrice),
    height = labelLayout(
      { ...label, price: formatPrice(label.price, priceFormat) },
      visiblePrice,
    ).height;
  const loop = loopGeometry(
    { x: label.x, y: label.y, width: label.boxWidth ?? 330, height },
    { x: label.arrowTargetX, y: label.arrowTargetY },
    label.arrowAnchor,
    label.loopPosition,
    label.loopRadius,
  );
  const radius = loop.radius;
  return (
    <div className="label-panel">
      <div className="section-heading">
        <h2>{t.labelSettings}</h2>
        <span className="tiny-tag">#{label.id.slice(0, 4).toUpperCase()}</span>
      </div>
      <section className="form-section">
        {(["brand", "productName", "price"] as const).map((key) => (
          <label key={key}>
            {t[key]}
            <input
              value={label[key]}
              maxLength={key === "productName" ? 120 : 80}
              onChange={(e) => onChange({ [key]: e.target.value }, key)}
              onBlur={onEnd}
            />
          </label>
        ))}
        <label className="switch-row">
          <span>{t.showPrice}</span>
          <input
            type="checkbox"
            className="switch"
            checked={label.showPrice}
            onChange={(e) => onChange({ showPrice: e.target.checked })}
          />
        </label>
        {priceMode !== "individual" && (
          <p className="field-note">{t.allOverride}</p>
        )}
      </section>
      <section className="form-section">
        <h3>{t.boxSize}</h3>
        <p className="field-note">{t.resizeHint}</p>
        <label className="range-label">
          {t.boxWidth}
          <output>{label.boxWidth ?? 330}px</output>
          <input
            type="range"
            min="120"
            max="800"
            value={label.boxWidth ?? 330}
            onChange={(e) =>
              onChange({ boxWidth: +e.target.value }, "boxWidth")
            }
            onPointerUp={onEnd}
            onBlur={onEnd}
            onKeyUp={onEnd}
          />
        </label>
        <label className="range-label">
          {t.boxHeight}
          <output>{label.boxExtraHeight ?? 0}px</output>
          <input
            type="range"
            min="0"
            max="300"
            value={label.boxExtraHeight ?? 0}
            onChange={(e) =>
              onChange({ boxExtraHeight: +e.target.value }, "boxHeight")
            }
            onPointerUp={onEnd}
            onBlur={onEnd}
            onKeyUp={onEnd}
          />
        </label>
      </section>
      <section className="form-section">
        <h3>{t.typography}</h3>
        <FontPicker
          value={label.fontFamily}
          t={t}
          onChange={(fontFamily) => onChange({ fontFamily })}
        />
        <label className="range-label">
          {t.textSize}
          <output>{label.fontSizeProduct}px</output>
          <input
            type="range"
            min="16"
            max="60"
            value={label.fontSizeProduct}
            onChange={(e) => {
              const n = +e.target.value;
              onChange(
                {
                  fontSizeProduct: n,
                  fontSizeBrand: Math.round(n * 0.61),
                  fontSizePrice: Math.round(n * 0.61),
                },
                "size",
              );
            }}
            onPointerUp={onEnd}
            onBlur={onEnd}
            onPointerCancel={onEnd}
            onKeyUp={onEnd}
          />
        </label>
        <div className="field-row">
          <span>{t.alignment}</span>
          <div className="segmented icon-segment">
            {(["left", "center", "right"] as const).map((align, i) => {
              const Icon = [AlignLeft, AlignCenter, AlignRight][i];
              return (
                <button
                  key={align}
                  title={t[align]}
                  aria-label={t[align]}
                  className={label.align === align ? "active" : ""}
                  onClick={() => onChange({ align })}
                >
                  <Icon size={17} />
                </button>
              );
            })}
          </div>
        </div>
        <label className="field-row">
          {t.color}
          <input
            type="color"
            value={label.textColor}
            onChange={(e) =>
              onChange({ textColor: e.target.value }, "textColor")
            }
            onBlur={onEnd}
          />
        </label>
      </section>
      <section className="form-section">
        <h3>{t.arrow}</h3>
        <p className="field-note">{t.anchorHint}</p>
        <button
          className="anchor-reset"
          disabled={!label.arrowAnchor}
          onClick={() => onChange({ arrowAnchor: undefined })}
        >
          {t.autoAnchor}
        </button>
        <div className="segmented">
          {(["curve", "swirl", "polyline", "line"] as const).map((type) => (
            <button
              key={type}
              className={label.arrowType === type ? "active" : ""}
              onClick={() => onChange({ arrowType: type })}
            >
              {t[type]}
            </button>
          ))}
        </div>
        {label.arrowType === "swirl" && (
          <>
            <p className="field-note">{t.loopHint}</p>
            <label className="range-label">
              {t.loopSize}
              <output>{Math.round(radius * 2)}px</output>
              <input
                aria-label={t.loopSize}
                type="range"
                min="24"
                max="300"
                step="2"
                value={radius * 2}
                onChange={(e) =>
                  onChange(
                    {
                      loopRadius: +e.target.value / 2,
                      loopPosition: label.loopPosition ?? loop.center,
                    },
                    "loopRadius",
                  )
                }
                onPointerUp={onEnd}
                onBlur={onEnd}
                onKeyUp={onEnd}
              />
            </label>
            <button
              className="anchor-reset"
              disabled={!label.loopPosition}
              onClick={() => onChange({ loopPosition: undefined })}
            >
              {t.loopReset}
            </button>
          </>
        )}
        <label className="range-label">
          {t.lineWidth}
          <output>{label.arrowWidth}px</output>
          <input
            type="range"
            min="1"
            max="8"
            step=".5"
            value={label.arrowWidth}
            onChange={(e) =>
              onChange({ arrowWidth: +e.target.value }, "lineWidth")
            }
            onPointerUp={onEnd}
            onBlur={onEnd}
            onPointerCancel={onEnd}
            onKeyUp={onEnd}
          />
        </label>
        <label className="field-row">
          {t.lineColor}
          <input
            type="color"
            value={label.arrowColor}
            onChange={(e) =>
              onChange({ arrowColor: e.target.value }, "arrowColor")
            }
            onBlur={onEnd}
          />
        </label>
        <label className="range-label">
          {t.opacity}
          <output>{Math.round(label.opacity * 100)}%</output>
          <input
            type="range"
            min="20"
            max="100"
            value={label.opacity * 100}
            onChange={(e) =>
              onChange({ opacity: +e.target.value / 100 }, "opacity")
            }
            onPointerUp={onEnd}
            onBlur={onEnd}
            onPointerCancel={onEnd}
            onKeyUp={onEnd}
          />
        </label>
      </section>
      <div className="label-actions clipboard-actions">
        <button onClick={onCopy}>
          <Copy size={16} />
          {t.copy}
        </button>
        <button onClick={onPaste}>
          <ClipboardPaste size={16} />
          {t.paste}
        </button>
      </div>
      <div className="label-actions">
        <button onClick={onDuplicate}>
          <Copy size={16} />
          {t.duplicate}
        </button>
        <button className="danger" onClick={onDelete}>
          <Trash2 size={16} />
          {t.remove}
        </button>
      </div>
    </div>
  );
}
