import Konva from "konva";
import type { ProjectData } from "../types/project";
import { decodeImage, adjustedImage, exportDimensions } from "./project";
import { glassBackdrop } from "./glassBackdrop";
import {formatLabelNumber} from "./labelOrder";
import { labelLayout, formatPrice } from "./labelLayout";
import { isLabelVisible } from "./labelVisibility";
import {backgroundColor,blurredCanvasBackground,composedPhoto,withDarkness} from "./canvasBackground";
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
    await Promise.all(project.labels.filter(label=>label.image&&isLabelVisible(label)).map(async label=>{
      const node=clone!.findOne((node:Konva.Node)=>node.name()==="label-image"&&node.getAttr("labelImageId")===label.id) as Konva.Image|undefined;
      if(!node) throw Error("Missing label image");
      node.image(await decodeImage(label.image!.src));
    }));
    const photo = clone.findOne(".photo") as Konva.Image;
    const cover = Math.max(
      project.canvas.width / image.width,
      project.canvas.height / image.height,
    );
    const adjustedPixels =
      project.adjustment.brightness || project.adjustment.contrast || project.adjustment.blur
        ? adjustedImage(
            image,
            project.adjustment.brightness,
            project.adjustment.contrast,
            project.adjustment.blur ?? 0,
            project.canvas,
          )
        : image;
    const pixels=withDarkness(adjustedPixels,project.adjustment.overlay);
    clone.findOne(".overlay")?.destroy();
    photo.setAttrs({
      image: pixels,
      x: (project.canvas.width - image.width * cover) / 2,
      y: (project.canvas.height - image.height * cover) / 2,
      width: image.width * cover,
      height: image.height * cover,
    });
    let backdrop:HTMLCanvasElement|null=null;
    if(project.background?.mode==="blur"&&project.background.image){backdrop=withDarkness(blurredCanvasBackground(await decodeImage(project.background.image),project.canvas,project.background.blur,project.adjustment.brightness,project.adjustment.contrast,scale),project.adjustment.overlay) as HTMLCanvasElement;(clone.findOne(".background-photo") as Konva.Image).image(backdrop);}else clone.findOne(".background-photo")?.destroy();
    const color=project.background?.mode==="transparent"&&format==="jpeg"?"#ffffff":backgroundColor(project.background);
    (clone.findOne(".canvas-background") as Konva.Rect).fill(color??"rgba(0,0,0,0)");
    const scenePixels=project.background?composedPhoto(pixels,project.canvas,backdrop,color,scale):pixels;
    clone.find(".glass-backdrop").forEach((node) => {
      const label = project.labels.find((l) => l.id === node.getAttr("glassLabelId"));
      if (!label) return;
      const height = labelLayout({...label,labelNumber:formatLabelNumber(project.labels.findIndex(l=>l.id===label.id)+1,project.numberStyle),price:formatPrice(label.price,project.priceFormat)},project.priceMode === "show" || (project.priceMode === "individual" && label.showPrice)).height;
      (node as Konva.Image).image(glassBackdrop(scenePixels, project.canvas, 0, label, height, scale));
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
