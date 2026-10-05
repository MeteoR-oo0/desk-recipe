import { useEffect, useState } from "react";
import { Group, Image as CanvasImage, Rect, Line } from "react-konva";
import type { ProductLabel } from "../types/project";
import { imageHeight, imageShadow } from "../lib/labelMedia";
export function LabelImageNode({ label, selected, panMode, scale, bounds, onSelect, onChange }: {
  label: ProductLabel; selected: boolean; panMode: boolean; scale: number; bounds: {width:number;height:number};
  onSelect: () => void; onChange: (patch: Partial<ProductLabel>) => void;
}) {
  const image = label.image!;
  const [pixels,setPixels]=useState<HTMLImageElement|null>(null), [draft,setDraft]=useState<{x?:number;y?:number;width?:number}>({});
  useEffect(()=>{let active=true;setPixels(null);const decoded=new window.Image();decoded.onload=()=>{if(active)setPixels(decoded);};decoded.src=image.src;return()=>{active=false;};},[image.src]);
  const display={...image,...draft}, height=imageHeight(display), shadow=imageShadow(image);
  const position=(x:number,y:number)=>({x:Math.max(-2000,Math.min(2000,Math.max(-label.x,Math.min(bounds.width-label.x-display.width,x)))),y:Math.max(-2000,Math.min(2000,Math.max(-label.y,Math.min(bounds.height-label.y-height,y))))});
  const widthAt=(x:number)=>Math.round(Math.max(24,Math.min(600,x-image.x)));
  return <>
    <Group name="label-image-group" x={display.x} y={display.y} draggable={selected&&!panMode}
      onClick={e=>{e.cancelBubble=true;onSelect();}} onTap={e=>{e.cancelBubble=true;onSelect();}}
      onDragStart={e=>{e.cancelBubble=true;onSelect();}}
      onDragMove={e=>{e.cancelBubble=true;const point=position(e.target.x(),e.target.y());e.target.position(point);setDraft(point);}}
      onDragEnd={e=>{e.cancelBubble=true;const point=position(e.target.x(),e.target.y());onChange({image:{...image,...point}});setDraft({});}}>
      <CanvasImage name="label-image" labelImageId={label.id} image={pixels??undefined} width={display.width} height={height} opacity={image.opacity}
        shadowEnabled={shadow.shadowEnabled} shadowColor={shadow.shadowColor} shadowBlur={shadow.shadowBlur} shadowOpacity={shadow.shadowOpacity} shadowOffsetX={shadow.shadowOffsetX} shadowOffsetY={shadow.shadowOffsetY}/>
      {selected&&<Rect name="editor-decoration" width={display.width} height={height} fill="rgba(0,0,0,0.001)" stroke="#b1f0d3" strokeWidth={1/scale} dash={[4/scale,3/scale]} listening={!panMode}/>}
    </Group>
    {selected&&<Group name="editor-decoration" x={display.x+display.width} y={display.y+height} draggable={!panMode}
      onClick={e=>{e.cancelBubble=true;}} onTap={e=>{e.cancelBubble=true;}} onDragStart={e=>{e.cancelBubble=true;}}
      onDragMove={e=>{e.cancelBubble=true;setDraft({width:widthAt(e.target.x())});}}
      onDragEnd={e=>{e.cancelBubble=true;onChange({image:{...image,width:widthAt(e.target.x())}});setDraft({});}}>
      <Rect x={-6/scale} y={-6/scale} width={12/scale} height={12/scale} fill="white" stroke="#377460" strokeWidth={1.5/scale} hitStrokeWidth={26/scale}/>
      <Line points={[-2/scale,3/scale,3/scale,-2/scale]} stroke="#377460" strokeWidth={1/scale} listening={false}/>
    </Group>}
  </>;
}
