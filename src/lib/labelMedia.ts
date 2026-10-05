import type { LabelImage, ProductLabel } from "../types/project";
import { DEFAULT_TEXT_EFFECTS, validAppearance } from "./labelAppearance.ts";
export const imageHeight = (image: LabelImage) => image.width * image.naturalHeight / image.naturalWidth;
export const imageShadow = (image: LabelImage) => ({ ...DEFAULT_TEXT_EFFECTS, ...image.shadow });
const finite = (value: unknown, min: number, max: number) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
export function validLabelMedia(label: Pick<ProductLabel, "description" | "fontSizeDescription" | "fontWeight" | "image" | "hidden">) {
  if (label.hidden !== undefined && typeof label.hidden !== "boolean") return false;
  if (label.description !== undefined && (typeof label.description !== "string" || label.description.length > 1500)) return false;
  if (label.fontSizeDescription !== undefined && !finite(label.fontSizeDescription, 8, 120)) return false;
  if (label.fontWeight !== undefined && (!finite(label.fontWeight, 100, 900) || label.fontWeight % 100 !== 0)) return false;
  const image = label.image;
  if (image === undefined) return true;
  return !!image && typeof image === "object" && !Array.isArray(image)
    && typeof image.src === "string" && image.src.length <= 4000000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image.src)
    && typeof image.name === "string" && image.name.length <= 200
    && finite(image.naturalWidth, 1, 1024) && finite(image.naturalHeight, 1, 1024)
    && image.naturalWidth / image.naturalHeight <= 12 && image.naturalHeight / image.naturalWidth <= 12
    && finite(image.x, -2000, 2000) && finite(image.y, -2000, 2000)
    && finite(image.width, 24, 600) && finite(image.opacity, 0, 1)
    && validAppearance({ textEffects: image.shadow });
}
export async function labelImageFromFile(file: File): Promise<LabelImage> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 25000000) throw Error("Invalid image file");
  const url = URL.createObjectURL(file);
  try {
    const source = new Image(); source.src = url; await source.decode();
    if (!source.width || !source.height || source.width / source.height > 12 || source.height / source.width > 12) throw Error("Invalid image dimensions");
    let size = 1024, src = "";
    const canvas = document.createElement("canvas");
    do {
      const scale = Math.min(1, size / Math.max(source.width, source.height));
      canvas.width = Math.max(1, Math.round(source.width * scale)); canvas.height = Math.max(1, Math.round(source.height * scale));
      canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
      src = canvas.toDataURL(file.type === "image/jpeg" ? "image/jpeg" : "image/png", 0.92);
      size = Math.floor(size * 0.8);
    } while (src.length > 4000000 && size >= 256);
    if (src.length > 4000000) throw Error("Image too large");
    return { src, name: file.name.slice(0, 200), naturalWidth: canvas.width, naturalHeight: canvas.height,
      x: 0, y: 0, width: 160, opacity: 1 };
  } finally { URL.revokeObjectURL(url); }
}
