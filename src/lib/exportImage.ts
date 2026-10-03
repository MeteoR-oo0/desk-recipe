import Konva from "konva";
import type { ProjectData } from "../types/project";
import { decodeImage, adjustedImage, exportDimensions } from "./project";
import { glassBackdrop } from "./glassBackdrop";
import { labelLayout, formatPrice } from "./labelLayout";
export async function exportImage(
  stage: Konva.Stage,
  project: ProjectData,
  original: Blob,
  format: "png" | "jpeg",
  resolution: "standard" | "original",
) {
  const url = URL.createObjectURL(original);
  let clone: Konva.Stage | undefined;
  try {
    await document.fonts.ready;
    const image = await decodeImage(url),
      { width, height, scale } = exportDimensions(project, resolution);
    if (width * height > 45000000) throw Error("Canvas exceeds memory budget");
    clone = stage.clone({
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      width: project.canvas.width,
      height: project.canvas.height,
      listening: false,
    });
    clone.find(".editor-decoration").forEach((node) => node.destroy());
    const photo = clone.findOne(".photo") as Konva.Image;
    const cover = Math.max(
      project.canvas.width / image.width,
      project.canvas.height / image.height,
    );
    const pixels =
      project.adjustment.brightness || project.adjustment.contrast || project.adjustment.blur
        ? adjustedImage(
            image,
            project.adjustment.brightness,
            project.adjustment.contrast,
            project.adjustment.blur ?? 0,
            project.canvas,
          )
        : image;
    photo.setAttrs({
      image: pixels,
      x: (project.canvas.width - image.width * cover) / 2,
      y: (project.canvas.height - image.height * cover) / 2,
      width: image.width * cover,
      height: image.height * cover,
    });
    clone.find(".glass-backdrop").forEach((node) => {
      const label = project.labels.find((l) => l.id === node.getAttr("glassLabelId"));
      if (!label) return;
      const height = labelLayout({...label,price:formatPrice(label.price,project.priceFormat)},project.priceMode === "show" || (project.priceMode === "individual" && label.showPrice)).height;
      (node as Konva.Image).image(glassBackdrop(pixels, project.canvas, project.adjustment.overlay, label, height, scale));
    });
    clone.draw();
    const blob = await clone.toBlob({
      pixelRatio: scale,
      mimeType: format === "png" ? "image/png" : "image/jpeg",
      quality: 0.94,
    });
    if (!blob || blob.size < 100) throw Error("Empty export");
    return blob;
  } finally {
    clone?.destroy();
    URL.revokeObjectURL(url);
  }
}
