import type { ProductLabel } from "../types/project";
import { frameSettings } from "./labelAppearance";

// Sample the adjusted photo in document coordinates; padding prevents blur
// seams at the edge of the frame. Export re-samples from the original image.
export function glassBackdrop(photo: HTMLImageElement | HTMLCanvasElement, canvas: {width:number;height:number}, overlay: number, label: ProductLabel, height: number, density = 1) {
  const frame = frameSettings(label), width = (label.boxWidth ?? 330) + 28, h = height + 28;
  const margin = Math.ceil(frame.blur * 3 + 2), scale = Math.min(4, Math.max(1, density));
  const raw = document.createElement("canvas");
  raw.width = Math.ceil((width + margin * 2) * scale); raw.height = Math.ceil((h + margin * 2) * scale);
  const ctx = raw.getContext("2d")!;
  const cover = Math.max(canvas.width / photo.width, canvas.height / photo.height);
  const px = (canvas.width - photo.width * cover) / 2, py = (canvas.height - photo.height * cover) / 2;
  ctx.drawImage(photo, (px - label.x + 14 + margin) * scale, (py - label.y + 14 + margin) * scale, photo.width * cover * scale, photo.height * cover * scale);
  if (overlay) { ctx.fillStyle = `rgba(0,0,0,${overlay/100})`; ctx.fillRect(0,0,raw.width,raw.height); }
  const result = document.createElement("canvas"); result.width = Math.ceil(width * scale); result.height = Math.ceil(h * scale);
  const out = result.getContext("2d")!;
  out.filter = `blur(${frame.blur * scale}px)`; out.drawImage(raw, -margin * scale, -margin * scale);
  return result;
}

export function roundedClip(ctx: {beginPath:()=>void;moveTo:(x:number,y:number)=>void;lineTo:(x:number,y:number)=>void;quadraticCurveTo:(a:number,b:number,c:number,d:number)=>void;closePath:()=>void}, width: number, height: number, radius: number) {
  const x = -14, y = -14, r = Math.min(radius, width/2, height/2);
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+width-r,y); ctx.quadraticCurveTo(x+width,y,x+width,y+r);
  ctx.lineTo(x+width,y+height-r); ctx.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
  ctx.lineTo(x+r,y+height); ctx.quadraticCurveTo(x,y+height,x,y+height-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
