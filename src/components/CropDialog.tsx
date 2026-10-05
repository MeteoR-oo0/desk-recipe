import {useEffect,useId,useRef,useState,type PointerEvent} from "react";
import {Modal} from "./Modal";
import type {ProjectData,CanvasBackground} from "../types/project";
import type {Translation} from "../lib/i18n";
import {validCrop,type CropRect} from "../lib/crop";
import {Slider} from "./AppearanceControls";
type Edge="move"|"n"|"s"|"w"|"e"|"nw"|"ne"|"sw"|"se";
export function CropDialog({p,t,preview,onClose,onApply}:{p:ProjectData;t:Translation;preview:string;onClose:()=>void;onApply:(rect:CropRect,background:CanvasBackground)=>Promise<void>}) {
  const [rect,setRect]=useState<CropRect>({x:0,y:0,width:p.canvas.width,height:p.canvas.height});
  const [background,setBackground]=useState<CanvasBackground>(p.background??{mode:"color",color:"#ffffff",blur:20});
  const [busy,setBusy]=useState(false),[error,setError]=useState(false),[dragging,setDragging]=useState(false);
  const svg=useRef<SVGSVGElement>(null),uid=useId().replace(/:/g,"");
  const [svgSize,setSvgSize]=useState({width:600,height:350});
  useEffect(()=>{const observer=new ResizeObserver(([entry])=>setSvgSize({width:Math.max(1,entry.contentRect.width),height:Math.max(1,entry.contentRect.height)}));if(svg.current)observer.observe(svg.current);return()=>observer.disconnect();},[]);
  const padding=Math.max(p.canvas.width,p.canvas.height)*0.25;
  const view={x:Math.min(0,rect.x)-padding,y:Math.min(0,rect.y)-padding,width:Math.max(p.canvas.width,rect.x+rect.width)-Math.min(0,rect.x)+padding*2,height:Math.max(p.canvas.height,rect.y+rect.height)-Math.min(0,rect.y)+padding*2};
  const gesture=useRef<{pointer:number;edge:Edge;start:{x:number;y:number};rect:CropRect;view:typeof view}|null>(null);
  const shownView=dragging&&gesture.current?gesture.current.view:view;
  const point=(event:PointerEvent<SVGElement>)=>new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.current!.getScreenCTM()!.inverse());
  const start=(event:PointerEvent<SVGElement>,edge:Edge)=>{if(!event.isPrimary||event.button!==0||busy)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);gesture.current={pointer:event.pointerId,edge,start:point(event),rect:{...rect},view:{...shownView}};setDragging(true);};
  const move=(event:PointerEvent<SVGElement>)=>{const active=gesture.current;if(!active||active.pointer!==event.pointerId)return;const at=point(event),dx=at.x-active.start.x,dy=at.y-active.start.y,initial=active.rect;
    let left=initial.x,top=initial.y,right=initial.x+initial.width,bottom=initial.y+initial.height;
    if(active.edge==="move"){left+=dx;right+=dx;top+=dy;bottom+=dy;}else{
      if(active.edge.includes("w"))left=Math.min(right-100,left+dx);if(active.edge.includes("e"))right=Math.max(left+100,right+dx);
      if(active.edge.includes("n"))top=Math.min(bottom-100,top+dy);if(active.edge.includes("s"))bottom=Math.max(top+100,bottom+dy);
    }
    setRect({x:Math.round(Math.max(-12000,Math.min(12000,left))),y:Math.round(Math.max(-12000,Math.min(12000,top))),width:Math.round(Math.min(12000,right-left)),height:Math.round(Math.min(12000,bottom-top))});};
  const finish=(event:PointerEvent<SVGElement>)=>{if(gesture.current?.pointer!==event.pointerId)return;gesture.current=null;setDragging(false);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);};
  const handles:[Edge,number,number][]=[["nw",rect.x,rect.y],["n",rect.x+rect.width/2,rect.y],["ne",rect.x+rect.width,rect.y],["e",rect.x+rect.width,rect.y+rect.height/2],["se",rect.x+rect.width,rect.y+rect.height],["s",rect.x+rect.width/2,rect.y+rect.height],["sw",rect.x,rect.y+rect.height],["w",rect.x,rect.y+rect.height/2]];
  const radius=Math.max(shownView.width/svgSize.width,shownView.height/svgSize.height)*8;
  const expanding=rect.x<0||rect.y<0||rect.x+rect.width>p.canvas.width||rect.y+rect.height>p.canvas.height;
  return <Modal title={t.cropTitle} closeText={t.close} onClose={()=>{if(!busy)onClose();}}>
    <div className="crop-dialog"><p>{t.cropHint}</p>
      <div className="crop-presets"><button disabled={busy} onClick={()=>setRect({x:0,y:0,width:p.canvas.width,height:p.canvas.height})}>{t.cropOriginal}</button><button disabled={busy} onClick={()=>setRect({x:Math.round(p.canvas.width*0.1),y:Math.round(p.canvas.height*0.1),width:Math.round(p.canvas.width*0.8),height:Math.round(p.canvas.height*0.8)})}>{t.cropInside}</button><button disabled={busy} onClick={()=>setRect({x:-Math.round(p.canvas.width*0.2),y:-Math.round(p.canvas.height*0.2),width:Math.round(p.canvas.width*1.4),height:Math.round(p.canvas.height*1.4)})}>{t.cropExpand}</button></div>
      <svg ref={svg} className="crop-preview" viewBox={`${shownView.x} ${shownView.y} ${shownView.width} ${shownView.height}`} role="img" aria-label={t.cropPreview}>
        <defs><pattern id={`${uid}-grid`} width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#dbe0e6"/><path d="M0 0h20v20H0zM20 20h20v20H20z" fill="#eef1f5"/></pattern><clipPath id={`${uid}-inside`}><rect x={rect.x} y={rect.y} width={rect.width} height={rect.height}/></clipPath><filter id={`${uid}-blur`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={background.blur}/></filter></defs>
        <rect x={shownView.x} y={shownView.y} width={shownView.width} height={shownView.height} fill={`url(#${uid}-grid)`}/>
        <g clipPath={`url(#${uid}-inside)`}>
          {background.mode!=="transparent"&&<rect {...rect} fill={background.color}/>}
          {background.mode==="blur"&&<image href={p.background?.image??p.photo.previewSrc} x={rect.x-60} y={rect.y-60} width={rect.width+120} height={rect.height+120} preserveAspectRatio="xMidYMid slice" filter={`url(#${uid}-blur)`}/>}
        </g>
        <image href={preview} x={0} y={0} width={p.canvas.width} height={p.canvas.height}/>
        <path d={`M${shownView.x} ${shownView.y}h${shownView.width}v${shownView.height}h-${shownView.width}z M${rect.x} ${rect.y}h${rect.width}v${rect.height}h-${rect.width}z`} fill="#00000066" fillRule="evenodd" pointerEvents="none"/>
        <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill="transparent" stroke="#ffffff" strokeWidth="2" vectorEffect="non-scaling-stroke" className="crop-move" onPointerDown={event=>start(event,"move")} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}/>
        <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill="none" stroke="#326bc0" strokeWidth="1" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" pointerEvents="none"/>
        {[1,2].map(part=><g key={part} stroke="#ffffff88" strokeWidth="1" vectorEffect="non-scaling-stroke" pointerEvents="none"><line x1={rect.x+rect.width*part/3} y1={rect.y} x2={rect.x+rect.width*part/3} y2={rect.y+rect.height}/><line x1={rect.x} y1={rect.y+rect.height*part/3} x2={rect.x+rect.width} y2={rect.y+rect.height*part/3}/></g>)}
        {handles.map(([edge,x,y])=><g key={edge}><circle cx={x} cy={y} r={radius*2} fill="transparent" style={{cursor:`${edge}-resize`}} onPointerDown={event=>start(event,edge)} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}/><circle cx={x} cy={y} r={radius} fill="white" stroke="#326bc0" strokeWidth="2" vectorEffect="non-scaling-stroke" pointerEvents="none"/></g>)}
      </svg>
      <div className="crop-dimensions">{(["x","y","width","height"] as const).map(key=><label key={key}>{t[key==="x"?"cropX":key==="y"?"cropY":key==="width"?"cropWidth":"cropHeight"]}<input type="number" disabled={busy} value={rect[key]} min={key==="x"||key==="y"?-12000:100} max={12000} onChange={event=>{if(event.target.value!==""&&Number.isFinite(event.target.valueAsNumber))setRect({...rect,[key]:Math.round(event.target.valueAsNumber)});}}/></label>)}</div>
      <p className="field-note">{expanding?t.cropExpandNote:t.cropCutNote}</p>
      <h3>{t.cropBackground}</h3><div className="segmented">{(["color","blur","transparent"] as const).map(mode=><button disabled={busy} key={mode} className={background.mode===mode?"active":""} onClick={()=>setBackground({...background,mode})}>{t[mode==="color"?"cropColor":mode==="blur"?"cropBlur":"cropTransparent"]}</button>)}</div>
      {background.mode==="color"&&<label className="field-row">{t.cropColor}<input aria-label={t.cropColor} type="color" value={background.color} disabled={busy} onChange={event=>setBackground({...background,color:event.target.value})}/></label>}
      {background.mode==="blur"&&<Slider name={t.cropBlurStrength} value={background.blur} max={60} onChange={blur=>setBackground({...background,blur})} onEnd={()=>{}}/>}
      {error&&<p role="alert" className="field-error">{t.cropError}</p>}
      <div className="modal-actions"><button disabled={busy} onClick={onClose}>{t.cancel}</button><button className="primary" disabled={busy||!validCrop(rect)} onClick={async()=>{setBusy(true);setError(false);try{await onApply(rect,background);}catch{setError(true);setBusy(false);}}}>{busy?t.loading:t.cropApply}</button></div>
    </div>
  </Modal>;
}
