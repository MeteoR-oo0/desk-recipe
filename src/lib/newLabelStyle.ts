import type { ProductLabel } from "../types/project";

export function previousLabelStyle(label?: ProductLabel | null): Partial<ProductLabel> {
  if (!label) return {};
  return {
    fontFamily: label.fontFamily, fontWeight: label.fontWeight,
    fontSizeBrand: label.fontSizeBrand, fontSizeProduct: label.fontSizeProduct, fontSizePrice: label.fontSizePrice,
    fontSizeCategory: label.fontSizeCategory, fontSizeDescription: label.fontSizeDescription,
    textColor: label.textColor, align: label.align, opacity: label.opacity,
    textEffects: label.textEffects ? { ...label.textEffects } : undefined,
    frame: label.frame ? { ...label.frame } : undefined,
    boxWidth: label.boxWidth, boxExtraHeight: label.boxExtraHeight,
  };
}
