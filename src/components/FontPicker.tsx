import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { ProductLabel } from "../types/project";
import type { Translation } from "../lib/i18n";
const FONTS: {
  name: ProductLabel["fontFamily"];
  ja: string;
  category: "serif" | "sans" | "round";
}[] = [
  { name: "Zen Maru Gothic", ja: "Zen Maru Gothic", category: "round" },
  { name: "M PLUS Rounded 1c", ja: "M PLUS Rounded 1c", category: "round" },
  { name: "Kiwi Maru", ja: "キウイ丸", category: "round" },
  { name: "Noto Sans JP", ja: "Noto Sans JP", category: "sans" },
  { name: "Noto Serif JP", ja: "Noto Serif JP", category: "serif" },
  { name: "Shippori Mincho", ja: "しっぽり明朝", category: "serif" },
  { name: "Zen Old Mincho", ja: "Zen Old Mincho", category: "serif" },
  { name: "Nunito", ja: "Nunito", category: "round" },
  { name: "Quicksand", ja: "Quicksand", category: "round" },
  { name: "Inter", ja: "Inter", category: "sans" },
  { name: "Montserrat", ja: "Montserrat", category: "sans" },
];
export function FontPicker({
  value,
  t,
  onChange,
}: {
  value: ProductLabel["fontFamily"];
  t: Translation;
  onChange: (font: ProductLabel["fontFamily"]) => void;
}) {
  const [open, setOpen] = useState(false),
    [filter, setFilter] = useState("all"),
    holder = useRef<HTMLDivElement>(null);
  const japanese = t.font === "フォント";
  useEffect(() => {
    if (!open) return;
    for (const font of FONTS)
      void document.fonts.load(`400 20px "${font.name}"`, "Aa あいうえお");
    const click = (e: MouseEvent) => {
      if (!holder.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, [open]);
  const visible = FONTS.filter(
    (f) => filter === "all" || f.category === filter,
  );
  return (
    <div className="font-picker" ref={holder}>
      <span className="font-field-label">{t.font}</span>
      <button
        className="font-trigger"
        aria-label={t.font}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <strong>
            {FONTS.find((f) => f.name === value)?.[japanese ? "ja" : "name"] ??
              value}
          </strong>
          <span
            style={{ fontFamily: `"${value}", 'Zen Maru Gothic', sans-serif` }}
          >
            Aa あいうえお
          </span>
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="font-options">
          <div className="font-filters">
            {(["all", "serif", "sans", "round"] as const).map((category) => (
              <button
                key={category}
                className={filter === category ? "active" : ""}
                onClick={() => setFilter(category)}
              >
                {t[category]}
              </button>
            ))}
          </div>
          <div role="listbox" aria-label={t.font} className="font-list">
            {visible.map((font) => (
              <button
                key={font.name}
                role="option"
                aria-selected={value === font.name}
                onClick={() => {
                  onChange(font.name);
                  setOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setOpen(false);
                    return;
                  }
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    const options = Array.from(
                        holder.current!.querySelectorAll<HTMLButtonElement>(
                          "[role=option]",
                        ),
                      ),
                      index = options.indexOf(e.currentTarget);
                    options[
                      (index +
                        (e.key === "ArrowDown" ? 1 : -1) +
                        options.length) %
                        options.length
                    ]?.focus();
                  }
                }}
                className={value === font.name ? "selected" : ""}
              >
                <span className="font-name">
                  <span>{japanese ? font.ja : font.name}</span>
                  <small>{t[font.category]}</small>
                </span>
                <span
                  className="font-sample"
                  style={{
                    fontFamily: `"${font.name}", 'Zen Maru Gothic', sans-serif`,
                  }}
                >
                  Aa {japanese ? "こだわりのデスク" : "My favorite desk"}
                </span>
                {value === font.name && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
