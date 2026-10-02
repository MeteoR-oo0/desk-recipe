import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Stage, Layer, Image as CanvasImage, Rect } from "react-konva";
import { ProductLabel } from "./ProductLabel";
import { useCanvasZoom } from "../hooks/useCanvasZoom";
import { labelLayout, formatPrice } from "../lib/labelLayout";
import { adjustedImage } from "../lib/project";
import type { ProjectData, ProductLabel as Label } from "../types/project";
export type CanvasHandle = {
  stage: Konva.Stage | null;
  image: HTMLImageElement | null;
  resetView?: () => void;
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
        ),
      );
  }, [image, project.adjustment.brightness, project.adjustment.contrast]);
  useEffect(() => {
    let active = true;
    Promise.all(
      project.labels.flatMap((l) => [
        document.fonts.load(`400 17px "${l.fontFamily}"`, l.brand + l.price),
        document.fonts.load(`700 28px "${l.fontFamily}"`, l.productName),
        document.fonts.load('400 17px "Zen Maru Gothic"', l.brand + l.price),
        document.fonts.load('700 28px "Zen Maru Gothic"', l.productName),
      ]),
    ).then(() => {
      if (active) setFontRevision((v) => v + 1);
    });
    return () => {
      active = false;
    };
  }, [
    project.labels
      .map((l) => l.fontFamily + l.brand + l.productName + l.price)
      .join(","),
  ]);
  useEffect(() => {
    handle.current = {
      stage: stageRef.current,
      image,
      resetView: () => {
        setPan({ x: 0, y: 0 });
        onZoom(1);
      },
    };
  }, [image, handle, onZoom]);
  useEffect(() => {
    setPan({ x: 0, y: 0 });
    onZoom(1);
  }, [project.canvas.aspectRatio, project.photo.id]);
  const scale = Math.max(
      0.01,
      Math.min(
        (size.width - 48) / project.canvas.width,
        (size.height - 48) / project.canvas.height,
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
        ?.find(".product-label, .editor-decoration")
        .forEach((n) => n.stopDrag());
    },
  });
  const obstacles = project.labels.map((l) => ({
    id: l.id,
    x: l.x,
    y: l.y,
    width: l.boxWidth ?? 330,
    height: labelLayout(
      { ...l, price: formatPrice(l.price, project.priceFormat) },
      project.priceMode === "show" ||
        (project.priceMode === "individual" && l.showPrice),
    ).height,
  }));
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
  return (
    <div className={"canvas-holder mode-" + mode} ref={holder} {...touch}>
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
            width={project.canvas.width}
            height={project.canvas.height}
            fill="#e3e6e5"
          />
          {image && (
            <CanvasImage
              name="photo"
              image={pixels ?? image}
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
            opacity={project.adjustment.overlay / 100}
          />
          {project.labels.map((label) => (
            <ProductLabel
              key={label.id}
              label={label}
              panMode={mode === "pan"}
              fontRevision={fontRevision}
              obstacles={obstacles}
              scale={scale}
              bounds={project.canvas}
              selected={selectedId === label.id}
              priceMode={project.priceMode}
              priceFormat={project.priceFormat}
              onSelect={() => onSelect(label.id)}
              onChange={(patch) => onChange(label.id, patch)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
