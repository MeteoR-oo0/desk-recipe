import type { CanvasBackground, ProjectData } from "../types/project.ts";
import { decodeImage } from "./project.ts";
export type CropRect = { x:number;y:number;width:number;height:number };
export function validCrop(rect:CropRect) {return [rect.x,rect.y,rect.width,rect.height].every(Number.isFinite)&&Math.abs(rect.x)<=12000&&Math.abs(rect.y)<=12000&&rect.width>=100&&rect.width<=12000&&rect.height>=100&&rect.height<=12000;}
export function croppedProject(p:ProjectData,rect:CropRect,background:CanvasBackground):ProjectData {
  if(!validCrop(rect))throw Error("Invalid crop");
  return {...p,canvas:{width:Math.round(rect.width),height:Math.round(rect.height),aspectRatio:"Custom"},background,
    labels:p.labels.map(label=>({...label,x:label.x-rect.x,y:label.y-rect.y,arrowTargetX:label.arrowTargetX-rect.x,arrowTargetY:label.arrowTargetY-rect.y,
      ...(label.loopPosition?{loopPosition:{x:label.loopPosition.x-rect.x,y:label.loopPosition.y-rect.y}}:{})}))};
}
export async function cropPhoto(original:Blob,p:ProjectData,rect:CropRect) {
  if(!validCrop(rect))throw Error("Invalid crop");
  const url=URL.createObjectURL(original);
  try {
    const image=await decodeImage(url),cover=Math.max(p.canvas.width/image.width,p.canvas.height/image.height);
    const factor=Math.min(1/cover,Math.sqrt(45000000/(rect.width*rect.height)),50000/Math.max(rect.width,rect.height));
    const out=document.createElement("canvas");out.width=Math.max(1,Math.round(rect.width*factor));out.height=Math.max(1,Math.round(rect.height*factor));
    const ctx=out.getContext("2d")!;ctx.scale(factor,factor);ctx.translate(-rect.x,-rect.y);
    ctx.save();ctx.beginPath();ctx.rect(0,0,p.canvas.width,p.canvas.height);ctx.clip();
    ctx.drawImage(image,(p.canvas.width-image.width*cover)/2,(p.canvas.height-image.height*cover)/2,image.width*cover,image.height*cover);ctx.restore();
    const blob=await new Promise<Blob>((resolve,reject)=>out.toBlob(value=>value?resolve(value):reject(Error("Crop failed")),"image/png"));
    let backgroundImage=p.background?.image;
    if(!backgroundImage){const seed=document.createElement("canvas"),s=Math.min(1,1600/Math.max(p.canvas.width,p.canvas.height));seed.width=Math.max(1,Math.round(p.canvas.width*s));seed.height=Math.max(1,Math.round(p.canvas.height*s));const b=seed.getContext("2d")!;
      b.fillStyle=p.background?.color??"#ffffff";b.fillRect(0,0,seed.width,seed.height);b.scale(s,s);b.drawImage(image,(p.canvas.width-image.width*cover)/2,(p.canvas.height-image.height*cover)/2,image.width*cover,image.height*cover);backgroundImage=seed.toDataURL("image/jpeg",0.85);}
    return {blob,backgroundImage};
  } finally {URL.revokeObjectURL(url);}
}
