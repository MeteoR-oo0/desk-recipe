import type { ProjectData, Photo, ProductLabel } from "../types/project";
import { validAppearance } from "./labelAppearance.ts";
import { validLabelNumber } from "./labelOrder.ts";
export const MAX_PREVIEW = 1600;
export async function decodeImage(src: string) {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}
export async function photoFromBlob(blob: Blob, name: string): Promise<Photo> {
  const url = URL.createObjectURL(blob);
  try {
    const image = await decodeImage(url);
    if (
      !image.width ||
      !image.height ||
      image.width / image.height > 12 ||
      image.height / image.width > 10
    )
      throw Error("Invalid image");
    const scale = Math.min(
        1,
        MAX_PREVIEW / Math.max(image.width, image.height),
      ),
      canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas
      .getContext("2d")!
      .drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      id: crypto.randomUUID(),
      name,
      previewSrc: canvas.toDataURL(
        blob.type === "image/jpeg" ? "image/jpeg" : "image/png",
        0.9,
      ),
      width: image.width,
      height: image.height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
export function adjustedImage(
  image: HTMLImageElement,
  brightness: number,
  contrast: number,
  blur = 0,
  canvas?: {width:number;height:number},
) {
  const c = document.createElement("canvas");
  c.width = image.width;
  c.height = image.height;
  const ctx = c.getContext("2d")!;
  const cover = canvas ? Math.max(canvas.width/image.width,canvas.height/image.height) : 1;
  const sourceBlur = blur/cover;
  ctx.filter = `brightness(${1 + brightness / 100}) contrast(${1 + contrast / 100}) blur(${sourceBlur}px)`;
  if (blur > 0) {
    const pad = Math.ceil(sourceBlur*3+2), raw = document.createElement("canvas");
    raw.width = image.width+pad*2; raw.height = image.height+pad*2;
    const r = raw.getContext("2d")!;
    r.drawImage(image,pad,pad);
    r.drawImage(image,0,0,1,image.height,0,pad,pad,image.height);
    r.drawImage(image,image.width-1,0,1,image.height,pad+image.width,pad,pad,image.height);
    r.drawImage(image,0,0,image.width,1,pad,0,image.width,pad);
    r.drawImage(image,0,image.height-1,image.width,1,pad,pad+image.height,image.width,pad);
    for (const [sx,sy,dx,dy] of [[0,0,0,0],[image.width-1,0,pad+image.width,0],[0,image.height-1,0,pad+image.height],[image.width-1,image.height-1,pad+image.width,pad+image.height]])
      r.drawImage(image,sx,sy,1,1,dx,dy,pad,pad);
    ctx.drawImage(raw,-pad,-pad);
  } else ctx.drawImage(image, 0, 0);
  return c;
}
export function exportDimensions(
  p: ProjectData,
  resolution: "standard" | "original",
) {
  const native = Math.min(
      p.photo.width / p.canvas.width,
      p.photo.height / p.canvas.height,
    ),
    minimum = 1920 / Math.max(p.canvas.width, p.canvas.height),
    scale = resolution === "original" ? Math.max(native, minimum) : minimum;
  return {
    width: Math.round(p.canvas.width * scale),
    height: Math.round(p.canvas.height * scale),
    scale,
  };
}
const finite = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const color = (v: unknown) =>
  typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
export function parseProject(text: string): {
  project: ProjectData;
  image: string;
} {
  const obj = JSON.parse(text);
  const p = obj.project,
    image = obj.image;
  if (
    !p ||
    p.version !== 1 ||
    typeof image !== "string" ||
    !/^data:image\/(png|jpeg|webp);base64,/.test(image) ||
    !p.photo ||
    typeof p.photo.name !== "string" ||
    !finite(p.photo.width, 1, 50000) ||
    !finite(p.photo.height, 1, 50000) ||
    !p.canvas ||
    p.canvas.width !== 1200 ||
    !finite(p.canvas.height, 100, 12000) ||
    !["Original", "16:9", "4:3", "1:1", "4:5", "9:16"].includes(
      p.canvas.aspectRatio,
    ) ||
    !Array.isArray(p.labels) ||
    p.labels.length > 200 ||
    !["individual", "show", "hide"].includes(p.priceMode) ||
    (p.showTotalPrice !== undefined && typeof p.showTotalPrice !== "boolean") ||
    !["yen", "suffix", "number"].includes(p.priceFormat) ||
    !p.adjustment ||
    !finite(p.adjustment.brightness, -50, 50) ||
    !finite(p.adjustment.contrast, -50, 50) ||
    !finite(p.adjustment.overlay, 0, 70)
    || (p.adjustment.blur !== undefined && !finite(p.adjustment.blur,0,30))
  )
    throw Error("Invalid project");
  const ids = new Set();
  for (const l of p.labels as ProductLabel[]) {
    if (l && l.fontFamily === undefined) l.fontFamily = "Zen Maru Gothic";
    if (
      !l ||
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
      ].includes(l.fontFamily)
    )
      throw Error("Invalid font");
    if (
      !l ||
      typeof l.id !== "string" ||
      ids.has(l.id) ||
      !["brand", "productName", "price"].every(
        (k) => typeof (l as any)[k] === "string" && (l as any)[k].length <= 200,
      ) ||
      typeof l.showPrice !== "boolean" ||
      !["x", "y", "arrowTargetX", "arrowTargetY"].every((k) =>
        finite((l as any)[k], -1000, 20000),
      ) ||
      !["fontSizeBrand", "fontSizeProduct", "fontSizePrice"].every((k) =>
        finite((l as any)[k], 8, 120),
      ) ||
      !color(l.textColor) ||
      !color(l.arrowColor) ||
      !finite(l.arrowWidth, 0.5, 20) ||
      !finite(l.opacity, 0, 1) ||
      !["curve", "line", "polyline", "swirl"].includes(l.arrowType) ||
      !["left", "center", "right"].includes(l.align)
    )
      throw Error("Invalid label");
    if (
      l.loopRadius !== undefined &&
      (!Number.isFinite(l.loopRadius) ||
        l.loopRadius < 12 ||
        l.loopRadius > 150)
    )
      throw Error("Invalid radius");
    if (
      (l.boxWidth !== undefined && !finite(l.boxWidth, 120, 800)) ||
      (l.boxExtraHeight !== undefined && !finite(l.boxExtraHeight, 0, 300))
    )
      throw Error("Invalid box");
    if (
      l.loopPosition &&
      (!Number.isFinite(l.loopPosition.x) ||
        !Number.isFinite(l.loopPosition.y) ||
        l.loopPosition.x < -1000 ||
        l.loopPosition.x > 20000 ||
        l.loopPosition.y < -1000 ||
        l.loopPosition.y > 20000)
    )
      throw Error("Invalid loop");
    if (
      l.arrowAnchor &&
      (!["top", "right", "bottom", "left"].includes(l.arrowAnchor.edge) ||
        !finite(l.arrowAnchor.t, 0, 1))
    )
      throw Error("Invalid anchor");
    ids.add(l.id);
    if (!validAppearance(l)) throw Error("Invalid label appearance");
    if (!validLabelNumber(l.labelNumber)) throw Error("Invalid label number");
  }
  return { project: p, image };
}

export function createPhotoProject(
  current: ProjectData,
  photo: Photo,
  imported?: ProjectData,
): ProjectData {
  if (imported) return { ...imported, photo };
  return {
    ...current,
    photo,
    labels: [],
    adjustment: { brightness: 0, contrast: 0, overlay: 0 },
    canvas: {
      width: 1200,
      height: Math.round((1200 * photo.height) / photo.width),
      aspectRatio: "Original",
    },
  };
}
