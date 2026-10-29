import type { SplitSettings } from "../types/project";
export const DEFAULT_SPLIT: SplitSettings = {count:1,gapPercent:1.5,showGuides:true};
export function validSplit(value: unknown): value is SplitSettings | undefined {
  if(value===undefined)return true;
  if(!value||typeof value!=="object")return false;
  const v=value as SplitSettings;
  return [1,2,3,4].includes(v.count)&&typeof v.gapPercent==="number"&&Number.isFinite(v.gapPercent)&&v.gapPercent>=0&&v.gapPercent<=6&&typeof v.showGuides==="boolean";
}
export const splitSettings = (value?:SplitSettings):SplitSettings => value&&validSplit(value)?value:DEFAULT_SPLIT;
// Equal visible widths plus source strips omitted for the gaps between X tiles.
// Ratio is relative to a tile, so the correction scales with every export size.
export function splitGeometry(width:number,settings:SplitSettings) {
  if(!Number.isFinite(width)||width<=0||!validSplit(settings))throw Error("Invalid split geometry");
  const count=settings.count,ratio=count===1?0:settings.gapPercent/100;
  const tileWidth=width/(count+(count-1)*ratio),gap=tileWidth*ratio;
  return {tileWidth,gap,slices:Array.from({length:count},(_,i)=>({x:i*(tileWidth+gap),width:tileWidth})),
    seams:Array.from({length:count-1},(_,i)=>({x:i*(tileWidth+gap)+tileWidth,width:gap,center:i*(tileWidth+gap)+tileWidth+gap/2}))};
}
export function crossesSplit(box:{x:number;y:number;width:number;height:number},width:number,height:number,settings:SplitSettings) {
  return box.y<height&&box.y+box.height>0&&splitGeometry(width,settings).seams.some(s=>box.x<s.x+s.width&&box.x+box.width>s.x);
}
export type ExportFile = {name:string;blob:Blob;width:number;height:number};
export type ExportResult = {files:ExportFile[];archive?:Blob};
export async function splitImage(blob:Blob,settings:SplitSettings,format:"png"|"jpeg"):Promise<ExportFile[]> {
  const url=URL.createObjectURL(blob),image=new Image();
  try {
    image.src=url;await image.decode();
    const geometry=splitGeometry(image.naturalWidth,settings),width=Math.max(1,Math.round(geometry.tileWidth)),height=image.naturalHeight;
    if(width*height>45000000)throw Error("Split image exceeds memory budget");
    const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext("2d")!;const files:ExportFile[]=[];
    for(const [i,slice] of geometry.slices.entries()) {
      ctx.clearRect(0,0,width,height);
      if(format==="jpeg"){ctx.fillStyle="#ffffff";ctx.fillRect(0,0,width,height);}
      ctx.drawImage(image,slice.x,0,slice.width,height,0,0,width,height);
      const result=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("Split export failed")),format==="png"?"image/png":"image/jpeg",0.94));
      files.push({name:`recipe-maker-x-${String(i+1).padStart(2,"0")}-of-${settings.count}.${format==="png"?"png":"jpg"}`,blob:result,width,height});
    }
    canvas.width=canvas.height=1;
    return files;
  } finally {URL.revokeObjectURL(url);}
}
