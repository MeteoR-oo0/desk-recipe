import Konva from "konva";
import type { ProductLabel } from "../types/project";
import { numberedBrand } from "./labelOrder";
export const fontStack = (font: string) =>
  `${font}, Zen Maru Gothic, sans-serif`;
export function labelLayout(l: ProductLabel, show: boolean) {
  const width = l.boxWidth ?? 330,
    fontFamily = fontStack(l.fontFamily);
  const measure = (text: string, fontSize: number, fontStyle = "normal") => {
    const node = new Konva.Text({
        text: text || " ",
        fontFamily,
        fontSize,
        fontStyle,
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
    priceY = productY + productHeight + 5;
  return {
    width,
    productY,
    priceY,
    contentHeight: show
      ? priceY + measure(l.price, l.fontSizePrice)
      : productY + productHeight,
    height:
      (show
        ? priceY + measure(l.price, l.fontSizePrice)
        : productY + productHeight) + (l.boxExtraHeight ?? 0),
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
