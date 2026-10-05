import type { ProductLabel } from "../types/project";
import { validAppearance } from "./labelAppearance.ts";
import { validLabelNumber } from "./labelOrder.ts";
import { validLabelMedia } from "./labelMedia.ts";
const PREFIX = "DESK_RECIPE_LABEL\n";
export const serializeLabel = (label: ProductLabel) =>
  PREFIX + JSON.stringify(label);
export function parseClipboardLabel(text: string): ProductLabel | null {
  if (!text.startsWith(PREFIX)) return null;
  try {
    const l = JSON.parse(text.slice(PREFIX.length));
    if (
      !l ||
      !["brand", "productName", "price"].every(
        (key) => typeof l[key] === "string" && l[key].length <= 200,
      ) ||
      typeof l.showPrice !== "boolean" ||
      ![
        "x",
        "y",
        "arrowTargetX",
        "arrowTargetY",
        "fontSizeBrand",
        "fontSizeProduct",
        "fontSizePrice",
        "arrowWidth",
        "opacity",
      ].every((key) => typeof l[key] === "number" && Number.isFinite(l[key])) ||
      !["curve", "line", "polyline", "swirl"].includes(l.arrowType) ||
      !["left", "center", "right"].includes(l.align) ||
      ![
        "Zen Maru Gothic",
        "M PLUS Rounded 1c",
        "Nunito",
        "Inter",
        "Montserrat",
        "Quicksand",
        "Noto Sans JP",
        "Noto Serif JP",
        "Shippori Mincho",
        "Zen Old Mincho",
        "Kiwi Maru",
      ].includes(l.fontFamily) ||
      !/^#[0-9a-f]{6}$/i.test(l.textColor) ||
      !/^#[0-9a-f]{6}$/i.test(l.arrowColor) ||
      l.fontSizeBrand < 8 ||
      l.fontSizeBrand > 120 ||
      l.fontSizeProduct < 8 ||
      l.fontSizeProduct > 120 ||
      l.fontSizePrice < 8 ||
      l.fontSizePrice > 120 ||
      l.arrowWidth < 0.5 ||
      l.arrowWidth > 20 ||
      l.opacity < 0 ||
      l.opacity > 1
    )
      return null;
    if (
      l.loopRadius !== undefined &&
      (!Number.isFinite(l.loopRadius) ||
        l.loopRadius < 12 ||
        l.loopRadius > 150)
    )
      return null;
    if (
      (l.boxWidth !== undefined &&
        (!Number.isFinite(l.boxWidth) ||
          l.boxWidth < 120 ||
          l.boxWidth > 800)) ||
      (l.boxExtraHeight !== undefined &&
        (!Number.isFinite(l.boxExtraHeight) ||
          l.boxExtraHeight < 0 ||
          l.boxExtraHeight > 300))
    )
      return null;
    if (
      l.loopPosition &&
      (!Number.isFinite(l.loopPosition.x) ||
        !Number.isFinite(l.loopPosition.y) ||
        l.loopPosition.x < -1000 ||
        l.loopPosition.x > 20000 ||
        l.loopPosition.y < -1000 ||
        l.loopPosition.y > 20000)
    )
      return null;
    if (
      l.arrowAnchor &&
      (!["top", "right", "bottom", "left"].includes(l.arrowAnchor.edge) ||
        !Number.isFinite(l.arrowAnchor.t) ||
        l.arrowAnchor.t < 0 ||
        l.arrowAnchor.t > 1)
    )
      return null;
    return validAppearance(l) && validLabelNumber(l.labelNumber) && validLabelMedia(l) ? l : null;
  } catch {
    return null;
  }
}
