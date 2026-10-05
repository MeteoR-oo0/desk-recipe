import Konva from "konva";
import type { ProductLabel } from "../types/project";
import { numberedBrand } from "./labelOrder.ts";
export const fontStack = (font: string) =>
  font === "Inter" || font === "Montserrat" ? `"${font}", "Noto Sans JP", sans-serif` : `"${font}", "Zen Maru Gothic", sans-serif`;
export function labelLayout(l: ProductLabel, show: boolean) {
  const width = l.boxWidth ?? 330,
    fontFamily = fontStack(l.fontFamily);
  const measure = (text: string, fontSize: number, fontStyle = "normal") => {
    const node = new Konva.Text({
        text: text || " ",
        fontFamily,
        fontSize,
        fontStyle: String(l.fontWeight ?? (fontStyle === "bold" ? 700 : 400)),
        width,
        lineHeight: 1.2,
        wrap: "word",
      }),
      height = node.height();
    node.destroy();
    return height;
  };
  const brandHeight = measure(numberedBrand(l), l.fontSizeBrand),
    productY = brandHeight + 5,
    productHeight = measure(l.productName, l.fontSizeProduct, "bold"),
    descriptionY = productY + productHeight + 7,
    descriptionHeight = l.description?.trim() ? measure(l.description, l.fontSizeDescription ?? l.fontSizePrice) : 0,
    textBottom = descriptionHeight ? descriptionY + descriptionHeight : productY + productHeight,
    priceY = textBottom + 5;
  return {
    width,
    productY,
    descriptionY,
    priceY,
    contentHeight: show
      ? priceY + measure(l.price, l.fontSizePrice)
      : textBottom,
    height:
      (show
        ? priceY + measure(l.price, l.fontSizePrice)
        : textBottom) + (l.boxExtraHeight ?? 0),
  };
}

export function formatPrice(price: string, format: string) {
  const n = price.replace(/[¥￥円,\s]/g, "");
  return /^\d+(\.\d+)?$/.test(n)
    ? (format === "yen" ? "¥" : "") +
        Number(n).toLocaleString("ja-JP") +
        (format === "suffix" ? "円" : "")
    : price;
}
