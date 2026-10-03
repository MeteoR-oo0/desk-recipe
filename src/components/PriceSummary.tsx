import type { ProjectData } from "../types/project";
import type { Translation } from "../lib/i18n";
import { priceTotal } from "../lib/priceTotal";
import "../price-summary.css";

export function PriceSummary({ p, t, compact = false }: { p: ProjectData; t: Translation; compact?: boolean }) {
  const { total, included, excluded } = priceTotal(p.labels);
  const formatted = "¥" + total.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
  return <div className={"price-summary" + (compact ? " price-summary--compact" : "")}>
    <div className="price-summary-value"><span>{t.totalPrice}</span><output aria-label={t.totalPrice} title={formatted}>{formatted}</output></div>
    {!compact && <>
      <p className="field-note">{t.totalCount.replace("{count}", String(included))} · {t.totalIncludesHidden}</p>
      {excluded > 0 && <p className="price-summary-excluded">{t.totalExcluded.replace("{count}", String(excluded))}</p>}
    </>}
  </div>;
}
