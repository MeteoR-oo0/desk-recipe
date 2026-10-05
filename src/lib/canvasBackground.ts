import type { CanvasBackground } from "../types/project";
export const backgroundColor=(background?:CanvasBackground)=>background?.mode==="transparent"?undefined:background?.color??"#e3e6e5";
export function withDarkness(image:HTMLImageElement|HTMLCanvasElement,amount:number) {
  if(!amount)return image;const canvas=document.createElement("canvas");canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext("2d")!;
  ctx.drawImage(image,0,0);ctx.globalCompositeOperation="source-atop";ctx.fillStyle=`rgba(0,0,0,${amount/100})`;ctx.fillRect(0,0,canvas.width,canvas.height);return canvas;
}
export function blurredCanvasBackground(image:HTMLImageElement,bounds:{width:number;height:number},blur:number,brightness=0,contrast=0,pixelRatio=1) {
  const canvas=document.createElement("canvas");const s=Math.min(pixelRatio,4000/Math.max(bounds.width,bounds.height));canvas.width=Math.max(1,Math.round(bounds.width*s));canvas.height=Math.max(1,Math.round(bounds.height*s));
  const ctx=canvas.getContext("2d")!,pad=blur*s*3+2,cover=Math.max((canvas.width+pad*2)/image.width,(canvas.height+pad*2)/image.height);
  ctx.filter=`brightness(${1+brightness/100}) contrast(${1+contrast/100}) blur(${blur*s}px)`;
  ctx.drawImage(image,(canvas.width-image.width*cover)/2,(canvas.height-image.height*cover)/2,image.width*cover,image.height*cover);return canvas;
}
export function validCanvasBackground(background:unknown) {
  if(background===undefined)return true;if(!background||typeof background!=="object"||Array.isArray(background))return false;
  const value=background as CanvasBackground;
  return ["color","blur","transparent"].includes(value.mode)&&/^#[0-9a-f]{6}$/i.test(value.color)&&typeof value.blur==="number"&&Number.isFinite(value.blur)&&value.blur>=0&&value.blur<=60
    &&(value.image===undefined||(typeof value.image==="string"&&value.image.length<=4000000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value.image)))&&(value.mode!=="blur"||!!value.image);
}
export function composedPhoto(foreground:HTMLImageElement|HTMLCanvasElement,bounds:{width:number;height:number},background:HTMLCanvasElement|null,color:string|undefined,pixelRatio=1) {
  const canvas=document.createElement("canvas"),s=Math.min(pixelRatio,4000/Math.max(bounds.width,bounds.height));canvas.width=Math.max(1,Math.round(bounds.width*s));canvas.height=Math.max(1,Math.round(bounds.height*s));const ctx=canvas.getContext("2d")!;
  if(color){ctx.fillStyle=color;ctx.fillRect(0,0,canvas.width,canvas.height);}if(background)ctx.drawImage(background,0,0,canvas.width,canvas.height);
  const cover=Math.max(canvas.width/foreground.width,canvas.height/foreground.height);ctx.drawImage(foreground,(canvas.width-foreground.width*cover)/2,(canvas.height-foreground.height*cover)/2,foreground.width*cover,foreground.height*cover);return canvas;
}
