import Konva from "konva";
import type { ProjectData } from "../types/project";
import { decodeImage, adjustedImage, exportDimensions } from "./project";
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
      project.adjustment.brightness || project.adjustment.contrast
        ? adjustedImage(
            image,
            project.adjustment.brightness,
            project.adjustment.contrast,
          )
        : image;
    photo.setAttrs({
      image: pixels,
      x: (project.canvas.width - image.width * cover) / 2,
      y: (project.canvas.height - image.height * cover) / 2,
      width: image.width * cover,
      height: image.height * cover,
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
