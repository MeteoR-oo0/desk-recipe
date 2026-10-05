import { useEffect, useRef, useState, useMemo } from "react";
import Konva from "konva";
import { Stage, Layer, Image as CanvasImage, Rect } from "react-konva";
import { ProductLabel } from "./ProductLabel";
import { useCanvasZoom } from "../hooks/useCanvasZoom";
import { labelLayout, formatPrice } from "../lib/labelLayout";
import { adjustedImage } from "../lib/project";
import {formatLabelNumber,numberedBrand} from "../lib/labelOrder";
import {isLabelVisible} from "../lib/labelVisibility";
import {backgroundColor,blurredCanvasBackground,composedPhoto,withDarkness} from "../lib/canvasBackground";
import type { ProjectData, ProductLabel as Label } from "../types/project";
export type CanvasHandle = {
  stage: Konva.Stage | null;
  image: HTMLImageElement | null;
  resetView?: () => void;
  focusLabel?: (id: string) => void;
  flashLabel?: (id: string) => void;
};
export function CanvasEditor({
  project,
  selectedId,
  onSelect,
  onChange,
  onAdd,
  mode,
  zoom,
  onZoom,
  handle,
}: {
  project: ProjectData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<Label>) => void;
  onAdd: (x: number, y: number) => void;
  mode: "select" | "add" | "pan";
  zoom: number;
  onZoom: (zoom: number) => void;
  handle: React.RefObject<CanvasHandle>;
}) {
  const holder = useRef<HTMLDivElement>(null),
    stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ width: 800, height: 520 }),
    [image, setImage] = useState<HTMLImageElement | null>(null),
    [pixels, setPixels] = useState<HTMLCanvasElement | null>(null),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [fontRevision, setFontRevision] = useState(0);
  const [flash,setFlash]=useState<{id:string;key:number}|null>(null);
  const [backgroundImage,setBackgroundImage]=useState<HTMLImageElement|null>(null);
  useEffect(()=>{let active=true;setBackgroundImage(null);if(project.background?.image){const img=new window.Image();img.onload=()=>{if(active)setBackgroundImage(img);};img.src=project.background.image;}return()=>{active=false;};},[project.background?.image]);
  const backdrop=useMemo(()=>project.background?.mode==="blur"&&backgroundImage?withDarkness(blurredCanvasBackground(backgroundImage,project.canvas,project.background.blur,project.adjustment.brightness,project.adjustment.contrast),project.adjustment.overlay) as HTMLCanvasElement:null,[backgroundImage,project.background?.mode,project.background?.blur,project.canvas.width,project.canvas.height,project.adjustment.brightness,project.adjustment.contrast,project.adjustment.overlay]);
  const foreground=useMemo(()=>image?withDarkness(pixels??image,project.adjustment.overlay):null,[pixels,image,project.adjustment.overlay]);
  const scenePixels=useMemo(()=>foreground&&project.background?composedPhoto(foreground,project.canvas,backdrop,backgroundColor(project.background)):foreground,[foreground,backdrop,project.background,project.canvas.width,project.canvas.height]);
  useEffect(()=>{if(!flash)return;const timer=setTimeout(()=>setFlash(null),1850);return()=>clearTimeout(timer);},[flash]);
  useEffect(() => {
    const observer = new ResizeObserver(([e]) =>
      setSize({ width: e.contentRect.width, height: e.contentRect.height }),
    );
    if (holder.current) observer.observe(holder.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const previous = Konva.hitOnDragEnabled;
    Konva.hitOnDragEnabled = true;
    return () => {
      Konva.hitOnDragEnabled = previous;
    };
  }, []);
  useEffect(() => {
    let active = true;
    const img = new window.Image();
    img.onload = () => {
      if (active) setImage(img);
    };
    img.src = project.photo.previewSrc;
    return () => {
      active = false;
    };
  }, [project.photo.previewSrc]);
  useEffect(() => {
    if (image)
      setPixels(
        adjustedImage(
          image,
          project.adjustment.brightness,
          project.adjustment.contrast,
          project.adjustment.blur ?? 0,
          project.canvas,
        ),
      );
  }, [image, project.adjustment.brightness, project.adjustment.contrast, project.adjustment.blur, project.canvas.width, project.canvas.height]);
  useEffect(() => {
    let active = true;
    Promise.all(
      project.labels.flatMap((l,i) => [
        document.fonts.load(`${l.fontWeight??400} 17px "${l.fontFamily}"`, numberedBrand({...l,labelNumber:formatLabelNumber(i+1,project.numberStyle)}) + l.price + (l.description??"")),
        document.fonts.load(`${l.fontWeight??700} 28px "${l.fontFamily}"`, l.productName),
        document.fonts.load(`${l.fontWeight??400} 17px "${["Inter","Montserrat"].includes(l.fontFamily)?"Noto Sans JP":"Zen Maru Gothic"}"`, numberedBrand({...l,labelNumber:formatLabelNumber(i+1,project.numberStyle)}) + l.price + (l.description??"")),
        document.fonts.load(`${l.fontWeight??700} 28px "${["Inter","Montserrat"].includes(l.fontFamily)?"Noto Sans JP":"Zen Maru Gothic"}"`, l.productName),
      ]),
    ).then(() => {
      if (active) setFontRevision((v) => v + 1);
    });
    return () => {
      active = false;
    };
  }, [
    project.labels
      .map((l) => l.fontFamily + l.brand + l.productName + l.price + (l.description??"") + (l.fontWeight??""))
      .join(",") + (project.numberStyle??"none"),
  ]);
  useEffect(() => {
    handle.current = {
      stage: stageRef.current,
      image,
      flashLabel: id => setFlash({id,key:Date.now()}),
      resetView: () => {
        setPan({ x: 0, y: 0 });
        onZoom(1);
      },
      focusLabel: (id) => {
        const l = project.labels.find((item) => item.id === id);
        if (!l || !isLabelVisible(l)) return;
        const h = labelLayout({...l,labelNumber:formatLabelNumber(project.labels.findIndex(item=>item.id===id)+1,project.numberStyle)}, project.priceMode === "show" || (project.priceMode === "individual" && l.showPrice)).height;
        const left = Math.min(l.x - 20, l.arrowTargetX - 20), right = Math.max(l.x + (l.boxWidth ?? 330) + 20, l.arrowTargetX + 20);
        const top = Math.min(l.y - 20, l.arrowTargetY - 20), bottom = Math.max(l.y + h + 20, l.arrowTargetY + 20);
        const padding = size.width <= 800 ? 20 : 48;
        const base = Math.max(0.01, Math.min((size.width - padding) / project.canvas.width, (size.height - padding) / project.canvas.height));
        const nextZoom = Math.min(6, Math.max(1, Math.min((size.width - 50) / (right - left), (size.height - 50) / (bottom - top), 1) / base));
        const s = base * nextZoom;
        onZoom(nextZoom);
        setPan({ x: (project.canvas.width / 2 - (left + right) / 2) * s, y: (project.canvas.height / 2 - (top + bottom) / 2) * s });
      },
    };
  }, [image, handle, onZoom, size, project.labels, project.canvas, project.priceMode, project.numberStyle]);
  useEffect(() => {
    setPan({ x: 0, y: 0 });
    onZoom(1);
  }, [project.canvas.aspectRatio, project.photo.id]);
  const scale = Math.max(
      0.01,
      Math.min(
        (size.width - (size.width <= 800 ? 20 : 48)) / project.canvas.width,
        (size.height - (size.width <= 800 ? 20 : 48)) / project.canvas.height,
      ) * zoom,
    ),
    ox = (size.width - project.canvas.width * scale) / 2 + pan.x,
    oy = (size.height - project.canvas.height * scale) / 2 + pan.y,
    cover = image
      ? Math.max(
          project.canvas.width / image.width,
          project.canvas.height / image.height,
        )
      : 1;
  const touch = useCanvasZoom({
    zoom,
    pan,
    scale,
    size,
    canvas: project.canvas,
    onZoom,
    onPan: setPan,
    getViewport: () => ({
      x: stageRef.current!.x(),
      y: stageRef.current!.y(),
      scale: stageRef.current!.scaleX(),
    }),
    stopDrag: () => {
      stageRef.current?.stopDrag();
      stageRef.current
        ?.find(".product-label, .editor-decoration, .label-image-group")
        .forEach((n) => n.stopDrag());
    },
  });
  const obstacles = project.labels.flatMap((l,i) => isLabelVisible(l)?[{
    id: l.id,
    framePadding: l.frame && l.frame.style !== "none" ? 14 + (l.frame.borderWidth ?? 1)/2 : 0,
    x: l.x,
    y: l.y,
    width: l.boxWidth ?? 330,
    height: labelLayout(
      { ...l, labelNumber:formatLabelNumber(i+1,project.numberStyle), price: formatPrice(l.price, project.priceFormat) },
      project.priceMode === "show" ||
        (project.priceMode === "individual" && l.showPrice),
    ).height,
  }]:[]);
  const tap = () => {
    if (touch.suppressed.current) return;
    const p = stageRef.current!.getRelativePointerPosition();
    if (
      mode === "add" &&
      p &&
      p.x >= 0 &&
      p.y >= 0 &&
      p.x <= project.canvas.width &&
      p.y <= project.canvas.height
    )
      onAdd(p.x, p.y);
    else onSelect(null);
  };
  const flashItem=flash&&obstacles.find(item=>item.id===flash.id);
  return (
    <div className={"canvas-holder mode-" + mode+(project.background?.mode==="transparent"?" has-transparency":"")} data-guide="canvas" ref={holder} {...touch}>
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={ox}
        y={oy}
        scaleX={scale}
        scaleY={scale}
        draggable={mode === "pan"}
        onDragEnd={(e) => {
          if (e.target === stageRef.current)
            setPan({
              x: e.target.x() - (size.width - project.canvas.width * scale) / 2,
              y:
                e.target.y() -
                (size.height - project.canvas.height * scale) / 2,
            });
        }}
        onWheel={(e) => {
          e.evt.preventDefault();
          const pointer = stageRef.current!.getPointerPosition();
          if (!pointer) return;
          const next = Math.max(
              0.5,
              Math.min(6, zoom * (e.evt.deltaY > 0 ? 0.9 : 1.1)),
            ),
            s = (scale / zoom) * next,
            q = { x: (pointer.x - ox) / scale, y: (pointer.y - oy) / scale };
          setPan({
            x:
              pointer.x - q.x * s - (size.width - project.canvas.width * s) / 2,
            y:
              pointer.y -
              q.y * s -
              (size.height - project.canvas.height * s) / 2,
          });
          onZoom(next);
        }}
        onClick={tap}
        onTap={tap}
      >
        <Layer
          name="artwork"
          clipX={0}
          clipY={0}
          clipWidth={project.canvas.width}
          clipHeight={project.canvas.height}
        >
          <Rect
            name="canvas-background"
            width={project.canvas.width}
            height={project.canvas.height}
            fill={backgroundColor(project.background)}
          />
          {project.background?.mode==="blur"&&<CanvasImage name="background-photo" image={backdrop??undefined} width={project.canvas.width} height={project.canvas.height} listening={false}/>}
          {image && (
            <CanvasImage
              name="photo"
              image={foreground??pixels??image}
              x={(project.canvas.width - image.width * cover) / 2}
              y={(project.canvas.height - image.height * cover) / 2}
              width={image.width * cover}
              height={image.height * cover}
            />
          )}
          <Rect
            name="overlay"
            width={project.canvas.width}
            height={project.canvas.height}
            fill="black"
            opacity={0}
          />
          {project.labels.map((label,index) => isLabelVisible(label) && (
            <ProductLabel
              key={label.id}
              label={{...label,labelNumber:formatLabelNumber(index+1,project.numberStyle)}}
              panMode={mode === "pan"}
              fontRevision={fontRevision}
              obstacles={obstacles}
              scale={scale}
              bounds={project.canvas}
              photoPixels={scenePixels}
              overlay={0}
              selected={selectedId === label.id}
              priceMode={project.priceMode}
              priceFormat={project.priceFormat}
              onSelect={() => onSelect(label.id)}
              onChange={(patch) => onChange(label.id, patch)}
            />
          ))}
        </Layer>
      </Stage>
      {flashItem&&<div key={flash!.key} className="new-label-highlight" aria-hidden="true" data-new-label={flash!.id}
        style={{left:ox+flashItem.x*scale-8,top:oy+flashItem.y*scale-8,width:flashItem.width*scale+16,height:flashItem.height*scale+16}}/>}
    </div>
  );
}
